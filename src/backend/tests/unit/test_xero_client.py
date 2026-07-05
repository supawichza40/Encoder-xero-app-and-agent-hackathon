"""
Tier 1 unit tests for XeroClient's MCP wire contract (xero-mcp-server v0.0.17).

The API-tier fixtures stub XeroClient at the method level, so the text-block parser
and the real request/response mapping are never exercised there — that gap is exactly
how the silent `'str' object has no attribute 'get'` bug shipped. These tests drive a
real XeroClient with a fake MCP session that returns the exact multi-TEXT-block shapes
the server emits (captured from the compiled tool sources), so `_call`, `_parse_record`
and every consuming method run for real.
"""

import json
from decimal import Decimal
from types import SimpleNamespace

import pytest

from backend.xero_client import XeroClient, XeroMCPError

# ── Real response text blocks (verbatim shapes from xero-mcp-server dist) ──────

ORG_BLOCKS = [
    "Organisation Details:",
    (
        'Name: Demo Company (UK) || "No name available."\n'
        'Legal Name: Demo Company (UK) || "No legal name available."\n'
        "Pays Tax: Yes\n"
        'Short Code: !W18bY || "No short code available."\n'
        "Organisation ID: cefe0d09-b974-4fbf-af35-84e1c241bdcf || \"No organisation ID available.\"\n"
        "Is Demo Company: Yes\n"
        'Base Currency: GBP || "No base currency available."'
    ),
]

ACCOUNTS_BLOCKS = [
    "Found 2 accounts:",
    "Account: Platform Clearing\nCode: 810\nID: 4b2c9ba4-12e1-48b5-8f59-86f85fb33f63\nType: BANK\nStatus: ACTIVE",
    "Account: Sales\nCode: 200\nID: c563b607-fb0e-4d06-9ddb-76fdeef20ae3\nType: REVENUE\nStatus: ACTIVE\nTax Type: OUTPUT",
]

INVOICE_ID = "11111111-1111-1111-1111-111111111111"
INVOICE_BLOCK = (
    "Invoice created successfully:\n"
    f"ID: {INVOICE_ID}\n"
    "Contact: MarketplaceCo\nType: ACCREC\nDate: 2026-07-05\n"
    "Total: 1340.00\nStatus: DRAFT\nLink to view: https://go.xero.com/x"
)

BANKTXN_ID = "22222222-2222-2222-2222-222222222222"
BANKTXN_BLOCK = (
    "Bank transaction successfully:\n"
    f"ID: {BANKTXN_ID}\n"
    "Date: 2026-07-05\nContact: MarketplaceCo\nTotal: 493.00\nStatus: AUTHORISED"
)

PAYMENT_ID = "33333333-3333-3333-3333-333333333333"
PAYMENT_BLOCK = (
    "Invoice created successfully:\n"
    f"ID: {PAYMENT_ID}\n"
    "Reference: MC-PAYOUT-0407\nInvoice Number: INV-0001\nAmount: 847.00\nStatus: AUTHORISED"
)

CONTACT_ID = "44444444-4444-4444-4444-444444444444"
CONTACT_CREATE_BLOCK = f"Contact created: MarketplaceCo (Marketplace) (ID: {CONTACT_ID})"


def _result(*texts, is_error=False):
    return SimpleNamespace(
        content=[SimpleNamespace(type="text", text=t) for t in texts],
        isError=is_error,
    )


class FakeSession:
    """Routes call_tool(tool, args) → a preconfigured result; records every call."""

    def __init__(self, routes):
        self.routes = routes
        self.calls: list[tuple[str, dict]] = []

    async def call_tool(self, tool_name, arguments):
        self.calls.append((tool_name, arguments))
        route = self.routes[tool_name]
        return route(arguments) if callable(route) else route

    def last(self, tool_name):
        for name, args in reversed(self.calls):
            if name == tool_name:
                return args
        raise AssertionError(f"{tool_name} was never called")


