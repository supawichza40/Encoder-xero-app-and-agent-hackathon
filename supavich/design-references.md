# PayoutBridge — Design References for Claude Design · built by Supavich

Companion to [design.md](design.md). Paste this whole file into your Claude design chat **after** the design.md prompt. It adds: the light-default + dark-toggle theme system, which 21st.dev component patterns to use, the Spline decision, and the exact animation spec. Everything below is self-sufficient — the design chat needs no web access.

---

## 0. Tool references

- **21st.dev** — https://21st.dev/ — a registry of React + Tailwind + Motion UI components (shadcn-compatible, copy-paste). **USE THIS** as the component style reference. It's what makes the UI look hand-built, not AI-generated.
- **Motion (Framer Motion)** — https://motion.dev/ — the animation library. All animations below are `motion` primitives (`animate`, `AnimatePresence`, `whileInView`, spring/tween).
- **Spline** — https://spline.design/ — browser 3D. **DO NOT USE for the core UI** (see §4). React integration would be `@splinetool/react-spline` if ever needed.

---

## 1. Theme system — LIGHT default, toggle to DARK

The app defaults to **light** (white, Xero-native, professional — accountants trust it) and toggles to **dark** (for the projector demo, where dark reads better and the green £0.00 glow pops). Implement as Tailwind `dark:` variants with a top-right toggle; define both palettes as tokens. Every screen must look correct in BOTH modes.

### Design tokens (both modes)

| Token | LIGHT (default) | DARK (toggle) | Use |
|---|---|---|---|
| `bg` | `#ffffff` | `#0f172a` | page background |
| `surface` / card | `#ffffff` (border `#e2e8f0`) | `#1e293b` | panels, cards |
| `text` primary | `#0f172a` | `#f8fafc` | headings, amounts |
| `text` secondary | `#475569` | `#94a3b8` | labels, captions |
| `border` | `#e2e8f0` | `#334155` | dividers, card edges |
| `success` | `#16a34a` | `#22c55e` | £0.00 verified, positive |
| `success-bg` | `#f0fdf4` (border `#bbf7d0`) | `rgba(34,197,94,0.12)` (border `#22c55e`/30%) | payoff card fill |
| `warning` | `#d97706` | `#f59e0b` | idempotency banner |
| `error` | `#dc2626` | `#ef4444` | validation errors, non-zero clearing |
| `accent` | `#2563eb` | `#3b82f6` | primary actions, drag-over |
| font | system sans; **tabular monospace for all money** (`font-variant-numeric: tabular-nums`) | same | numbers right-aligned |

**Hard rules (both modes):**
- `£0.00 ✓` after approval is the **largest element on the page** (≥ 32px, hero-sized). Green success color, tick icon.
- Money values are **strings rendered in tabular monospace** — never computed client-side, never reflowed.
- Status is **never color-only**: success = green + tick, warning = amber + ⚠ icon, error = red + ✕ icon + text.
- Synthetic data only: platform = **MarketplaceCo**, clients Client A–I, org "Demo Company (UK)". The word "Treatwell" must not appear.
- Projector legibility first: body ≥16px, table amounts ≥18px, approve button ≥18px. Target 1280×720; no horizontal page scroll; P&L cards stack below 768px.

---

## 2. Component references — map each to a 21st.dev pattern

For each app component, search 21st.dev for the pattern and adopt its look/motion (adapt to our tokens). Props/behaviour come from design.md §component inventory — this is the visual/animation reference.

| App component | 21st.dev search term / pattern | Notes |
|---|---|---|
| **£0.00 payoff** (`ClearingReconciliation`) | "animated number", "counter", "stat", "success state" | THE hero. Big count/reveal + green check badge. Largest text on page. |
| **FileUpload** | "file upload", "dropzone", "drag and drop" | Dashed border, accent-blue on drag-over, spinner on upload. |
| **ApprovalDrawer** | "drawer", "sheet", "slide over", "summary card" | Slide-up. Payout summary table + "What Xero will do" 3-item checklist + big approve button. |
| **StepProgress** | "stepper", "timeline", "progress steps" | 3 horizontal steps (Invoice → Fees → Payment), animated check per completion. |
| **PnLComparison** | "comparison", "before after", "stat cards", "pricing cards" | Two cards side-by-side; delta chip `+£493.00`; "NEW" badge on commission. |
| **AuditTrail** | "data table", "activity log", "transaction table" | Collapsible; monospace IDs; status icons; horizontal scroll on narrow. |
| **IdempotencyBanner** | "alert", "callout", "banner" | Amber, warning icon, shows existing Xero IDs. |
| **App shell** | "dashboard layout", "app shell", "theme toggle" | Centered max-w column; top bar with title + **light/dark toggle**. |

---

## 3. Animation spec — restraint is the rule (ONE hero, everything else supporting)

All via Motion (framer-motion). Theme-agnostic.

