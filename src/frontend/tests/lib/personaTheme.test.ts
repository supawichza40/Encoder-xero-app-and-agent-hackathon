import { describe, expect, it } from "vitest";
import { FREELANCER_JARGON, PERSONA_COPY, PERSONA_TONE } from "@/lib/personaTheme";
import type { Persona } from "@/lib/useDemoAuth";

const PERSONAS: Persona[] = ["owner", "bookkeeper", "freelancer"];

describe("personaTheme — PERSONA_TONE", () => {
  it("defines a tone entry for every persona", () => {
    for (const p of PERSONAS) {
      expect(PERSONA_TONE[p]).toBeDefined();
    }
  });

  it("assigns the spec'd accent per persona (emerald / blue / violet)", () => {
    expect(PERSONA_TONE.owner.accentText).toBe("text-emerald-400");
    expect(PERSONA_TONE.owner.accentBorder).toBe("border-emerald-500/40");
    expect(PERSONA_TONE.owner.accentBg).toBe("bg-emerald-500/10");
    expect(PERSONA_TONE.owner.kpiTone).toBe("success");
    expect(PERSONA_TONE.owner.kpiGlow).toBe("dashboard-kpi-emerald");

    expect(PERSONA_TONE.bookkeeper.accentText).toBe("text-blue-400");
    expect(PERSONA_TONE.bookkeeper.accentBorder).toBe("border-blue-500/40");
    expect(PERSONA_TONE.bookkeeper.kpiTone).toBe("primary");
    expect(PERSONA_TONE.bookkeeper.kpiGlow).toBe("dashboard-kpi-blue");

    expect(PERSONA_TONE.freelancer.accentText).toBe("text-violet-400");
    expect(PERSONA_TONE.freelancer.accentBorder).toBe("border-violet-500/40");
    expect(PERSONA_TONE.freelancer.kpiTone).toBe("violet");
    expect(PERSONA_TONE.freelancer.kpiGlow).toBe("dashboard-kpi-violet");
  });

  it("every tone maps to a valid KpiCard tone value", () => {
    const validKpiTones = ["primary", "amber", "violet", "success"];
    for (const p of PERSONAS) {
      expect(validKpiTones).toContain(PERSONA_TONE[p].kpiTone);
    }
  });

  it("every tone maps to a valid LiveDot tone value", () => {
    const validDotTones = ["success", "primary", "warning", "violet"];
    for (const p of PERSONAS) {
      expect(validDotTones).toContain(PERSONA_TONE[p].dot);
    }
  });

  it("gives each persona a distinct ambient glow hue", () => {
    const hues = PERSONAS.map((p) => PERSONA_TONE[p].glowHue);
    expect(new Set(hues).size).toBe(PERSONAS.length);
  });
});

describe("personaTheme — PERSONA_COPY", () => {
  it("defines non-empty copy for every persona", () => {
    for (const p of PERSONAS) {
      const copy = PERSONA_COPY[p];
      expect(copy).toBeDefined();
      for (const [key, value] of Object.entries(copy)) {
        if (typeof value === "string") {
          expect(value.length, `${p}.${key} should not be empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("greetingEyebrow interpolates the user's name", () => {
    expect(PERSONA_COPY.owner.greetingEyebrow("Sam")).toContain("Sam");
    expect(PERSONA_COPY.bookkeeper.greetingEyebrow("Priya")).toContain("Priya");
    expect(PERSONA_COPY.freelancer.greetingEyebrow("Alex")).toContain("Alex");
  });

  it("never mentions a competitor/real marketplace brand — MarketplaceCo only", () => {
    const banned = /Amazon|Etsy|Shopify|eBay|Stripe|Treatwell/i;
    for (const p of PERSONAS) {
      const copy = PERSONA_COPY[p];
      for (const value of Object.values(copy)) {
        if (typeof value === "string") expect(value).not.toMatch(banned);
      }
    }
  });

  it("owner's approve confirmation names the three golden-path figures", () => {
    expect(PERSONA_COPY.owner.approveConfirmation).toMatch(/£1,340/);
    expect(PERSONA_COPY.owner.approveConfirmation).toMatch(/£493/);
    expect(PERSONA_COPY.owner.approveConfirmation).toMatch(/£847/);
  });

  it("bookkeeper's KPI#1 is clearing balance (clearing-first order, PRI-4)", () => {
    expect(PERSONA_COPY.bookkeeper.kpi1Label).toBe("Clearing balance");
  });

  it("freelancer's hero KPI pair is the two Self Assessment figures (ALX-1)", () => {
    expect(PERSONA_COPY.freelancer.kpi1Label).toBe("Income for Self Assessment");
    expect(PERSONA_COPY.freelancer.kpi2Label).toBe("Deductible platform fees");
  });

  it("freelancer copy avoids raw accounting jargon (clearing/invariant/gross-up)", () => {
    const jargon = /\bclearing\b|\binvariant\b|\bgross-up\b/i;
    const copy = PERSONA_COPY.freelancer;
    for (const value of Object.values(copy)) {
      if (typeof value === "string") expect(value).not.toMatch(jargon);
    }
  });

  it("checklist headings match the existing tinted headings already shipped in app.tsx", () => {
    expect(PERSONA_COPY.owner.checklistHeading).toBe("What Xero will do");
    expect(PERSONA_COPY.bookkeeper.checklistHeading).toBe("Writes with Xero IDs");
    expect(PERSONA_COPY.freelancer.checklistHeading).toBe("What we'll record");
  });
});

describe("personaTheme — FREELANCER_JARGON map", () => {
  it("maps every accounting term from the design spec to plain English", () => {
    const requiredKeys = ["clearing balance", "invariant", "gross-up", "reconciled", "net", "revenue"];
    for (const key of requiredKeys) {
      expect(FREELANCER_JARGON[key]).toBeTruthy();
    }
  });

  it("plain-English values never re-introduce the jargon they replace", () => {
    for (const [term, plain] of Object.entries(FREELANCER_JARGON)) {
      expect(plain.toLowerCase()).not.toBe(term.toLowerCase());
    }
  });
});