def _client(routes):
    c = XeroClient()
    c._session = FakeSession(routes)
    return c


# ── _parse_record ─────────────────────────────────────────────────────────────

def test_parse_record_strips_fallback_suffix_and_keys_values():
    rec = XeroClient._parse_record(ORG_BLOCKS[1])
    assert rec["Name"] == "Demo Company (UK)"
    assert rec["Organisation ID"] == "cefe0d09-b974-4fbf-af35-84e1c241bdcf"
    assert rec["Is Demo Company"] == "Yes"
    assert rec["Base Currency"] == "GBP"


def test_parse_record_header_line_yields_empty_dict():
    # "Found 90 accounts:" has no "Key: Value" pair → empty (dropped by _call)
    assert XeroClient._parse_record("Found 90 accounts:") == {}


# ── error handling (the shipped bug) ──────────────────────────────────────────

async def test_call_raises_xeromcperror_on_error_block():
    c = _client({"create-invoice": _result("Error creating invoice: taxType is required")})
    with pytest.raises(XeroMCPError) as ei:
        await c._call("create-invoice", {})
    assert "taxType is required" in str(ei.value)


async def test_call_raises_on_iserror_flag():
    c = _client({"list-accounts": _result("whatever", is_error=True)})
    with pytest.raises(XeroMCPError):
        await c._call("list-accounts", {})


# ── read methods ──────────────────────────────────────────────────────────────

async def test_list_organisation_details_returns_named_dict():
    c = _client({"list-organisation-details": _result(*ORG_BLOCKS)})
    org = await c.list_organisation_details()
    assert org["Name"] == "Demo Company (UK)"
    assert org["Is Demo Company"] == "Yes"


async def test_list_accounts_parses_records_and_resolves_guid():
    c = _client({"list-accounts": _result(*ACCOUNTS_BLOCKS)})
    accounts = await c.list_accounts()
    assert len(accounts) == 2  # header block dropped
    assert accounts[0]["Code"] == "810"
    assert accounts[0]["ID"] == "4b2c9ba4-12e1-48b5-8f59-86f85fb33f63"
    assert await c._get_account_id("810") == "4b2c9ba4-12e1-48b5-8f59-86f85fb33f63"
    assert await c._get_account_id("999") is None


# ── write methods: response ID extraction + request payload shape ─────────────

async def test_create_invoice_extracts_id_and_sends_real_payload():
    c = _client({"create-invoice": _result(INVOICE_BLOCK)})
    c._contact_id_cache["MarketplaceCo"] = CONTACT_ID  # skip contact resolution

    inv_id = await c.create_invoice(
        contact_name="MarketplaceCo",
        description="Gross sales",
        amount=Decimal("1340.00"),
        account_code="200",
        reference="MC-PAYOUT-0407",
    )
    assert inv_id == INVOICE_ID

    sent = c._session.last("create-invoice")
    assert sent["contactId"] == CONTACT_ID           # GUID, not {"name": ...}
    assert sent["type"] == "ACCREC"
    assert "status" not in sent                       # MCP has no status arg
    line = sent["lineItems"][0]
    assert line["accountCode"] == "200"
    assert line["taxType"] == "NONE"                  # required by MCP schema


async def test_create_bank_transaction_resolves_bank_guid_and_extracts_id():
    from backend.models import FeeLineItem

    c = _client({
        "list-accounts": _result(*ACCOUNTS_BLOCKS),
        "create-bank-transaction": _result(BANKTXN_BLOCK),
    })
    c._contact_id_cache["MarketplaceCo"] = CONTACT_ID

    txn_id = await c.create_bank_transaction(
        contact_name="MarketplaceCo",
        lines=[FeeLineItem(description="Commission", amount=Decimal("445.90"))],
        bank_account_code="810",
        reference="MC-PAYOUT-0407",
    )
    assert txn_id == BANKTXN_ID

    sent = c._session.last("create-bank-transaction")
    assert sent["type"] == "SPEND"
    assert sent["bankAccountId"] == "4b2c9ba4-12e1-48b5-8f59-86f85fb33f63"  # resolved GUID
    assert sent["contactId"] == CONTACT_ID
    assert sent["lineItems"][0]["taxType"] == "NONE"