1. **Count-up on money** — gross animates 0 → £1,340.00, net → £847.00 on reveal. ~800ms, ease-out. Tabular monospace so digits don't jump.
2. **THE payoff (hero)** — when clearing balance resolves: the number animates down to **£0.00**, card does fade + scale-up (0.96 → 1.0), a single green check **draws in** (SVG path or scale-in). **400–600ms ease-out.** This is the demo climax — give it a beat of breathing room, nothing else moves during it.
3. **Staggered step completion** — Invoice → Fees → Payment: each checkmark pops (scale 0.8→1 + green fill) as its write returns. **Min 300ms visible per step** even if the backend is fast, so the sequence reads on stage. Connector line fills green between completed steps.
4. **Before/After P&L** — AFTER card fades + slides in (x: 12→0) beside BEFORE; the `+£493.00` delta counts up in green; "NEW" badge scales in on the commission line; "unchanged" net stays static (reinforces: fixes reporting, not cash).
5. **Drawer + banner** — ApprovalDrawer slides up (y: 16→0, 250ms). IdempotencyBanner slides down from top with amber flash.

**Timing discipline:** total demo is 90s. The payoff (2) is the only "look at me" animation; 1/3/4/5 are quick and functional (≤300ms). No looping/ambient motion competing with £0.00. Respect `prefers-reduced-motion` (fall back to instant states).

---

## 4. Spline decision — OPTIONAL, default OFF (see §7 for the safe switch)

Spline is **allowed but gated behind a switch that defaults OFF** — see §7 for the exact toggle. With the switch off it has **zero impact** (the WebGL runtime is never even downloaded). Only turn it on if the demo laptop handles it smoothly. Why it's off by default, not always-on:
- The hero is a **number** (£0.00), not a 3D object — 3D competes with the financial-clarity story judges reward.
- Adds a WebGL runtime + GPU dependence + load time on unknown venue hardware = a "can't-die demo" fragility.
- Only conceivable use: one slow, muted ambient 3D shape behind the **idle screen only**, never near the payoff. Even then, skip it for a 90-second pitch. (Spline is better saved for a post-hackathon marketing landing page.)

---

## 5. What to produce (instruction to Claude design)

Build the **web application** UI as one self-contained artifact (single HTML with inline CSS/JS, or a single React artifact), rendering **every phase as a labeled frame stacked top-to-bottom** (idle → uploading → error → idempotent → proposed → approving → verified → partial_error), in **light mode by default with a working dark-mode toggle**, using 21st.dev-style components (§2), the token system (§1), and the animations (§3). Give the £0.00 verified screen hero treatment. Use the mock data from design.md verbatim so every screen shows real numbers (1340.00 / 445.90 / 47.10 / 847.00, MC-PAYOUT-0407, INV-0042…). No Spline. No Treatwell.

---

## 6. Component shortlist — the good ones, by name

> 21st.dev aggregates real open-source component libraries. These are the specific best-fit components (with their source library) to reference/rebuild for each part of PayoutBridge. The Claude design chat can recreate any of them from name + description — no external fetch needed. Libraries: shadcn/ui (`ui.shadcn.com`), Aceternity UI (`ui.aceternity.com`), Magic UI (`magicui.design`), **Tremor** (`tremor.so` — purpose-built for financial dashboards), Origin UI (`originui.com`), motion-primitives (`motion-primitives.com`), Vaul (`vaul.emilkowal.ski`), Sonner (`sonner.emilkowal.ski`), NumberFlow (`number-flow.barvian.me`), lucide icons (`lucide.dev`).

### The £0.00 hero + money figures (most important)
- **NumberFlow** (barvian) — animated number transitions, tabular, currency-aware. **First choice** for the gross/net count-up and the clearing balance ticking to £0.00.
- **Magic UI — `NumberTicker`** — simpler count-up alternative.
- **Magic UI — `AnimatedShinyText`** or a static green success chip for the "✓ Verified" label.
- Pair with **lucide `CircleCheck` / `BadgeCheck`** drawn-in via Framer Motion path animation.

### FileUpload
- **Aceternity UI — `File Upload`** — animated dashed dropzone with drag-over highlight (closest to our spec).
- **Origin UI — file-upload / dropzone** components — cleaner, more minimal alternative.
- Base logic: `react-dropzone`.

### StepProgress (Invoice → Fees → Payment)
- **Origin UI — `Stepper`** — horizontal steps with states.
- **motion-primitives — animated checkmark / `AnimatedCheck`** for the per-step pop.
- Connector-fill + check-draw via Framer Motion.

### PnLComparison (before/after) + payout summary
- **Tremor — `Card`, `Metric`, `BadgeDelta`, `Flex`** — literally built for P&L / KPI before-after with delta badges. **Strong fit** for the two comparison cards.
- Alt: **shadcn `Card`** + **shadcn `Badge`** (for `+£493.00` delta and the "NEW" tag).
- **Magic UI — `MagicCard`** (spotlight border) if you want the AFTER card to feel highlighted.

