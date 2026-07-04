"""
Xero MCP client wrapper.

Spawns `npx -y @xeroapi/xero-mcp-server@latest` as a subprocess and
communicates via the MCP protocol. Provides typed methods for every
operation the golden path needs.

Accounting design — Platform Clearing (code 810, BANK type):
  Seed  → RECEIVE £847 seeded in the default Xero bank (NOT in clearing)
  Step1 → create-invoice £1,340 (AR created, line item account = 200/Sales)
           + immediate create-payment £1,340 INTO Platform Clearing
           → Platform Clearing = +1340
  Step2 → create-bank-transaction SPEND £493 FROM Platform Clearing
           → Platform Clearing = +847
  Step3 → create-bank-transaction SPEND £847 FROM Platform Clearing
           (reconciles against seeded bank deposit reference MC-PAYOUT-0407)
           → Platform Clearing = 0.00 ✓

Rate-limit handling: on 429, honour Retry-After header, sleep, retry once.
MCP subprocess broken after v0.0.17 for update-bank-transaction — use
create-bank-transaction only.
"""

import asyncio
import json
import logging
import os
from contextlib import AsyncExitStack
from decimal import Decimal
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from .config import (
    CLEARING_ACCOUNT_CODE,
    CLEARING_ACCOUNT_NAME,
    FEES_ACCOUNT_CODE,
    CONTACT_NAME,
    XERO_CLIENT_ID,
    XERO_CLIENT_SECRET,
    XERO_SCOPES,
)
from .models import FeeLineItem

logger = logging.getLogger(__name__)


class XeroMCPError(Exception):
    """Raised when a Xero MCP tool call returns an error."""