async def test_create_bank_transaction_raises_when_bank_account_missing():
    from backend.models import FeeLineItem

    c = _client({
        "list-accounts": _result("Found 1 accounts:", "Account: Sales\nCode: 200\nID: c563b607-fb0e-4d06-9ddb-76fdeef20ae3\nType: REVENUE\nStatus: ACTIVE"),
    })
    c._contact_id_cache["MarketplaceCo"] = CONTACT_ID
    with pytest.raises(XeroMCPError):
        await c.create_bank_transaction(
            contact_name="MarketplaceCo",
            lines=[FeeLineItem(description="Fees", amount=Decimal("47.10"))],
            bank_account_code="810",
            reference="X",
        )


async def test_create_payment_resolves_account_guid_and_extracts_id():
    c = _client({
        "list-accounts": _result(*ACCOUNTS_BLOCKS),
        "create-payment": _result(PAYMENT_BLOCK),
    })
    pmt_id = await c.create_payment(
        invoice_id=INVOICE_ID,
        amount=Decimal("847.00"),
        account_code="810",
        reference="MC-PAYOUT-0407",
    )
    assert pmt_id == PAYMENT_ID

    sent = c._session.last("create-payment")
    assert sent["invoiceId"] == INVOICE_ID
    assert sent["accountId"] == "4b2c9ba4-12e1-48b5-8f59-86f85fb33f63"
    assert sent["amount"] == 847.0


async def test_create_contact_extracts_inline_id_when_absent():
    c = _client({
        "list-contacts": _result("Found 0 contacts:"),   # no existing match
        "create-contact": _result(CONTACT_CREATE_BLOCK),
    })
    cid = await c.create_contact("MarketplaceCo (Marketplace)")
    assert cid == CONTACT_ID


async def test_create_contact_finds_existing_by_name():
    existing = _result(
        "Found 1 contacts:",
        f"Contact: MarketplaceCo (Marketplace)\nID: {CONTACT_ID}\nStatus: ACTIVE",
    )
    c = _client({"list-contacts": existing})
    cid = await c.create_contact("MarketplaceCo (Marketplace)")
    assert cid == CONTACT_ID


# ── clearing balance from trial-balance JSON rows ─────────────────────────────

def _trial_balance(rows):
    return _result(
        "Trial Balance Report: TrialBalance",
        "Date: 2026-07-05",
        "Updated At: 2026-07-05T00:00:00.000Z",
        json.dumps(rows),
    )


async def test_get_clearing_balance_reads_zero_from_trial_balance():
    rows = [
        {
            "rowType": "Section",
            "title": "Assets",
            "rows": [
                {
                    "rowType": "Row",
                    "cells": [
                        {"value": "Platform Clearing (810)"},
                        {"value": "1340.00"},
                        {"value": "1340.00"},
                    ],
                }
            ],
        }
    ]
    c = _client({"list-trial-balance": _trial_balance(rows)})
    assert await c.get_clearing_balance() == Decimal("0.00")


async def test_get_clearing_balance_computes_debit_minus_credit():
    rows = [
        {
            "rowType": "Row",
            "cells": [
                {"value": "Platform Clearing"},
                {"value": "493.00"},
                {"value": "0.00"},
            ],
        }
    ]
    c = _client({"list-trial-balance": _trial_balance(rows)})
    assert await c.get_clearing_balance() == Decimal("493.00")


async def test_get_clearing_balance_absent_account_is_zero():
    c = _client({"list-trial-balance": _trial_balance([])})
    assert await c.get_clearing_balance() == Decimal("0")


