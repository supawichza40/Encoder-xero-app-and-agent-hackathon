"""
Xero MCP client wrapper + raw REST helpers.

MCP calls: all accounting operations via npx @xeroapi/xero-mcp-server@latest.
Raw REST:  attachment PUT (E2), history note PUT (E6), account creation
           (PUT Accounts — MCP has no create-account tool), invoice
           authorisation (POST Invoices/{id} — MCP creates DRAFT and cannot
           authorise; create-payment requires AUTHORISED), and bank transfers
           (PUT BankTransfers — the net sweep Clearing → Business Bank).
           Token is minted via client-credentials.

MCP wire format (v0.0.17): tools reply with one or more TEXT content blocks, NOT
JSON. `structuredContent` is None. A list-* tool returns a header block ("Found N
accounts:") followed by one block per record; each record block is a set of
"Key: Value" lines. Detail/create tools return a single record block. Errors come
back as a text block starting with "Error …". `_call` parses those text blocks into
dicts and RAISES XeroMCPError on error text (so failures are loud, not a silent
`'str'.get` crash).

MCP request format (v0.0.17): create tools take GUIDs, not names/codes —
create-invoice needs `contactId`; create-bank-transaction needs `bankAccountId` +
`contactId`; create-payment needs `invoiceId` + `accountId`. Every line item needs a
`taxType`. This module resolves names/codes → GUIDs via list-contacts / list-accounts
(cached) before issuing writes.

Rate-limit: on 429, honour Retry-After header, sleep, retry once.
MCP v0.0.17: update-bank-transaction is broken — create-* only; invoices are created
DRAFT and cannot be authorised via MCP.
"""

import asyncio
import json
import logging
import os
import re
from contextlib import AsyncExitStack
from decimal import Decimal
from typing import Any

import httpx
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from .config import (
    CLEARING_ACCOUNT_CODE,
    CLEARING_ACCOUNT_NAME,
    FEES_ACCOUNT_CODE,
    XERO_CLIENT_ID,
    XERO_CLIENT_SECRET,
    XERO_SCOPES,
)
from .models import FeeLineItem

logger = logging.getLogger(__name__)

XERO_TOKEN_URL = "https://identity.xero.com/connect/token"
XERO_API_BASE = "https://api.xero.com/api.xro/2.0"

# VAT-free demo: every line item is coded "No VAT". Xero's TaxType for that is NONE.
NO_VAT_TAX_TYPE = "NONE"

_GUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)


class XeroMCPError(Exception):
    """Raised when a Xero MCP tool call returns an error."""


