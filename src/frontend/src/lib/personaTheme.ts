// Single source of truth for persona-conditional tint + copy.
// PERSONA-DESIGN.md §0–§1, §4 — governing rule: chrome stays constant, only
// persona SURFACES shift (accent, KPI order/labels, greeting, empty state,
// approve confirmation). Semantic colour (success/amber/destructive) is never
// persona-tinted — only these accent/copy tokens are.
//
// British English, £, MarketplaceCo only — see PREFLIGHT.md §3.

import type { Persona } from "@/lib/useDemoAuth";

export interface PersonaTone {
  /** Tailwind text colour for accent numerals/labels, e.g. "text-emerald-400" */
  accentText: string;
  /** Tailwind border colour for accent chrome, e.g. "border-emerald-500/40" */
  accentBorder: string;
  /** Tailwind background tint for accent chips/tiles, e.g. "bg-emerald-500/10" */
  accentBg: string;
  /** Existing dashboard-kpi-* glow utility class (styles.css) */
  kpiGlow: string;
  /** KpiCard `tone` prop (index.tsx:565) */
  kpiTone: "success" | "primary" | "violet";
  /** LiveDot `tone` prop (motion.tsx) */
  dot: "success" | "primary" | "violet";
  /** Ambient glow-blob background tint, e.g. "bg-emerald-500/8" */
  glowHue: string;
}

export const PERSONA_TONE: Record<Persona, PersonaTone> = {
  owner: {
    accentText: "text-emerald-400",
    accentBorder: "border-emerald-500/40",
    accentBg: "bg-emerald-500/10",
    kpiGlow: "dashboard-kpi-emerald",
    kpiTone: "success",
    dot: "success",
    glowHue: "bg-emerald-500/8",
  },
  bookkeeper: {
    accentText: "text-blue-400",
    accentBorder: "border-blue-500/40",
    accentBg: "bg-blue-500/10",
    kpiGlow: "dashboard-kpi-blue",
    kpiTone: "primary",
    dot: "primary",
    glowHue: "bg-blue-500/8",
  },
  freelancer: {
    accentText: "text-violet-400",
    accentBorder: "border-violet-500/40",
    accentBg: "bg-violet-500/10",
    kpiGlow: "dashboard-kpi-violet",
    kpiTone: "violet",
    dot: "primary",
    glowHue: "bg-violet-500/8",
  },
};

export interface PersonaCopy {
  /** "{name}'s workspace" / "{name} · client books" / "{name}'s tax view" */
  greetingEyebrow: (name: string) => string;
  greetingHeadline: string;
  kpi1Label: string;
  kpi1Sublabel: string;
  kpi2Label: string;
  /** Clearing-balance KPI label (KPI #4 for owner/bookkeeper; jargon-free for freelancer) */
  clearingLabel: string;
  emptyHeadline: string;
  emptySubcopy: string;
  emptyCta: string;
  /** ALX-4 / SAM-/PRI- plain-English confirmation shown above the Approve button */
  approveConfirmation: string;
  /** "What Xero will do" / "Writes with Xero IDs" / "What we'll record" (app.tsx) */
  checklistHeading: string;
}

export const PERSONA_COPY: Record<Persona, PersonaCopy> = {
  owner: {
    greetingEyebrow: (name) => `${name}'s workspace`,
    greetingHeadline: "Your real turnover",
    kpi1Label: "Real turnover (MTD)",
    kpi1Sublabel: "gross, pre-commission — VAT-safe",
    kpi2Label: "Money MarketplaceCo took",
    clearingLabel: "Clearing balance",
    emptyHeadline: "Let's see your real turnover",
    emptySubcopy:
      "Upload a MarketplaceCo payout — we'll show what you truly earned and prove the books balance.",
    emptyCta: "Upload payout",
    approveConfirmation:
      "This posts £1,340 revenue and £493 costs to Xero, then clears £847 to your bank. Nothing posts until you approve.",
    checklistHeading: "What Xero will do",
  },
  bookkeeper: {
    greetingEyebrow: (name) => `${name} · client books`,
    greetingHeadline: "Client books status",
    kpi1Label: "Clearing balance",
    kpi1Sublabel: "Verified · provable zero",
    kpi2Label: "Statements posted",
    clearingLabel: "Clearing balance",
    emptyHeadline: "Post your first client statement",
    emptySubcopy:
      "Upload a client's settlement CSV — deterministic gross-up, full audit trail, provable £0.00.",
    emptyCta: "Upload client statement",
    approveConfirmation:
      "3 writes queued — invoice, bank transaction, payment. Each returns a Xero ID. Nothing posts until you approve.",
    checklistHeading: "Writes with Xero IDs",
  },
  freelancer: {
    greetingEyebrow: (name) => `${name}'s tax view`,
    greetingHeadline: "Your income, correctly",
    kpi1Label: "Income for Self Assessment",
    kpi1Sublabel: "this tax year to date",
    kpi2Label: "Deductible platform fees",
    clearingLabel: "Everything checks out",
    emptyHeadline: "Let's get your income tax-ready",
    emptySubcopy:
      "Upload your MarketplaceCo payout — we'll show the income to declare and the fees you can claim.",
    emptyCta: "Upload my payout",
    approveConfirmation:
      "We'll record £1,340 income and £493 of costs — the £493 you can claim back. Nothing is sent until you approve.",
    checklistHeading: "What we'll record",
  },
};

// ALX-2 jargon-free relabel map — applied only when persona === "freelancer".
// Copy-only swap; the underlying figures/layout never change (PERSONA-DESIGN.md §4).
export const FREELANCER_JARGON: Record<string, string> = {
  "clearing balance": "money moving through",
  "clearing account": "money moving through",
  "clearing = £0.00": "everything's accounted for — nothing left in limbo",
  invariant: "everything checks out",
  balanced: "everything checks out",
  "invariant failed": "the numbers don't add up yet",
  "gross-up": "showing your full income",
  "P&L": "your income vs your costs",
  revenue: "income",
  expense: "costs",
  "commission + fees": "platform fees you can claim",
  reconciled: "matched to your bank",
  net: "take-home",
};
