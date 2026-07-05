"""
Xero MCP client wrapper + raw REST helpers.

MCP calls: all accounting operations via npx @xeroapi/xero-mcp-server@latest.
Raw REST:  attachment PUT (E2) and history note PUT (E6) — MCP does not expose
           these endpoints; token is minted via client-credentials.

Accounting design — Platform Clearing (code 810, BANK type):
  Seed   → RECEIVE net deposit(s) pre-seeded in Platform Clearing
  Step 1 → create-invoice gross + immediate payment INTO Clearing → +gross
  Step 2 → create-credit-note refunds OUT of Clearing (E1, if refunds > 0)
  Step 3 → create-bank-transaction SPEND fees FROM Clearing → +net
  Step 4 → create-bank-transaction SPEND net FROM Clearing → £0.00 ✓
           (or step 3/4 without credit-note for zero-refund files)

Rate-limit: on 429, honour Retry-After header, sleep, retry once.
MCP v0.0.17: update-bank-transaction is broken — create-* only.
"""

import asyncio
import json
import logging
import os
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
    CONTACT_NAME,
    TRACKING_CATEGORY,
    TRACKING_OPTION,
    XERO_CLIENT_ID,
    XERO_CLIENT_SECRET,
    XERO_SCOPES,
)
from .models import FeeLineItem

logger = logging.getLogger(__name__)

XERO_TOKEN_URL = "https://identity.xero.com/connect/token"
XERO_API_BASE = "https://api.xero.com/api.xro/2.0"