### ApprovalDrawer
- **Vaul — `Drawer`** (also shipped as **shadcn `Drawer`**) — the standard slide-up sheet.
- shadcn **`Sheet`** if you prefer a side panel.

### AuditTrail
- **shadcn `DataTable`** (TanStack Table) — collapsible, sortable, monospace cells.
- Alt: **Tremor `Table`** — lighter, dashboard-styled.
- Wrap in shadcn **`Collapsible`** for the "Transaction Trace" disclosure.

### IdempotencyBanner + toasts
- **shadcn `Alert`** (amber/`warning` variant) — the persistent banner.
- **Sonner `toast`** — for transient "already posted" / success flashes.
- **Origin UI — `Banner`/`Notification`** — nicer full-width banner alternative.

### App shell + theme toggle (light default → dark)
- **shadcn `ThemeProvider` + `ModeToggle`** (next-themes) — the standard light/dark toggle, top-right.
- **shadcn `Button`** — the big green "Approve & Post to Xero" CTA (avoid flashy shimmer buttons; financial-grade = restraint).
- **shadcn `Badge`, `Separator`, `Card`** — layout primitives.

### Optional ambient (idle screen only, subtle)
- **Magic UI — `DotPattern`** or **`AnimatedGridPattern`**, or **Aceternity `Grid`/`Dot Background`** — faint, professional texture behind the idle/upload state. Keep it near-invisible; never near the payoff.

### Icon set
- **lucide-react**: `Upload`, `FileText`, `CircleCheck`, `BadgeCheck`, `AlertTriangle`, `X`, `ChevronDown`, `ArrowUpRight` (delta), `Sun`/`Moon` (toggle).

**Priority to nail:** NumberFlow (the £0.00 + money) → Tremor cards (P&L) → Vaul drawer (approval) → Origin/Aceternity dropzone. Those four carry the demo.

> _Note: the 21st.dev `magic` MCP was returning malformed responses at build time, so this shortlist is sourced directly from the underlying open-source libraries it indexes (all real, all installable) rather than scraped from the 21st.dev site._

---

## 7. Spline 3D — OPTIONAL, behind a switch (default OFF, zero impact when off)

You may reference a Spline 3D scene for extra "wow" **only if it is gated by a switch that defaults OFF**. With the switch off there is ZERO impact: no WebGL, no runtime download, no GPU load — the app is fully demo-ready without it. Turn it on only if the demo laptop runs it smoothly; flip it off instantly on stage if it stutters.

**Principles**
- **Default OFF.** The app looks complete with Spline off — a static fallback (poster image, or the CSS gradient / `DotPattern` from §6) sits behind the idle screen instead.
- **Lazy-load.** The Spline runtime bundle (~200–500KB) downloads ONLY when the switch is on. Off = it is never fetched, so it can't slow first paint.
- **Idle screen only.** Never mounts during the golden-path demo; leaving idle unmounts it and frees the GPU.
- **Kill switch in the header** (next to the light/dark toggle) — one click to turn 3D off live.
- **Always ship the static fallback** — shown when Spline is off OR fails to load (WebGL error), so it can never look broken.
- **Self-host** the `.splinecode` file — don't depend on Spline's CDN mid-demo.

**React pattern (default OFF, lazy, idle-only):**
```tsx
import { lazy, Suspense, useState } from "react";
const Spline = lazy(() => import("@splinetool/react-spline")); // bundle loads ONLY when this renders

function HeroBackground({ phase }: { phase: Phase }) {
  const [spline3D, setSpline3D] = useState(false); // ← DEFAULT OFF = zero impact
  const Fallback = () => <div className="hero-gradient" />; // safe, no WebGL (or <img>/<DotPattern/>)

  return (
    <div className="hero-media">
      {phase === "idle" && spline3D ? (
        <Suspense fallback={<Fallback />}>
          <Spline scene="/scene.splinecode" className="hero-spline" />
        </Suspense>
      ) : (
        <Fallback />
      )}
      <div className="hero-overlay" />
      <button className="spline-toggle" onClick={() => setSpline3D(v => !v)}>
        3D {spline3D ? "on" : "off"}
      </button>
    </div>
  );
}
```
- `spline3D = false` → `Fallback` renders and the `import("@splinetool/react-spline")` **never executes**, so the runtime is never downloaded and WebGL never starts. True zero cost when off.
- **Hard off for the demo build:** gate it with an env flag too — `const ENABLE_SPLINE = import.meta.env.VITE_SPLINE === "1"` and add `&& ENABLE_SPLINE` to the condition; ship the demo build with `VITE_SPLINE` unset so it can't be toggled on at all.

**Best of both:** design the scene in Spline, then **record it to the hero MP4** (see [hero-video-prompts.md](hero-video-prompts.md)) — you get the Spline look with none of the runtime cost, and keep this live toggle as a bonus for a post-hackathon build.

---

*Paste order for the design chat: (1) design.md, then (2) this file. Iterate on the £0.00 payoff frame first — it's the win.*
