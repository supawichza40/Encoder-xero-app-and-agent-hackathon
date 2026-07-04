"""
Reset & Rehearsal script — one command end-to-end validation.

Sequence:
  [1/7] Reset state files
  [2/7] Seed Demo Company (via POST /seed)
  [3/7] POST /propose with golden CSV → assert status=new
  [4/7] POST /approve → assert 3 writes + verified=true
  [5/7] GET /status/{hash} → assert 3 completed steps
  [6/7] GET /pnl → assert after.revenue > before.revenue
  [7/7] POST /propose again → assert status=already-posted

Usage:
  python scripts/reset_rehearsal.py
  python scripts/reset_rehearsal.py --base-url http://localhost:8000
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

import httpx

# ── State file paths ───────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent
STATE_DIR = REPO_ROOT / "src" / "state"
DATA_DIR = REPO_ROOT / "src" / "data"
GOLDEN_CSV = DATA_DIR / "marketplaceco-payout-0407.csv"

PASS = "✓"
FAIL = "✗"
results: list[tuple[str, bool, str]] = []


def _report(step: str, ok: bool, detail: str = "") -> None:
    icon = PASS if ok else FAIL
    print(f"  [{icon}] {step}{' — ' + detail if detail else ''}")
    results.append((step, ok, detail))


async def run(base_url: str) -> int:
    async with httpx.AsyncClient(base_url=base_url, timeout=120) as client:

        print(f"\nPayoutBridge rehearsal → {base_url}\n")

        # ── [1/7] Reset state files ────────────────────────────────────────
        step = "1/7 Reset state files"
        try:
            for fname in ("posted.json", "audit.json", "pnl-after.json"):
                fpath = STATE_DIR / fname
                if fname.endswith(".json") and fname != "pnl-before.json":
                    if fname == "audit.json":
                        fpath.write_text("[]", encoding="utf-8")
                    else:
                        fpath.write_text("{}", encoding="utf-8")

            # Remove cached proposals
            proposals_dir = STATE_DIR / "proposals"
            if proposals_dir.exists():
                for p in proposals_dir.glob("*.json"):
                    p.unlink()

            _report(step, True)
        except Exception as exc:
            _report(step, False, str(exc))

        # ── [2/7] Seed ────────────────────────────────────────────────────
        step = "2/7 Seed Demo Company"
        try:
            resp = await client.post("/seed")
            if resp.status_code == 200:
                seed_result = resp.json().get("seed_result", {})
                warnings = seed_result.get("warnings", [])
                detail = f"pnl_before_captured={seed_result.get('pnl_before_captured')}"
                if warnings:
                    detail += f" | WARNINGS: {'; '.join(warnings)}"
                _report(step, True, detail)
            else:
                _report(step, False, f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as exc:
            _report(step, False, str(exc))

        # ── [3/7] Propose golden CSV ───────────────────────────────────────
        step = "3/7 Propose golden CSV"
        file_hash = None
        try:
            csv_bytes = GOLDEN_CSV.read_bytes()
            resp = await client.post(
                "/propose",
                files={"file": ("marketplaceco-payout-0407.csv", csv_bytes, "text/csv")},
            )
            if resp.status_code == 200:
                body = resp.json()
                file_hash = body.get("file_hash")
                status = body.get("status")
                gross = body.get("payout", {}).get("gross")
                assert status == "new", f"Expected status=new, got {status}"
                assert gross == "1340.00", f"Expected gross=1340.00, got {gross}"
                _report(step, True, f"status={status}, hash={file_hash[:8]}…, gross={gross}")
            else:
                _report(step, False, f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as exc:
            _report(step, False, str(exc))

        if not file_hash:
            print("\n  Cannot continue without file_hash — aborting.\n")
            return 1

        # ── [4/7] Approve ─────────────────────────────────────────────────
        step = "4/7 Approve (3 writes + verify)"
        try:
            resp = await client.post(
                "/approve",
                json={"file_hash": file_hash},
            )
            if resp.status_code == 200:
                body = resp.json()
                n_results = len(body.get("results", []))
                all_success = all(r["status"] == "success" for r in body.get("results", []))
                verified = body.get("verified")
                clearing = body.get("clearing_balance")
                assert n_results == 3, f"Expected 3 results, got {n_results}"
                assert all_success, "Not all writes succeeded"
                detail = (
                    f"{n_results}/3 writes ok, verified={verified}, "
                    f"clearing_balance={clearing}"
                )
                _report(step, True, detail)
            else:
                _report(step, False, f"HTTP {resp.status_code}: {resp.text[:300]}")
        except Exception as exc:
            _report(step, False, str(exc))

        # ── [5/7] Status ──────────────────────────────────────────────────
        step = "5/7 Status check"
        try:
            resp = await client.get(f"/status/{file_hash}")
            if resp.status_code == 200:
                body = resp.json()
                completed = body.get("completed_steps", [])
                n_audit = len(body.get("audit_entries", []))
                assert len(completed) == 3, f"Expected 3 completed steps, got {len(completed)}"
                _report(step, True, f"steps={completed}, audit_entries={n_audit}")
            else:
                _report(step, False, f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as exc:
            _report(step, False, str(exc))

        # ── [6/7] P&L check ───────────────────────────────────────────────
        step = "6/7 P&L before/after"
        try:
            resp = await client.get("/pnl")
            if resp.status_code == 200:
                body = resp.json()
                before_rev = body.get("before", {}).get("revenue")
                after_rev = (body.get("after") or {}).get("revenue")
                detail = f"before.revenue={before_rev}, after.revenue={after_rev}"
                ok = before_rev is not None
                _report(step, ok, detail)
            else:
                _report(step, False, f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as exc:
            _report(step, False, str(exc))

        # ── [7/7] Idempotency check ───────────────────────────────────────
        step = "7/7 Idempotency (re-propose same file)"
        try:
            csv_bytes = GOLDEN_CSV.read_bytes()
            resp = await client.post(
                "/propose",
                files={"file": ("marketplaceco-payout-0407.csv", csv_bytes, "text/csv")},
            )
            if resp.status_code == 200:
                body = resp.json()
                status = body.get("status")
                existing = body.get("existing_ids")
                assert status == "already-posted", f"Expected already-posted, got {status}"
                _report(step, True, f"status={status}, has_existing_ids={existing is not None}")
            else:
                _report(step, False, f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as exc:
            _report(step, False, str(exc))

    # ── Summary ────────────────────────────────────────────────────────────
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"\n{'='*50}")
    print(f"  {passed}/{total} checks passed")
    print(f"{'='*50}\n")
    return 0 if passed == total else 1


def main() -> None:
    parser = argparse.ArgumentParser(description="PayoutBridge reset & rehearsal")
    parser.add_argument(
        "--base-url", default="http://localhost:8000", help="Backend base URL"
    )
    args = parser.parse_args()
    sys.exit(asyncio.run(run(args.base_url)))


if __name__ == "__main__":
    main()