def _tracking() -> list[dict[str, str]]:
    """Return the tracking category payload for every line item (E3)."""
    return [{"name": TRACKING_CATEGORY, "option": TRACKING_OPTION}]


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

    # ── Lifecycle ──────────────────────────────────────────────────────────

    async def connect(self) -> None:
        """Start the MCP subprocess and establish the protocol connection."""
        env = {
            **os.environ,
            "XERO_CLIENT_ID": XERO_CLIENT_ID,
            "XERO_CLIENT_SECRET": XERO_CLIENT_SECRET,
            "XERO_SCOPES": XERO_SCOPES,
        }
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

    # ── Internal MCP helper ────────────────────────────────────────────────

    async def _call(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """
        Call a Xero MCP tool and return the parsed result.
        Retries once on 429 (rate limit) after honouring Retry-After.
        """
        if not self._session:
            raise RuntimeError("XeroClient is not connected — call connect() first")

        for attempt in range(2):
            try:
                result = await self._session.call_tool(tool_name, arguments)
            except Exception as exc:
                raise XeroMCPError(f"MCP call failed for '{tool_name}': {exc}") from exc

            raw_text = ""
            for content_block in result.content:
                if hasattr(content_block, "text"):
                    raw_text = content_block.text
                    break

            if not raw_text:
                logger.warning("Empty response from %s", tool_name)
                return {}

            try:
                parsed = json.loads(raw_text)
            except json.JSONDecodeError:
                return raw_text

            if isinstance(parsed, dict):
                status = parsed.get("status") or parsed.get("statusCode")
                if status == 429 and attempt == 0:
                    retry_after = int(parsed.get("headers", {}).get("Retry-After", 60))
                    logger.warning("Rate limited — sleeping %ds", retry_after)
                    await asyncio.sleep(retry_after)
                    continue
                if status == 429 and attempt == 1:
                    raise XeroMCPError("Rate limit exceeded after retry")

            return parsed

        return {}

    # ── Raw REST token helper (E2, E6) ─────────────────────────────────────

    async def _get_access_token(self) -> str:
        """
        Mint (or return cached) a client-credentials access token.
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

        async with httpx.AsyncClient(timeout=15) as http:
            resp = await http.post(
                XERO_TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "scope": XERO_SCOPES,
                },
                auth=(XERO_CLIENT_ID, XERO_CLIENT_SECRET),
            )
            resp.raise_for_status()
            data = resp.json()

        token = data["access_token"]
        expires_in = int(data.get("expires_in", 1800))
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
        url = f"{XERO_API_BASE}/Invoices/{invoice_id}/Attachments/{filename}"

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
        """Return org name and basic details. Used for /health."""
        result = await self._call("list-organisation-details", {})
        orgs = result.get("Organisations") or result.get("organisations") or []
        return orgs[0] if orgs else result

    async def list_accounts(self) -> list[dict[str, Any]]:
        """List all Chart of Accounts entries."""
        result = await self._call("list-accounts", {})
        return result.get("Accounts") or result.get("accounts") or []

    async def list_bank_transactions(self) -> list[dict[str, Any]]:
        """List bank transactions. Used to locate the net deposit."""
        result = await self._call("list-bank-transactions", {})
        return result.get("BankTransactions") or result.get("bankTransactions") or []

    async def list_profit_and_loss(self) -> dict[str, Any]:
        """Fetch P&L report for before/after comparison."""
        return await self._call("list-profit-and-loss", {})

    async def list_trial_balance(self) -> dict[str, Any]:
        """Fetch trial balance report (E4)."""
        return await self._call("list-trial-balance", {})

    async def list_aged_receivables_by_contact(self) -> dict[str, Any]:
        """Fetch aged receivables by contact (E4)."""
        return await self._call("list-aged-receivables-by-contact", {})

    async def list_report_balance_sheet(self) -> dict[str, Any]:
        """Fetch balance sheet report (E4)."""
        return await self._call("list-report-balance-sheet", {})

    async def list_tax_rates(self) -> list[dict[str, Any]]:
        """List all tax rates (E5)."""
        result = await self._call("list-tax-rates", {})
        return result.get("TaxRates") or result.get("taxRates") or []

    async def list_tracking_categories(self) -> list[dict[str, Any]]:
        """List tracking categories (E3 seed check)."""
        result = await self._call("list-tracking-categories", {})
        return result.get("TrackingCategories") or result.get("trackingCategories") or []

    async def get_clearing_balance(self) -> Decimal:
        """
        Return the current balance of the Platform Clearing account (code 810).
        Returns 0 if account not found (handles case where seed hasn't run yet).
        """
        accounts = await self.list_accounts()
        for account in accounts:
            code = account.get("Code") or account.get("code", "")
            if str(code) == CLEARING_ACCOUNT_CODE:
                balance_raw = (
                    account.get("CurrentBalance")
                    or account.get("currentBalance")
                    or account.get("Balance")
                    or account.get("balance")
                    or "0"
                )
                try:
                    return Decimal(str(balance_raw))
                except Exception:
                    return Decimal("0")
        logger.warning("Platform Clearing account (code %s) not found", CLEARING_ACCOUNT_CODE)
        return Decimal("0")

    # ── Write operations ───────────────────────────────────────────────────

    async def create_invoice(
        self,
        contact_name: str,
        description: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """Create an ACCREC invoice for gross revenue. Returns Invoice ID."""
        payload = {
            "type": "ACCREC",
            "status": "AUTHORISED",
            "contact": {"name": contact_name},
            "lineItems": [
                {
                    "description": description,
                    "quantity": 1,
                    "unitAmount": float(amount),
                    "accountCode": account_code,
                    "tracking": _tracking(),
                }
            ],
            "reference": reference,
        }
        result = await self._call("create-invoice", payload)
        return self._extract_invoice_id(result)

    async def create_credit_note(
        self,
        contact_name: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """
        Create an ACCREC credit note for the refund amount (E1).
        Returns Credit Note ID.
        """
        payload = {
            "type": "ACCREC",
            "status": "AUTHORISED",
            "contact": {"name": contact_name},
            "lineItems": [
                {
                    "description": f"Marketplace refund — {reference}",
                    "quantity": 1,
                    "unitAmount": float(amount),
                    "accountCode": account_code,
                    "tracking": _tracking(),
                }
            ],
            "reference": reference,
        }
        result = await self._call("create-credit-note", payload)
        return self._extract_credit_note_id(result)

    async def create_bank_transaction(
        self,
        contact_name: str,
        lines: list[FeeLineItem],
        bank_account_code: str,
        reference: str,
    ) -> str:
        """Create a SPEND bank transaction from the clearing account for fees."""
        payload = {
            "type": "SPEND",
            "contact": {"name": contact_name},
            "bankAccount": {"code": bank_account_code},
            "lineItems": [
                {
                    "description": line.description,
                    "quantity": 1,
                    "unitAmount": float(line.amount),
                    "accountCode": FEES_ACCOUNT_CODE,
                    "tracking": _tracking(),
                }
                for line in lines
            ],
            "reference": reference,
        }
        result = await self._call("create-bank-transaction", payload)
        return self._extract_bank_txn_id(result)

    async def create_payment(
        self,
        invoice_id: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """Create a payment clearing the net amount against the bank deposit."""
        payload = {
            "invoice": {"invoiceID": invoice_id},
            "account": {"code": account_code},
            "amount": float(amount),
            "reference": reference,
        }
        result = await self._call("create-payment", payload)
        return self._extract_payment_id(result)

    # ── Seed operations ────────────────────────────────────────────────────

    async def create_contact(self, name: str) -> str:
        """Create a contact if not already present. Returns the Contact ID."""
        contacts = await self._call("list-contacts", {})
        existing = contacts.get("Contacts") or contacts.get("contacts") or []
        for contact in existing:
            cname = contact.get("Name") or contact.get("name", "")
            if cname.lower() == name.lower():
                cid = contact.get("ContactID") or contact.get("contactID") or contact.get("id", "")
                logger.info("Contact '%s' already exists: %s", name, cid)
                return cid

        result = await self._call("create-contact", {"name": name})
        contacts_out = result.get("Contacts") or result.get("contacts") or []
        if contacts_out:
            cid = contacts_out[0].get("ContactID") or contacts_out[0].get("contactID") or ""
            logger.info("Created contact '%s': %s", name, cid)
            return cid
        raise XeroMCPError(f"create-contact returned unexpected result: {result}")

    async def create_receive_transaction(
        self,
        amount: Decimal,
        reference: str,
        account_code: str,
        contact_name: str,
    ) -> str:
        """Seed a net deposit RECEIVE bank transaction. Returns BankTransaction ID."""
        payload = {
            "type": "RECEIVE",
            "contact": {"name": contact_name},
            "bankAccount": {"code": account_code},
            "lineItems": [
                {
                    "description": f"Net marketplace payout — ref {reference}",
                    "quantity": 1,
                    "unitAmount": float(amount),
                    "accountCode": "200",
                }
            ],
            "reference": reference,
        }
        result = await self._call("create-bank-transaction", payload)
        return self._extract_bank_txn_id(result)

    async def find_or_create_account(
        self,
        name: str,
        code: str,
        account_type: str,
        account_class: str = "ASSET",
    ) -> str:
        """Return account ID if present, else warn and return the code."""
        accounts = await self.list_accounts()
        for account in accounts:
            if str(account.get("Code") or account.get("code", "")) == code:
                aid = account.get("AccountID") or account.get("accountID") or account.get("id", code)
                logger.info("Account '%s' (code %s) found: %s", name, code, aid)
                return aid

        logger.warning(
            "SETUP REQUIRED: Account '%s' (code %s, type %s) not found in Xero. "
            "Please create it via Xero UI → Settings → Chart of Accounts → Add Account. "
            "Enable 'Payments to this account' for the Platform Clearing account.",
            name, code, account_type,
        )
        return code

    async def ensure_tracking_category(
        self,
        category_name: str,
        option_name: str,
    ) -> None:
        """
        Idempotent: create tracking category + option only if absent (E3).
        Xero org cap = 2 active tracking categories — always check first.
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
                cat_id = cat.get("TrackingCategoryID") or cat.get("trackingCategoryID", "")
                await self._call(
                    "create-tracking-options",
                    {"trackingCategoryId": cat_id, "name": option_name},
                )
                logger.info("Created tracking option '%s' on '%s'", option_name, category_name)
                return

        # Neither category nor option found — check 2-category org cap
        active = [c for c in categories if (c.get("Status") or c.get("status", "")).upper() == "ACTIVE"]
        if len(active) >= 2:
            logger.warning(
                "Org already has %d active tracking categories (cap=2). "
                "Cannot create '%s'. Tracking will be omitted.",
                len(active), category_name,
            )
            return

        # Create category
        cat_result = await self._call(
            "create-tracking-category", {"name": category_name}
        )
        cats_out = (
            cat_result.get("TrackingCategories")
            or cat_result.get("trackingCategories")
            or []
        )
        cat_id = (cats_out[0].get("TrackingCategoryID") or cats_out[0].get("trackingCategoryID", "")) if cats_out else ""
        if not cat_id:
            logger.warning("Could not get ID for new tracking category '%s'", category_name)
            return

        await self._call(
            "create-tracking-options",
            {"trackingCategoryId": cat_id, "name": option_name},
        )
        logger.info("Created tracking category '%s' + option '%s'", category_name, option_name)

    # ── P&L extraction helper ──────────────────────────────────────────────

    def extract_pnl_snapshot(self, raw_pnl: dict[str, Any]) -> dict[str, Any]:
        """
        Extract revenue, commission_expense, and net_profit from a raw
        Xero P&L report dict. Handles the nested Xero report structure.
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

    # ── ID extraction helpers ──────────────────────────────────────────────

    @staticmethod
    def _extract_invoice_id(result: Any) -> str:
        if isinstance(result, dict):
            invoices = result.get("Invoices") or result.get("invoices") or []
            if invoices:
                inv = invoices[0]
                return (
                    inv.get("InvoiceID") or inv.get("invoiceID")
                    or inv.get("InvoiceNumber") or inv.get("invoiceNumber")
                    or str(inv.get("id", ""))
                )
            return (
                result.get("InvoiceID") or result.get("invoiceID")
                or result.get("InvoiceNumber") or result.get("invoiceNumber")
                or str(result.get("id", "UNKNOWN"))
            )
        return str(result) if result else "UNKNOWN"

    @staticmethod
    def _extract_credit_note_id(result: Any) -> str:
        if isinstance(result, dict):
            cns = result.get("CreditNotes") or result.get("creditNotes") or []
            if cns:
                cn = cns[0]
                return (
                    cn.get("CreditNoteID") or cn.get("creditNoteID")
                    or cn.get("CreditNoteNumber") or cn.get("creditNoteNumber")
                    or str(cn.get("id", ""))
                )
            return (
                result.get("CreditNoteID") or result.get("creditNoteID")
                or str(result.get("id", "UNKNOWN"))
            )
        return str(result) if result else "UNKNOWN"

    @staticmethod
    def _extract_bank_txn_id(result: Any) -> str:
        if isinstance(result, dict):
            txns = result.get("BankTransactions") or result.get("bankTransactions") or []
            if txns:
                txn = txns[0]
                return (
                    txn.get("BankTransactionID") or txn.get("bankTransactionID")
                    or str(txn.get("id", ""))
                )
            return (
                result.get("BankTransactionID") or result.get("bankTransactionID")
                or str(result.get("id", "UNKNOWN"))
            )
        return str(result) if result else "UNKNOWN"

    @staticmethod
    def _extract_payment_id(result: Any) -> str:
        if isinstance(result, dict):
            payments = result.get("Payments") or result.get("payments") or []
            if payments:
                pmt = payments[0]
                return (
                    pmt.get("PaymentID") or pmt.get("paymentID")
                    or str(pmt.get("id", ""))
                )
            return (
                result.get("PaymentID") or result.get("paymentID")
                or str(result.get("id", "UNKNOWN"))
            )
        return str(result) if result else "UNKNOWN"