class XeroClient:
    """
    Wrapper around the Xero MCP server subprocess.

    Usage (via FastAPI lifespan):
        client = XeroClient()
        await client.connect()
        # ... use methods ...
        await client.disconnect()
    """

    def __init__(self) -> None:
        self._session: ClientSession | None = None
        self._exit_stack = AsyncExitStack()

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

    # ── Internal helpers ───────────────────────────────────────────────────

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

            # MCP result.content is a list of TextContent or similar
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
                # Some tools return plain strings for simple responses
                return raw_text

            # Handle rate limit (429)
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

        return {}  # unreachable

    # ── Read operations ────────────────────────────────────────────────────

    async def list_organisation_details(self) -> dict[str, Any]:
        """Return org name and basic details. Used for /health."""
        result = await self._call("list-organisation-details", {})
        # Result is typically {"Organisations": [{...}]}
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
        result = await self._call("list-profit-and-loss", {})
        return result

    async def get_clearing_balance(self) -> Decimal:
        """
        Return the current balance of the Platform Clearing account (code 810).
        Returns 0 if account not found (handles case where seed hasn't run yet).
        """
        accounts = await self.list_accounts()
        for account in accounts:
            code = account.get("Code") or account.get("code", "")
            if str(code) == CLEARING_ACCOUNT_CODE:
                # Balance fields vary: "CurrentBalance", "balance", etc.
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

    # ── Write operations — golden path ─────────────────────────────────────

    async def create_invoice(
        self,
        contact_name: str,
        description: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """
        Create an ACCREC invoice for gross revenue.
        Returns the Xero Invoice ID (e.g. "INV-0042").
        """
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
                }
            ],
            "reference": reference,
        }
        result = await self._call("create-invoice", payload)
        return self._extract_invoice_id(result)

    async def pay_invoice(
        self,
        invoice_id: str,
        amount: Decimal,
        account_code: str,
        reference: str,
    ) -> str:
        """
        Apply a payment to an existing invoice, crediting the specified account.
        Returns the Xero Payment ID.
        """
        payload = {
            "invoice": {"invoiceID": invoice_id},
            "account": {"code": account_code},
            "amount": float(amount),
            "reference": reference,
        }
        result = await self._call("create-payment", payload)
        return self._extract_payment_id(result)

    async def create_bank_transaction(
        self,
        contact_name: str,
        lines: list[FeeLineItem],
        bank_account_code: str,
        reference: str,
    ) -> str:
        """
        Create a SPEND bank transaction from the clearing account for fees.
        Returns the Xero BankTransaction ID.
        """
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
        """
        Create a payment clearing the net amount against the bank deposit.
        Returns the Xero Payment ID.
        """
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
        """
        Create a contact if not already present.
        Returns the Contact ID.
        """
        # First check if the contact exists
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
        """
        Seed the net deposit: RECEIVE bank transaction into Platform Clearing.
        Returns the BankTransaction ID.
        """
        payload = {
            "type": "RECEIVE",
            "contact": {"name": contact_name},
            "bankAccount": {"code": account_code},
            "lineItems": [
                {
                    "description": f"Net marketplace payout — ref {reference}",
                    "quantity": 1,
                    "unitAmount": float(amount),
                    "accountCode": "200",  # Sales/Revenue income account
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
        """
        Return account ID if it exists, otherwise attempt creation via
        a manual journal placeholder (MCP doesn't expose create-account).

        In practice: the seed will check and warn if the account is missing,
        expecting the operator to create it once via the Xero UI.
        """
        accounts = await self.list_accounts()
        for account in accounts:
            if str(account.get("Code") or account.get("code", "")) == code:
                aid = account.get("AccountID") or account.get("accountID") or account.get("id", code)
                logger.info("Account '%s' (code %s) found: %s", name, code, aid)
                return aid

        # Account not found — log a clear instruction for the operator
        logger.warning(
            "SETUP REQUIRED: Account '%s' (code %s, type %s) not found in Xero. "
            "Please create it via Xero UI → Settings → Chart of Accounts → Add Account. "
            "Enable 'Payments to this account' for the Platform Clearing account.",
            name,
            code,
            account_type,
        )
        return code  # Return the code as a fallback identifier

    # ── ID extraction helpers ──────────────────────────────────────────────

    @staticmethod
    def _extract_invoice_id(result: Any) -> str:
        if isinstance(result, dict):
            invoices = result.get("Invoices") or result.get("invoices") or []
            if invoices:
                inv = invoices[0]
                return (
                    inv.get("InvoiceID")
                    or inv.get("invoiceID")
                    or inv.get("InvoiceNumber")
                    or inv.get("invoiceNumber")
                    or str(inv.get("id", ""))
                )
            # Flat response
            return (
                result.get("InvoiceID")
                or result.get("invoiceID")
                or result.get("InvoiceNumber")
                or result.get("invoiceNumber")
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
                    txn.get("BankTransactionID")
                    or txn.get("bankTransactionID")
                    or str(txn.get("id", ""))
                )
            return (
                result.get("BankTransactionID")
                or result.get("bankTransactionID")
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
                    pmt.get("PaymentID")
                    or pmt.get("paymentID")
                    or str(pmt.get("id", ""))
                )
            return (
                result.get("PaymentID")
                or result.get("paymentID")
                or str(result.get("id", "UNKNOWN"))
            )
        return str(result) if result else "UNKNOWN"

    # ── P&L extraction helper ──────────────────────────────────────────────

    def extract_pnl_snapshot(self, raw_pnl: dict[str, Any]) -> dict[str, Any]:
        """
        Extract revenue, commission_expense, and net_profit from a raw
        Xero P&L report dict. Handles the nested Xero report structure.
        """
        revenue = Decimal("0")
        commission_expense = Decimal("0")
        net_profit = Decimal("0")

        # Xero P&L report structure:
        # { "Reports": [{ "Rows": [...] }] }
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
            title = ""
            if row.get("Title"):
                title = row["Title"]
            elif row.get("title"):
                title = row["title"]

            if row_type == "Section":
                current_section = title.lower()
                for sub_row in row.get("Rows") or row.get("rows") or []:
                    sub_type = sub_row.get("RowType") or sub_row.get("rowType") or ""
                    sub_cells = sub_row.get("Cells") or sub_row.get("cells") or []
                    sub_title = (sub_cells[0].get("Value") or sub_cells[0].get("value") or "") if sub_cells else ""

                    if sub_type == "SummaryRow" and "income" in current_section:
                        revenue = _extract_amount(sub_cells[1:2])
                    elif sub_type == "SummaryRow" and "expense" in current_section:
                        exp_val = _extract_amount(sub_cells[1:2])
                        if "commission" in sub_title.lower() or "fee" in sub_title.lower():
                            commission_expense = exp_val
                    elif sub_type == "SummaryRow" and ("profit" in current_section or "net" in current_section):
                        net_profit = _extract_amount(sub_cells[1:2])

        # Fallback: if nested parsing failed, try top-level keys
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