# ── Raw REST helpers: authorise_invoice / create_account / bank transfers ──────
# These endpoints do not exist in the MCP server, so the client calls the Xero
# REST API directly. The tests stub `_rest_request` (the shared HTTP/429 layer)
# and verify each method's request payload and response parsing.

from unittest.mock import AsyncMock


def _rest_client() -> XeroClient:
    return XeroClient()


async def test_authorise_invoice_posts_status_and_confirms():
    c = _rest_client()
    c._rest_request = AsyncMock(
        return_value={"Invoices": [{"InvoiceID": "INV-1", "Status": "AUTHORISED"}]}
    )

    assert await c.authorise_invoice("INV-1") is True

    method, url, payload, _ = c._rest_request.call_args.args
    assert method == "POST"
    assert url.endswith("/Invoices/INV-1")
    assert payload == {"InvoiceID": "INV-1", "Status": "AUTHORISED"}


async def test_authorise_invoice_raises_when_not_authorised():
    c = _rest_client()
    c._rest_request = AsyncMock(
        return_value={"Invoices": [{"InvoiceID": "INV-1", "Status": "DRAFT"}]}
    )
    with pytest.raises(XeroMCPError, match="not AUTHORISED"):
        await c.authorise_invoice("INV-1")


async def test_create_account_bank_includes_bank_number_and_busts_cache():
    c = _rest_client()
    c._accounts_cache = [{"Code": "090"}]  # pre-warm — must be invalidated
    c._rest_request = AsyncMock(
        return_value={"Accounts": [{"AccountID": "acc-guid-1"}]}
    )

    aid = await c.create_account(
        "Platform Clearing", "092", "BANK", bank_account_number="00000000"
    )

    assert aid == "acc-guid-1"
    assert c._accounts_cache is None
    method, url, payload, _ = c._rest_request.call_args.args
    assert (method, payload["Type"], payload["BankAccountNumber"]) == (
        "PUT", "BANK", "00000000",
    )


async def test_create_bank_transfer_payload_and_id():
    c = _rest_client()
    c._rest_request = AsyncMock(
        return_value={"BankTransfers": [{"BankTransferID": "xfer-guid-1"}]}
    )

    xid = await c.create_bank_transfer("092", "090", Decimal("847.00"))

    assert xid == "xfer-guid-1"
    _, url, payload, _ = c._rest_request.call_args.args
    assert url.endswith("/BankTransfers")
    xfer = payload["BankTransfers"][0]
    assert xfer["FromBankAccount"] == {"Code": "092"}
    assert xfer["ToBankAccount"] == {"Code": "090"}
    assert xfer["Amount"] == 847.0


async def test_find_bank_transfer_matches_codes_and_amount(monkeypatch):
    import backend.xero_client as xc_mod

    transfers = {
        "BankTransfers": [
            {  # wrong amount — must be skipped
                "BankTransferID": "xfer-other",
                "FromBankAccount": {"Code": "092"},
                "ToBankAccount": {"Code": "090"},
                "Amount": 695.0,
            },
            {
                "BankTransferID": "xfer-hit",
                "FromBankAccount": {"Code": "092"},
                "ToBankAccount": {"Code": "090"},
                "Amount": 847.0,
            },
        ]
    }

    class _FakeResponse:
        status_code = 200

        @staticmethod
        def json():
            return transfers

    class _FakeAsyncClient:
        def __init__(self, *a, **kw): ...
        async def __aenter__(self):
            return self
        async def __aexit__(self, *a):
            return False
        async def get(self, url, headers=None):
            return _FakeResponse()

    monkeypatch.setattr(xc_mod.httpx, "AsyncClient", _FakeAsyncClient)

    c = _rest_client()
    c._rest_headers = AsyncMock(return_value={})

    assert await c.find_bank_transfer("092", "090", Decimal("847.00")) == "xfer-hit"
    assert await c.find_bank_transfer("092", "090", Decimal("1.00")) is None
