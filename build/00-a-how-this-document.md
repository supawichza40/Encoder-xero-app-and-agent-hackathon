> Part of the PayoutBridge build pack — split from [../BUILD.md](../BUILD.md) (single-file twin). Section 0.

## 0.A How this document was produced (composition audit trail)

This BUILD.md was **reconstructed by the PATCHER stage** after the upstream COMPOSER stage failed to persist its output to disk. At review time an independent critic verified — via case-insensitive `find`, `ls`, and `git status` — that **no `BUILD.md` existed anywhere in the repo**; the composer had produced its master doc only in a chat response and never called Write. The correct interim status was **BLOCKED: input artifact missing**, and that is now resolved by this reconstruction.

- **Backbone source:** `PAYOUTBRIDGE-MASTERPLAN.md` (repo root), which is itself the "single source of truth for the build" and already a lossless consolidation of the 18 research files enumerated in its Part 0.1. The build-relevant substance of those files is carried through this document; nothing correct was dropped.
- **Also on disk (supporting sources, not re-transcribed here):** `docs/TOP3-OPTIMIZED.md`, `docs/PAYOUTBRIDGE-MAX-BRIEF.md`, `docs/TOOLING.md`, `docs/INSIGHTS.md`, `docs/IDEAS-RANKED.md`, `docs/IDEAS-RANKED-POWERFUL.md`, `docs/IDEAS-RANKED-FRESH.md`, `docs/RESEARCH.md`, `docs/HACKATHON.md`, `docs/FINDINGS.md`, `docs/JUDGE-SIGNALS.md`, `docs/PLATFORM.md`, `docs/SETUP.md`, `docs/XERO-PRODUCT-PORTFOLIO.md`, `docs/SESSION-OPS-NOTES.md`, `docs/usefulinfo.md`, `docs/PHOTO-NOTES.md`, `docs/TOP3-FRESH-OPTIMIZED.md`, plus `xero.md` (live UK plan purchase) and the Encode dashboard PDF / venue slides.
- **Forward risk the critic flagged (now handled):** the sources are Treatwell-heavy. Section 0.C records exactly how the Treatwell hard rule was applied so the demo doc does not carry fabricated demo content.

## 0.B Integrity flags — UNSUPPORTED / illustrative claims (do not launder into "facts")

These are re-flagged here so no one downstream treats them as verified. They are fine to USE, but must be spoken/handled with the honesty they carry:

| Claim in this doc | Status | Handling rule |
|---|---|---|
| Demo figures **£1,340 gross / £493 commission+fees / £847 net** and the whole `marketplaceco-payout-0407.csv` | **SYNTHETIC / illustrative** — hand-authored demo fixture, not a real settlement statement | Present on stage as a **representative Treatwell-format statement with synthetic figures**. Never claim it is a real/own statement (see 0.C). |
| Internal scores **74 honest / 76–78 defensible / 81 optimistic** | **INTERNAL ESTIMATE / opinion**, from two external LLM critiques — not an external or objective fact | Never quote **81** externally; the honest number to reason with is **74**. It is a self-assessment, not a judge's score. |
| Treatwell market numbers: **55,000–75,000 UK/EU partners**, **~1M bookings/month**, commission **~35% new-client / 0% repeat within 365 days**, **~2.5%+VAT prepayment fee**, **twice-monthly settlement** | **SOURCED but UNVERIFIED at reconstruction time** — attributed to Treatwell partner pricing; not independently re-confirmed here | Cite the source ([Treatwell partner pricing](https://www.treatwell.co.uk/partners/pricing/)); do not present exact figures as gospel — round and hedge ("tens of thousands of partners"). |
| Xero **4.4M subscribers (FY25)**, **1,000+ App Store apps** | **SOURCED but UNVERIFIED here** | Attribute to Xero FY25 reporting; hedge if challenged. |
| "**Treatwell has zero Xero integration** / absent from Xero's salon collection" | **RESEARCH claim, load-bearing for the moat** | This is competitive analysis, not demo content. If a judge produces a Treatwell↔Xero connector, concede instantly and fall back to "every platform that hasn't shipped native sync." |
| "**Fresha HAS a native paid Xero integration**" | **RESEARCH claim** — stated as true in-plan | Must be honored as true in Q&A (Section 6.3). Never claim Fresha lacks one. |
| "~**70% of Saturday's code reuses** into the LedgerMedic pivot" | **ESTIMATE** | Planning figure only. |
| Win-Confidence **68 → 81** across runs, plus a **84–86** MAX-BRIEF projection | **INTERNAL ESTIMATE — large cross-run drift; 84–86 is a HYPOTHETICAL from an interrupted run that never finished** | Quote as a **range**, never a single point; **never present 84–86 as achieved** (see §14). |
| Prize pool **$9,000 / $3,000 each** vs **£9,000 / £3,000 each** | **UNRESOLVED currency discrepancy** across official sources (Luma/CompeteHub/dashboard say USD; Encode programme + on-site slides say GBP) | Say "$3,000 (confirm GBP vs USD on the day)"; never state one currency as certain (see §13). |
| MCP server surfaces **51 tools**; v0.0.17 broke `update-bank-transaction` (#206/#184); other issue numbers | **SOURCED to the public repo/issues at digest time — not re-verified on the day** | Re-check the repo/issues before relying on any specific tool at build time (see §11). |
| JAX is **"beta", never formally GA**; **Anthropic–Xero product integration "coming months", NOT shipped** as of 4 Jul 2026 | **SOURCED (Xero blog Mar 2026) but time-sensitive** | Hedge; re-check after Xerocon 8–9 Jul 2026 (see §11.7–11.8). |
| Mentor architecture patterns (per-tenant 5-min cache, AES-256-GCM, skills-as-markdown, etc.) | **SOURCED to Ashish Nangia's public `Tax-Insights` repo — his personal build, NOT official Xero guidance** | Attribute as "the pattern the on-site mentor himself used," not as Xero policy (see §12). |
| Research stats: duplicate-invoice **1.29% / $2,034**; payments-fraud **76% hit / 17% use AI**; **~864,000 HMRC landlord letters**; "Custom Connection M2M is **free**" | **FABRICATED / UNCONFIRMED / UNSUPPORTED** (flagged by the research verifier) | **Do NOT cite these as fact.** Custom Connection is free ONLY on the Demo Company (~£5/mo per org in production) (see §16). |

## 0.C Treatwell hard-rule scrub — what was removed and why

**Hard rule enforced:** no fabricated **Treatwell demo content** in the shared deliverable.

- **REMOVED (fabrication):** the pitch line *"We know — this is our own Treatwell statement."* This presented invented demo CSV data as the team's **real** Treatwell settlement statement — a fabricated real-data claim. It is deleted from the Section 6 script and replaced with an explicit "synthetic, representative statement" framing.
- **RETAINED (legitimate research):** Treatwell as a named **market / competitive reference** — partner counts, commission mechanics, and the "no native Xero integration" moat argument. These are sourced competitive facts (flagged in 0.B), not demo content, so removing them would drop correct, material information. They stay, with source flags.
- **Demo fixtures** (`marketplaceco-payout-0407.csv`, the "Treatwell (Marketplace)" seeded contact) are retained as clearly-labelled **synthetic** demo data. If the organisers require full de-branding of demo fixtures, swap the brand token to a neutral placeholder ("MarketplaceCo") — the accounting and every amount are brand-independent.

---

# SECTION 1 — WHAT WE ARE BUILDING