class XeroClient:
    """
    Wrapper around the Xero MCP server subprocess + raw REST for attachments/history.

    Usage (via FastAPI lifespan):
        client = XeroClient()
        await client.connect()
        # ... use methods ...
        await client.disconnect()
    """

    def __init__(self) -> None:
        self._session: ClientSession | None = None
        self._exit_stack = AsyncExitStack()
        # Token cache for raw REST calls — (token_str, expires_at_unix)
        self._token_cache: tuple[str, float] | None = None
        # Resolution caches — persist for the client's lifetime (chart of accounts /
        # contacts do not change mid golden-path, and this keeps us under the rate cap).
        self._accounts_cache: list[dict[str, str]] | None = None
        self._contact_id_cache: dict[str, str] = {}

    # ── Lifecycle ──────────────────────────────────────────────────────────

    async def connect(self) -> None:
        """Start the MCP subprocess and establish the protocol connection."""
        env = {**os.environ}
        # A client-credentials Custom Connection must omit scope. The MCP server treats
        # an empty/unset XERO_SCOPES as "pick granular scopes automatically", so only
        # forward XERO_SCOPES when it is non-empty; otherwise drop it from the env.
        if XERO_SCOPES:
            env["XERO_SCOPES"] = XERO_SCOPES
        else:
            env.pop("XERO_SCOPES", None)
        env["XERO_CLIENT_ID"] = XERO_CLIENT_ID
        env["XERO_CLIENT_SECRET"] = XERO_CLIENT_SECRET

        server_params = StdioServerParameters(
            command="npx",
            args=["-y", "@xeroapi/xero-mcp-server@latest"],
            env=env,
        )
        read, write = await self._exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        self._session = await self._exit_stack.enter_async_context(
            ClientSession(read, write)
        )
        await self._session.initialize()
        logger.info("XeroClient connected to MCP server")

    async def disconnect(self) -> None:
        """Shut down the MCP subprocess gracefully."""
        await self._exit_stack.aclose()
        self._session = None
        logger.info("XeroClient disconnected")

    # ── Internal MCP helpers ────────────────────────────────────────────────

    @staticmethod
    def _parse_record(text: str) -> dict[str, str]:
        """
        Parse one MCP text block ("Key: Value" lines) into a dict.
        Strips the ` || "fallback"` suffix the server appends to nullable fields.
        Header / count lines (e.g. "Found 90 accounts:") contain no "Key: Value"
        pair and yield an empty dict, which the caller drops.
        """
        record: dict[str, str] = {}
        for line in text.splitlines():
            line = line.strip()
            if ": " not in line:
                continue
            key, _, value = line.partition(": ")
            key = key.strip()
            if not key:
                continue
            # e.g. `Name: Demo Company (UK) || "No name available."` → `Demo Company (UK)`
            value = value.split(" || ")[0].strip()
            record[key] = value
        return record

    @staticmethod
    def _looks_like_rate_limit(text: str) -> bool:
        low = text.lower()
        return "429" in text or "rate limit" in low or "too many requests" in low

    @staticmethod
    def _parse_retry_after(text: str) -> int:
        m = re.search(r"retry[- ]?after[:\s]+(\d+)", text, re.IGNORECASE)
        return int(m.group(1)) if m else 60

    async def _call_text_blocks(
        self, tool_name: str, arguments: dict[str, Any]
    ) -> list[str]:
        """
        Call a Xero MCP tool and return its raw text content blocks.
        Raises XeroMCPError on an error response ("Error …" text or isError).
        Retries once on 429 after honouring Retry-After.
        """
        if not self._session:
            raise RuntimeError("XeroClient is not connected — call connect() first")

        for attempt in range(2):
            try:
                result = await self._session.call_tool(tool_name, arguments)
            except Exception as exc:
                raise XeroMCPError(f"MCP call failed for '{tool_name}': {exc}") from exc

            texts = [
                block.text
                for block in result.content
                if hasattr(block, "text") and block.text is not None
            ]

            is_error = bool(getattr(result, "isError", False)) or (
                bool(texts) and texts[0].lstrip().startswith("Error")
            )
            if is_error:
                err_text = texts[0] if texts else f"{tool_name} returned an error"
                if attempt == 0 and self._looks_like_rate_limit(err_text):
                    wait = self._parse_retry_after(err_text)
                    logger.warning("%s rate limited — sleeping %ds", tool_name, wait)
                    await asyncio.sleep(wait)
                    continue
                raise XeroMCPError(f"{tool_name}: {err_text}")

            if not texts:
                logger.warning("Empty response from %s", tool_name)
            return texts

        raise XeroMCPError(f"{tool_name}: rate limit exceeded after retry")

    async def _call(
        self, tool_name: str, arguments: dict[str, Any]
    ) -> list[dict[str, str]]:
        """
        Call an MCP tool and return a LIST of parsed record dicts (header/empty
        blocks dropped). Use for list-*/find-* tools.
        """
        texts = await self._call_text_blocks(tool_name, arguments)
        records = [self._parse_record(t) for t in texts]
        return [r for r in records if r]

    async def _call_one(
        self, tool_name: str, arguments: dict[str, Any]
    ) -> dict[str, str]:
        """Call an MCP tool and return the first parsed record (detail/create tools)."""
        records = await self._call(tool_name, arguments)
        return records[0] if records else {}

    async def _call_joined_text(
        self, tool_name: str, arguments: dict[str, Any]
    ) -> str:
        """Call an MCP tool and return the joined raw text (for inline-ID parsing)."""
        return "\n".join(await self._call_text_blocks(tool_name, arguments))

    # ── GUID resolution (cached) ────────────────────────────────────────────

    async def _get_account_id(self, code: str) -> str | None:
        """Resolve a chart-of-accounts code (e.g. '810') to its AccountID GUID."""
        for account in await self.list_accounts():
            if str(account.get("Code", "")) == str(code):
                return account.get("ID")
        return None

    async def _get_contact_id(self, name: str) -> str:
        """Resolve (find-or-create) a contact name to its ContactID GUID, cached."""
        if name not in self._contact_id_cache:
            self._contact_id_cache[name] = await self.create_contact(name)
        return self._contact_id_cache[name]

    # ── Raw REST token helper (E2, E6) ─────────────────────────────────────

    async def _get_access_token(self) -> str:
        """
        Mint (or return cached) a client-credentials access token.
        Scope is omitted (empty) so the connection's granular scopes are granted.
        Tokens are cached for their lifetime minus a 30s buffer.
        """
        import time

        now = time.time()
        if self._token_cache:
            token, expires_at = self._token_cache
            if now < expires_at:
                return token

        if not XERO_CLIENT_ID or not XERO_CLIENT_SECRET:
            raise RuntimeError("XERO_CLIENT_ID / XERO_CLIENT_SECRET not set")

        data = {"grant_type": "client_credentials"}
        # Client-credentials Custom Connection: only send scope if explicitly configured
        # (normally empty → Xero grants the connection's granular scopes).
        if XERO_SCOPES:
            data["scope"] = XERO_SCOPES

        async with httpx.AsyncClient(timeout=15) as http:
            resp = await http.post(
                XERO_TOKEN_URL,
                data=data,
                auth=(XERO_CLIENT_ID, XERO_CLIENT_SECRET),
            )
            resp.raise_for_status()
            payload = resp.json()

        token = payload["access_token"]
        expires_in = int(payload.get("expires_in", 1800))
        self._token_cache = (token, now + expires_in - 30)
        logger.info("Minted new Xero access token (expires in %ds)", expires_in)
        return token

    # ── E2 — Attach source CSV to invoice ──────────────────────────────────

    async def attach_file(
        self,
        invoice_id: str,
        filename: str,
        content_bytes: bytes,
    ) -> bool:
        """
        PUT the raw CSV bytes as an attachment on the Xero invoice.
        Returns True on success. Non-fatal — caller must catch and log.
        Scope: accounting.attachments
        """
        token = await self._get_access_token()
        # filename derives from CSV-supplied data (payout_ref); strip any path
        # segments and URL-encode so it can't steer the authenticated PUT's path/query.
        from urllib.parse import quote

        safe_filename = quote(filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1], safe="") or "attachment.csv"
        url = f"{XERO_API_BASE}/Invoices/{invoice_id}/Attachments/{safe_filename}"

        for attempt in range(2):
            async with httpx.AsyncClient(timeout=30) as http:
                resp = await http.put(
                    url,
                    content=content_bytes,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "text/csv",
                        "xero-tenant-id": await self._get_tenant_id(),
                    },
                )
            if resp.status_code == 429 and attempt == 0:
                retry_after = int(resp.headers.get("Retry-After", 60))
                logger.warning("Attachment rate limited — sleeping %ds", retry_after)
                await asyncio.sleep(retry_after)
                continue
            if resp.status_code not in (200, 201):
                logger.warning(
                    "attach_file failed: %s %s", resp.status_code, resp.text[:200]
                )
                return False
            logger.info("CSV attached to invoice %s as '%s'", invoice_id, filename)
            return True

        return False

    # ── E6 — History note on created objects ───────────────────────────────

    async def add_history_note(
        self,
        endpoint: str,
        guid: str,
        note: str,
    ) -> bool:
        """
        PUT a history record on a Xero object (Invoice, CreditNote,
        BankTransaction, Payment).
        endpoint examples: "Invoices", "CreditNotes", "BankTransactions", "Payments"
        Returns True on success. Non-fatal — caller must catch and log.
        """
        token = await self._get_access_token()
        url = f"{XERO_API_BASE}/{endpoint}/{guid}/History"
        payload = {"HistoryRecords": [{"Details": note}]}

        for attempt in range(2):
            async with httpx.AsyncClient(timeout=15) as http:
                resp = await http.put(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                        "xero-tenant-id": await self._get_tenant_id(),
                    },
                )
            if resp.status_code == 429 and attempt == 0:
                await asyncio.sleep(int(resp.headers.get("Retry-After", 60)))
                continue
            if resp.status_code not in (200, 201):
                logger.warning(
                    "add_history_note failed [%s/%s]: %s %s",
                    endpoint, guid, resp.status_code, resp.text[:200],
                )
                return False
            logger.info("History note added to %s/%s", endpoint, guid)
            return True

        return False

    async def _rest_headers(self) -> dict[str, str]:
        """Auth + tenant headers for raw REST JSON calls."""
        return {
            "Authorization": f"Bearer {await self._get_access_token()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "xero-tenant-id": await self._get_tenant_id(),
        }

    async def _rest_request(
        self, method: str, url: str, payload: dict[str, Any], what: str
    ) -> dict[str, Any]:
        """
        Issue a raw REST JSON request. Retries once on 429 (honours Retry-After).
        Raises XeroMCPError on any non-2xx response so failures are loud.
        """
        headers = await self._rest_headers()
        for attempt in range(2):
            async with httpx.AsyncClient(timeout=30) as http:
                resp = await http.request(method, url, json=payload, headers=headers)
            if resp.status_code == 429 and attempt == 0:
                retry_after = int(resp.headers.get("Retry-After", 60))
                logger.warning("%s rate limited — sleeping %ds", what, retry_after)
                await asyncio.sleep(retry_after)
                continue
            if resp.status_code not in (200, 201):
                raise XeroMCPError(f"{what} failed: {resp.status_code} {resp.text[:300]}")
            return resp.json()
        raise XeroMCPError(f"{what}: rate limit exceeded after retry")

    # ── Raw REST writes MCP cannot do ──────────────────────────────────────

    async def authorise_invoice(self, invoice_id: str) -> bool:
        """
        Move a DRAFT invoice to AUTHORISED via raw REST (accounting.invoices).
        MCP v0.0.17 creates invoices DRAFT and cannot authorise them; a DRAFT
        invoice has no ledger impact and cannot take a payment.
        Raises XeroMCPError on failure — the payment step depends on this.
        """
        body = await self._rest_request(
            "POST",
            f"{XERO_API_BASE}/Invoices/{invoice_id}",
            {"InvoiceID": invoice_id, "Status": "AUTHORISED"},
            f"authorise_invoice({invoice_id})",
        )
        status = (body.get("Invoices") or [{}])[0].get("Status", "")
        if status != "AUTHORISED":
            raise XeroMCPError(
                f"authorise_invoice({invoice_id}): status is '{status}', not AUTHORISED"
            )
        logger.info("Invoice %s authorised", invoice_id)
        return True

    async def create_account(
        self,
        name: str,
        code: str,
        account_type: str,
        bank_account_number: str | None = None,
    ) -> str:
        """
        Create a chart-of-accounts entry via raw REST (accounting.settings) —
        MCP has no create-account tool. BANK accounts require a (dummy)
        BankAccountNumber. Returns the new AccountID GUID.
        """
        payload: dict[str, Any] = {"Code": code, "Name": name, "Type": account_type}
        if account_type == "BANK":
            payload["BankAccountNumber"] = bank_account_number or "00000000"
        body = await self._rest_request(
            "PUT", f"{XERO_API_BASE}/Accounts", payload, f"create_account({name})"
        )
        account_id = (body.get("Accounts") or [{}])[0].get("AccountID", "")
        if not account_id:
            raise XeroMCPError(f"create_account({name}): no AccountID in response")
        self._accounts_cache = None  # chart changed — invalidate resolution cache
        logger.info("Created account '%s' (code %s): %s", name, code, account_id)
        return account_id

    async def find_bank_transfer(
        self, from_code: str, to_code: str, amount: Decimal
    ) -> str | None:
        """
        Return the BankTransferID of an existing transfer matching from/to
        account codes and amount, else None (seed idempotency — BankTransfers
        carry no reference field to key on).
        """
        headers = await self._rest_headers()
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.get(f"{XERO_API_BASE}/BankTransfers", headers=headers)
        if resp.status_code != 200:
            raise XeroMCPError(
                f"find_bank_transfer: {resp.status_code} {resp.text[:300]}"
            )
        for xfer in resp.json().get("BankTransfers", []):
            if (
                str(xfer.get("FromBankAccount", {}).get("Code", "")) == str(from_code)
                and str(xfer.get("ToBankAccount", {}).get("Code", "")) == str(to_code)
                and Decimal(str(xfer.get("Amount", "0"))) == amount
            ):
                return xfer.get("BankTransferID")
        return None

    async def create_bank_transfer(
        self, from_code: str, to_code: str, amount: Decimal
    ) -> str:
        """
        Create a bank transfer between two BANK accounts via raw REST
        (PUT BankTransfers). Used to move the net payout from Platform
        Clearing to the Business Bank Account. Returns the BankTransferID.
        """
        body = await self._rest_request(
            "PUT",
            f"{XERO_API_BASE}/BankTransfers",
            {
                "BankTransfers": [
                    {
                        "FromBankAccount": {"Code": from_code},
                        "ToBankAccount": {"Code": to_code},
                        "Amount": float(amount),
                    }
                ]
            },
            f"create_bank_transfer({from_code}->{to_code} {amount})",
        )
        transfer_id = (body.get("BankTransfers") or [{}])[0].get("BankTransferID", "")
        if not transfer_id:
            raise XeroMCPError("create_bank_transfer: no BankTransferID in response")
        logger.info(
            "Bank transfer %s → %s £%s created: %s", from_code, to_code, amount, transfer_id
        )
        return transfer_id

    async def _get_tenant_id(self) -> str:
        """
        Retrieve the Xero tenant ID (organisation UUID) via the Connections API.
        Cached on first call.
        """
        if not hasattr(self, "_tenant_id_cache"):
            token = await self._get_access_token()
            async with httpx.AsyncClient(timeout=10) as http:
                resp = await http.get(
                    "https://api.xero.com/connections",
                    headers={"Authorization": f"Bearer {token}"},
                )
                resp.raise_for_status()
                connections = resp.json()
            if not connections:
                raise RuntimeError("No Xero connections found for these credentials")
            self._tenant_id_cache: str = connections[0]["tenantId"]
            logger.info("Xero tenant ID: %s", self._tenant_id_cache)
        return self._tenant_id_cache

    # ── Read operations ────────────────────────────────────────────────────

    async def list_organisation_details(self) -> dict[str, Any]:
        """Return org details (keys: Name, Legal Name, Is Demo Company, …). For /health."""
        return await self._call_one("list-organisation-details", {})

    async def list_accounts(self) -> list[dict[str, Any]]:
        """
        List all Chart of Accounts entries (keys per record: Account, Code, ID,
        Type, Status, …). Cached for the client's lifetime.
        """
        if self._accounts_cache is None:
            self._accounts_cache = await self._call("list-accounts", {})
        return self._accounts_cache

    async def list_bank_transactions(self) -> list[dict[str, Any]]:
        """List bank transactions (page 1). Keys: 'Bank Transaction ID', Reference, …."""
        return await self._call("list-bank-transactions", {"page": 1})

    async def list_profit_and_loss(self) -> dict[str, Any]:
        """Fetch P&L report. MCP returns formatted text; extract_pnl_snapshot degrades."""
        return await self._report_dict("list-profit-and-loss", {})

    async def list_trial_balance(self) -> dict[str, Any]:
        """Fetch trial balance report (E4)."""
        return await self._report_dict("list-trial-balance", {})

    async def list_aged_receivables_by_contact(self) -> dict[str, Any]:
        """Fetch aged receivables by contact (E4)."""
        return await self._report_dict("list-aged-receivables-by-contact", {})

    async def list_report_balance_sheet(self) -> dict[str, Any]:
        """Fetch balance sheet report (E4)."""
        return await self._report_dict("list-report-balance-sheet", {})

    async def _report_dict(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        """Return a report tool's raw text under 'raw_text' (report parsers degrade)."""
        return {"raw_text": await self._call_joined_text(tool_name, arguments)}

    async def list_tax_rates(self) -> list[dict[str, Any]]:
        """List all tax rates (E5)."""
        return await self._call("list-tax-rates", {})

    async def list_tracking_categories(self) -> list[dict[str, Any]]:
        """List tracking categories (E3 seed check)."""
        return await self._call("list-tracking-categories", {})

    async def get_clearing_balance(self) -> Decimal:
        """
        Return the current balance of the Platform Clearing account from the trial
        balance (the ledger source — list-accounts carries no balance in MCP text).
        Returns 0 when the account is absent or fully cleared.
        """
        rows = await self._get_trial_balance_rows()
        return self._find_account_balance_in_rows(
            rows, CLEARING_ACCOUNT_NAME, CLEARING_ACCOUNT_CODE
        )

    async def _get_trial_balance_rows(self) -> Any:
        """
        Fetch the trial-balance report and return its ledger rows. The MCP tool
        serialises the report rows as a JSON string in its final text block.
        """
        blocks = await self._call_text_blocks("list-trial-balance", {})
        for text in reversed(blocks):
            stripped = text.strip()
            if stripped.startswith("[") or stripped.startswith("{"):
                try:
                    return json.loads(stripped)
                except json.JSONDecodeError:
                    continue
        return []

    @staticmethod
    def _find_account_balance_in_rows(rows: Any, name: str, code: str) -> Decimal:
        """
        Walk Xero report rows (nested {rowType, cells:[{value}], rows:[…]}) and return
        the debit-minus-credit balance of the row whose first cell matches the account
        name or code. Returns 0 when not found.
        """
        name_l = name.lower()
        found = Decimal("0")
        hit = False

        def cell_value(cell: dict) -> str:
            v = cell.get("value")
            if v is None:
                v = cell.get("Value")
            return str(v) if v is not None else ""

        def walk(row_list: Any) -> None:
            nonlocal found, hit
            if hit or not isinstance(row_list, list):
                return
            for row in row_list:
                if not isinstance(row, dict):
                    continue
                cells = row.get("cells") or row.get("Cells") or []
                if cells:
                    first = cell_value(cells[0])
                    if first and (name_l in first.lower() or (code and code in first)):
                        nums: list[Decimal] = []
                        for cell in cells[1:]:
                            raw = cell_value(cell).replace(",", "").strip()
                            try:
                                nums.append(Decimal(raw))
                            except Exception:
                                nums.append(Decimal("0"))
                        debit = nums[0] if len(nums) > 0 else Decimal("0")
                        credit = nums[1] if len(nums) > 1 else Decimal("0")
                        found = debit - credit
                        hit = True
                        return
                walk(row.get("rows") or row.get("Rows") or [])
                if hit:
                    return

        walk(rows if isinstance(rows, list) else rows.get("rows") if isinstance(rows, dict) else [])
        return found

    # ── Write operations ───────────────────────────────────────────────────

    async def create_invoice(
        self,
        contact_name: str,
        description: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """
        Create an ACCREC invoice for gross revenue. Returns Invoice ID.
        NB: MCP v0.0.17 creates invoices as DRAFT (no status arg); the executor
        must call authorise_invoice() before create-payment can be applied.
        """
        contact_id = await self._get_contact_id(contact_name)
        payload = {
            "type": "ACCREC",
            "contactId": contact_id,
            "reference": reference,
            "lineItems": [
                {
                    "description": description,
                    "quantity": 1,
                    "unitAmount": float(amount),
                    "accountCode": account_code,
                    "taxType": NO_VAT_TAX_TYPE,
                }
            ],
        }
        record = await self._call_one("create-invoice", payload)
        return record.get("ID") or "UNKNOWN"

    async def create_credit_note(
        self,
        contact_name: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """Create an ACCREC credit note for the refund amount (E1). Returns Credit Note ID."""
        contact_id = await self._get_contact_id(contact_name)
        payload = {
            "contactId": contact_id,
            "reference": reference,
            "lineItems": [
                {
                    "description": f"Marketplace refund — {reference}",
                    "quantity": 1,
                    "unitAmount": float(amount),
                    "accountCode": account_code,
                    "taxType": NO_VAT_TAX_TYPE,
                }
            ],
        }
        record = await self._call_one("create-credit-note", payload)
        return record.get("ID") or "UNKNOWN"

    async def create_bank_transaction(
        self,
        contact_name: str,
        lines: list[FeeLineItem],
        bank_account_code: str,
        reference: str,
    ) -> str:
        """Create a SPEND bank transaction from the clearing account for fees."""
        contact_id = await self._get_contact_id(contact_name)
        bank_account_id = await self._get_account_id(bank_account_code)
        if not bank_account_id:
            raise XeroMCPError(
                f"Bank account code {bank_account_code} not found in the Xero chart of "
                f"accounts (create-bank-transaction needs a bank-account GUID)."
            )
        payload = {
            "type": "SPEND",
            "bankAccountId": bank_account_id,
            "contactId": contact_id,
            "reference": reference,
            "lineItems": [
                {
                    "description": line.description,
                    "quantity": 1,
                    "unitAmount": float(line.amount),
                    "accountCode": FEES_ACCOUNT_CODE,
                    "taxType": NO_VAT_TAX_TYPE,
                }
                for line in lines
            ],
        }
        record = await self._call_one("create-bank-transaction", payload)
        return record.get("ID") or "UNKNOWN"

    async def create_payment(
        self,
        invoice_id: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """Create a payment clearing the net amount against the bank deposit."""
        account_id = await self._get_account_id(account_code)
        if not account_id:
            raise XeroMCPError(
                f"Payment account code {account_code} not found in the Xero chart of "
                f"accounts (create-payment needs an account GUID)."
            )
        payload = {
            "invoiceId": invoice_id,
            "accountId": account_id,
            "amount": float(amount),
            "reference": reference,
        }
        record = await self._call_one("create-payment", payload)
        return record.get("ID") or "UNKNOWN"

    # ── Seed operations ────────────────────────────────────────────────────

    async def create_contact(self, name: str) -> str:
        """Find-or-create a contact. Returns the Contact ID GUID."""
        existing = await self._call("list-contacts", {"searchTerm": name})
        for contact in existing:
            if (contact.get("Contact") or "").lower() == name.lower():
                cid = contact.get("ID", "")
                logger.info("Contact '%s' already exists: %s", name, cid)
                return cid

        # create-contact returns the id inline: `Contact created: <name> (ID: <guid>)`
        text = await self._call_joined_text("create-contact", {"name": name})
        m = re.search(r"\(ID:\s*(" + _GUID_RE.pattern + r")\)", text)
        if not m:
            m = _GUID_RE.search(text)
        if m:
            cid = m.group(1) if m.re.groups else m.group(0)
            logger.info("Created contact '%s': %s", name, cid)
            return cid
        raise XeroMCPError(f"create-contact returned unexpected result: {text}")

    async def create_receive_transaction(
        self,
        amount: Decimal,
        reference: str,
        account_code: str,
        contact_name: str,
    ) -> str:
        """Seed a net deposit RECEIVE bank transaction. Returns BankTransaction ID."""
        contact_id = await self._get_contact_id(contact_name)
        bank_account_id = await self._get_account_id(account_code)
        if not bank_account_id:
            raise XeroMCPError(
                f"Bank account code {account_code} not found — cannot seed RECEIVE deposit."
            )
        payload = {
            "type": "RECEIVE",
            "bankAccountId": bank_account_id,
            "contactId": contact_id,
            "reference": reference,
            "lineItems": [
                {
                    "description": f"Net marketplace payout — ref {reference}",
                    "quantity": 1,
                    "unitAmount": float(amount),
                    "accountCode": "200",
                    "taxType": NO_VAT_TAX_TYPE,
                }
            ],
        }
        record = await self._call_one("create-bank-transaction", payload)
        return record.get("ID") or "UNKNOWN"

    async def find_or_create_account(
        self,
        name: str,
        code: str,
        account_type: str,
        bank_account_number: str | None = None,
    ) -> str:
        """
        Return the AccountID if the code is already in the chart, else create the
        account via raw REST (MCP has no create-account tool) and return its ID.
        """
        for account in await self.list_accounts():
            if str(account.get("Code", "")) == str(code):
                aid = account.get("ID") or code
                logger.info("Account '%s' (code %s) found: %s", name, code, aid)
                return aid

        return await self.create_account(
            name=name,
            code=code,
            account_type=account_type,
            bank_account_number=bank_account_number,
        )

    async def ensure_tracking_category(
        self,
        category_name: str,
        option_name: str,
    ) -> None:
        """
        Idempotent: create tracking category + option only if absent (E3).
        Xero org cap = 2 active tracking categories — always check first. Non-fatal.
        """
        categories = await self.list_tracking_categories()
        for cat in categories:
            cname = cat.get("Name") or cat.get("name", "")
            if cname.lower() == category_name.lower():
                # Category exists — check options
                options = cat.get("Options") or cat.get("options") or []
                for opt in options:
                    oname = opt.get("Name") or opt.get("name", "")
                    if oname.lower() == option_name.lower():
                        logger.info(
                            "Tracking category '%s' / '%s' already exists",
                            category_name, option_name,
                        )
                        return
                # Category exists but option is missing — add it
                cat_id = self._extract_tracking_category_id(cat)
                if cat_id:
                    await self._call(
                        "create-tracking-options",
                        {"trackingCategoryId": cat_id, "optionNames": [option_name]},
                    )
                    logger.info("Created tracking option '%s' on '%s'", option_name, category_name)
                return

        # Neither category nor option found — check 2-category org cap
        active = [
            c for c in categories
            if (c.get("Status") or c.get("status", "")).upper() == "ACTIVE"
        ]
        if len(active) >= 2:
            logger.warning(
                "Org already has %d active tracking categories (cap=2). "
                "Cannot create '%s'. Tracking will be omitted.",
                len(active), category_name,
            )
            return

        # Create category, then its option
        cat_result = await self._call("create-tracking-category", {"name": category_name})
        cat_id = self._extract_tracking_category_id(cat_result)
        if not cat_id:
            logger.warning("Could not get ID for new tracking category '%s'", category_name)
            return
        await self._call(
            "create-tracking-options",
            {"trackingCategoryId": cat_id, "optionNames": [option_name]},
        )
        logger.info("Created tracking category '%s' + option '%s'", category_name, option_name)

    @staticmethod
    def _extract_tracking_category_id(source: Any) -> str:
        """
        Pull a TrackingCategoryID out of a parsed tracking-category record, a legacy
        {"TrackingCategories":[…]} dict, a list of records, or raw text.
        """
        if isinstance(source, dict):
            cats = source.get("TrackingCategories") or source.get("trackingCategories")
            if cats:
                return (
                    cats[0].get("TrackingCategoryID")
                    or cats[0].get("trackingCategoryID", "")
                )
            return (
                source.get("Tracking Category ID")
                or source.get("TrackingCategoryID")
                or source.get("trackingCategoryID", "")
            )
        if isinstance(source, list):
            for rec in source:
                cid = XeroClient._extract_tracking_category_id(rec)
                if cid:
                    return cid
            return ""
        if isinstance(source, str):
            m = _GUID_RE.search(source)
            return m.group(0) if m else ""
        return ""

    # ── P&L extraction helper ──────────────────────────────────────────────

    def extract_pnl_snapshot(self, raw_pnl: dict[str, Any]) -> dict[str, Any]:
        """
        Extract revenue, commission_expense, and net_profit from a raw
        Xero P&L report dict. Handles the nested Xero report structure.
        Degrades to zeros for the MCP text-blob shape (report parsing is best-effort).
        """
        revenue = Decimal("0")
        commission_expense = Decimal("0")
        net_profit = Decimal("0")

        reports = raw_pnl.get("Reports") or raw_pnl.get("reports") or []
        rows = []
        if reports:
            rows = reports[0].get("Rows") or reports[0].get("rows") or []

        def _extract_amount(cells: list) -> Decimal:
            for cell in cells:
                val = cell.get("Value") or cell.get("value") or ""
                try:
                    return Decimal(str(val).replace(",", ""))
                except Exception:
                    continue
            return Decimal("0")

        current_section = ""
        for row in rows:
            row_type = row.get("RowType") or row.get("rowType") or ""
            title = row.get("Title") or row.get("title") or ""

            if row_type == "Section":
                current_section = title.lower()
                for sub_row in row.get("Rows") or row.get("rows") or []:
                    sub_type = sub_row.get("RowType") or sub_row.get("rowType") or ""
                    sub_cells = sub_row.get("Cells") or sub_row.get("cells") or []
                    sub_title = (
                        (sub_cells[0].get("Value") or sub_cells[0].get("value") or "")
                        if sub_cells else ""
                    )

                    if sub_type == "SummaryRow" and "income" in current_section:
                        revenue = _extract_amount(sub_cells[1:2])
                    elif sub_type == "SummaryRow" and "expense" in current_section:
                        exp_val = _extract_amount(sub_cells[1:2])
                        if "commission" in sub_title.lower() or "fee" in sub_title.lower():
                            commission_expense = exp_val
                    elif sub_type == "SummaryRow" and ("profit" in current_section or "net" in current_section):
                        net_profit = _extract_amount(sub_cells[1:2])

        # Fallback
        if revenue == Decimal("0"):
            for key in ["TotalRevenue", "totalRevenue", "Revenue", "revenue"]:
                if key in raw_pnl:
                    try:
                        revenue = Decimal(str(raw_pnl[key]).replace(",", ""))
                    except Exception:
                        pass
                    break

        if net_profit == Decimal("0"):
            for key in ["NetProfit", "netProfit", "Net", "net"]:
                if key in raw_pnl:
                    try:
                        net_profit = Decimal(str(raw_pnl[key]).replace(",", ""))
                    except Exception:
                        pass
                    break

        return {
            "revenue": str(revenue),
            "commission_expense": str(commission_expense) if commission_expense != Decimal("0") else None,
            "other_expenses": {},
            "net_profit": str(net_profit),
        }

    # ── Dashboard report parsers (E4) ──────────────────────────────────────

    def extract_trial_balance_summary(self, raw: dict[str, Any]) -> dict[str, str]:
        """Extract clearing, fees_expense, and revenue lines from trial balance."""
        clearing = "0.00"
        fees_expense = "0.00"
        revenue = "0.00"

        reports = raw.get("Reports") or raw.get("reports") or []
        rows: list[dict] = []
        if reports:
            rows = reports[0].get("Rows") or reports[0].get("rows") or []

        def _val(cells: list) -> str:
            for cell in cells[1:]:
                v = str(cell.get("Value") or cell.get("value") or "").replace(",", "")
                try:
                    Decimal(v)
                    return v
                except Exception:
                    continue
            return "0.00"

        for row in rows:
            for sub in row.get("Rows") or row.get("rows") or []:
                cells = sub.get("Cells") or sub.get("cells") or []
                if not cells:
                    continue
                name = (cells[0].get("Value") or cells[0].get("value") or "").lower()
                if "clearing" in name:
                    clearing = _val(cells)
                elif "commission" in name or "fee" in name:
                    fees_expense = _val(cells)
                elif "sales" in name or "revenue" in name or "income" in name:
                    revenue = _val(cells)

        return {"clearing": clearing, "fees_expense": fees_expense, "revenue": revenue}

    def extract_aged_receivables_summary(self, raw: dict[str, Any]) -> list[dict[str, str]]:
        """Extract contacts with outstanding balance from aged receivables."""
        results: list[dict[str, str]] = []

        reports = raw.get("Reports") or raw.get("reports") or []
        if not reports:
            return results

        rows = reports[0].get("Rows") or reports[0].get("rows") or []
        for row in rows:
            for sub in row.get("Rows") or row.get("rows") or []:
                cells = sub.get("Cells") or sub.get("cells") or []
                if len(cells) < 2:
                    continue
                name = cells[0].get("Value") or cells[0].get("value") or ""
                total_cell = cells[-1] if cells else {}
                outstanding = str(
                    total_cell.get("Value") or total_cell.get("value") or "0.00"
                ).replace(",", "")
                if name and name.lower() not in ("name", "contact"):
                    results.append({"contact": name, "outstanding": outstanding})

        return results

    def extract_balance_sheet_summary(self, raw: dict[str, Any]) -> dict[str, str]:
        """Extract bank and current assets totals from balance sheet."""
        bank = "0.00"
        current_assets = "0.00"

        reports = raw.get("Reports") or raw.get("reports") or []
        rows: list[dict] = []
        if reports:
            rows = reports[0].get("Rows") or reports[0].get("rows") or []

        def _val(cells: list) -> str:
            for cell in cells[1:]:
                v = str(cell.get("Value") or cell.get("value") or "").replace(",", "")
                try:
                    Decimal(v)
                    return v
                except Exception:
                    continue
            return "0.00"

        for row in rows:
            for sub in row.get("Rows") or row.get("rows") or []:
                cells = sub.get("Cells") or sub.get("cells") or []
                if not cells:
                    continue
                name = (cells[0].get("Value") or cells[0].get("value") or "").lower()
                if "bank" in name:
                    bank = _val(cells)
                elif "current asset" in name or "total current" in name:
                    current_assets = _val(cells)

        return {"bank": bank, "current_assets": current_assets}
