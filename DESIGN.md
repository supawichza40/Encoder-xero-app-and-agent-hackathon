# DESIGN.md — PayoutBridge design & motion language

Single source every polish worker follows. It documents the tokens **actually present** in
`src/frontend` today, then raises the bar to fintech-grade calm: the look of a tool a
finance team already trusts with its books. Restraint is the aesthetic. If a change makes
the screen louder, it is wrong.

**This is a spec. Do not change app code from this file.** When you build against it, edit
Lovable source files in place (never move them — PREFLIGHT §1) and keep every value below.

Provenance of the real values:
- `src/frontend/src/styles.css` — Tailwind v4 `@theme inline`, OKLCH tokens, keyframes.
- `src/frontend/design-tokens.json` — W3C DTCG token export (kept in sync with styles.css).
- `src/frontend/src/components/motion.tsx` — `Reveal`, `CountUp`, `Marquee`, `LiveDot`,
  `usePrefersReducedMotion`, `useRotatingIndex`.
- `src/frontend/src/components/ui/button.tsx` — shadcn (new-york) button variants.
- `src/frontend/src/lib/useTheme.ts` — theme switch (`mono-dark` ⇄ `mono-light`).

Stack: Tailwind **v4** (CSS-first, no `tailwind.config.js` — the theme lives in
`@theme inline` in `styles.css`), shadcn/ui **new-york**, lucide icons, `sonner` toasts.

---

## 0. Principles (the tie-breakers)

1. **Trust over flash.** Money UI. Every pixel should read as accurate, reversible, and
   auditable. Zero-balance green is earned, not decorative.
2. **No dead clicks.** Every interactive element changes state within **100 ms** of input
   (PREFLIGHT §5). If work is async, show it immediately.
3. **Motion serves meaning.** Animate to explain a state change or draw the eye to the one
   thing that matters (the £0.00 verification). Never to entertain. 150–250 ms for UI
   feedback; longer, slower curves only for one-time reveals and ambient hero life.
4. **Projector-legible.** Must read at 1280×720 from the back of a room. Minimum body 14px,
   money/KPIs large, contrast WCAG-AA.
5. **Tabular money, always.** All amounts use `font-mono` + `tabular-nums`. Columns line up.
6. **One accent at a time.** Blue = action/primary, Emerald = verified/reconciled. Amber =
   attention, Rose/Red = error. Don't stack accents in one view.

---

## 1. Design tokens (real values in the codebase)

Colors are authored in **OKLCH** as CSS variables and exposed to Tailwind via `@theme
inline` (e.g. `--color-primary: var(--primary)` → utilities `bg-primary`, `text-primary`,
`ring-ring`). Three theme scopes exist: the default `:root` (blue-on-slate dark, the demo
default), and two monochrome overrides toggled by `useTheme` writing `.mono-dark` /
`.mono-light` on `<html>` (localStorage key `payoutbridge.theme`, default `mono-dark`).

### 1.1 Semantic color tokens — default `:root` (blue dark, projector default)

| Token (utility) | OKLCH (source) | Hex (approx) | Role |
|---|---|---|---|
| `background` (`bg-background`) | `oklch(0.208 0.042 265.755)` | `#0f172a` slate-900 | page |
| `foreground` (`text-foreground`) | `oklch(0.984 0.003 247.858)` | `#f8fafc` slate-50 | primary text |
| `card` / `popover` | `oklch(0.279 0.041 260.031)` | `#1e293b` slate-800 | surfaces |
| `primary` (`bg-primary`, `ring`) | `oklch(0.623 0.214 259.815)` | `#3b82f6` blue-500 | action accent |
| `secondary` / `muted` / `accent` | `oklch(0.372 0.044 257.287)` | `#334155` slate-700 | subtle fills |
| `muted-foreground` | `oklch(0.704 0.04 256.788)` | `#94a3b8` slate-400 | secondary text |
| `success` | `oklch(0.723 0.19 149.579)` | `#22c55e` green-500 | verified / reconciled |
| `warning` | `oklch(0.769 0.188 70.08)` | `#f59e0b` amber-500 | attention |
| `destructive` | `oklch(0.637 0.237 25.331)` | `#ef4444` red-500 | error |
| `border` | `oklch(1 0 0 / 10%)` | white @10% | hairlines |
| `input` | `oklch(1 0 0 / 15%)` | white @15% | field borders |
| `ring` | `oklch(0.623 0.214 259.815)` | blue-500 | focus ring |

Extra accents (from `design-tokens.json`, used inline for ledger polish): emerald `#34d399`
(positive amounts), rose `#fb7185` (negative amounts / refunds), amber `#fbbf24` (highlight
badges). Money semantics: **positive = emerald, negative = rose, neutral = foreground.**

### 1.2 Monochrome themes (grayscale, no hue)

`.mono-dark` (default via `useTheme`): `background oklch(0.22 0 0)`, `foreground
oklch(0.98 0 0)`, `primary oklch(0.98 0 0)` (white as accent). `.mono-light`: `background
oklch(1 0 0)` white, `foreground oklch(0.18 0 0)`, `primary oklch(0.18 0 0)` (black accent).
Both desaturate success/warning/destructive to grays — **so never rely on hue alone to
signal state; always pair color with an icon or label** (check ✓, alert △, ✕). This is also
the WCAG rule: state must survive grayscale.

**Rule:** always reference semantic utilities (`bg-card`, `text-muted-foreground`,
`border-border`, `ring-ring`). Never hardcode `#0f172a` or a raw `oklch(...)` in a component
except for the documented ledger accents (emerald/rose) that have no semantic token.

### 1.3 Radius

`--radius: 0.625rem` (10px) base. Scale (from `@theme inline`): `radius-sm`
`calc(radius − 4px)` = 6px · `radius-md` `calc(radius − 2px)` = 8px · `radius-lg` = 10px ·
`radius-xl` `calc(radius + 4px)` = 14px. Pills `rounded-full` (9999px) for badges/status
chips. **Buttons/inputs `rounded-md`, cards `rounded-lg`/`rounded-xl`, chips `rounded-full`.**
Keep one radius family per component; don't mix sharp and round in one card.

### 1.4 Spacing & layout

- 4px base grid (Tailwind default): `gap-2` 8 · `gap-3` 12 · `gap-4` 16 · `gap-6` 24.
- Card padding `p-4`/`p-6`; stack rhythm `gap-6` (the `/app` column uses `gap-6`).
- Container `max-w-6xl` (72rem / 1152px), page gutters `px-4 sm:px-6`.
- Section rhythm (marketing/landing): `py-24` desktop, `py-16` mobile.
- `/app` is a two-column grid `lg:grid-cols-[260px_1fr]` (sticky history rail + workflow).

### 1.5 Shadow / elevation

- Card / floating: `0 25px 50px -12px rgba(15,23,42,0.4)` (Tailwind `shadow-2xl`-class).
- Inner highlight for glass surfaces: `inset 0 1px 1px rgba(255,255,255,0.08)`.
- Hover lift shadow (`.hover-lift`): `0 20px 40px -24px oklch(0 0 0 / 45%)`.
- KPI hover glows: colored `0 24px 48px -20px <accent>/40–45%` (see `.dashboard-kpi-*`).
- **Elevation ladder:** flat page → `border` hairline on cards → soft shadow on hover/float
  → colored glow only on interactive KPIs. Never put a heavy shadow on a static element.

---

## 2. Type scale & font pairing

Three families, loaded via `@theme inline` and `font-feature-settings: "tnum" 1, "ss01" 1,
"cv11" 1` on `html, body`:

- **Sans — `Geist`** (`--font-sans`): all UI, headings, body. Headings get
  `letter-spacing: -0.02em` globally; hero `-0.03em`.
- **Display — `Instrument Serif`** (`--font-display`, `.font-display`): italic serif accent
  **only** — a single emphasized word/number in a hero or section title. Weight 400,
  `-0.01em`. Never for body or labels. Use sparingly (≤1 per viewport).
- **Mono — `JetBrains Mono`** (`--font-mono`): money amounts, Xero IDs, hashes, code.
  Always with `tabular-nums`.

### 2.1 Scale (Tailwind classes → px)

| Role | Class | Size/leading | Weight | Tracking |
|---|---|---|---|---|
| Hero display | `text-5xl`/`text-6xl` | 48–60 | `font-black` (900) | `-0.03em` |
| H1 (app title) | `text-3xl sm:text-4xl` | 30→36 | `font-black` | `-0.02em` |
| H2 section | `text-2xl` | 24/32 | `font-bold` (700) | `-0.02em` |
| H3 card title | `text-lg`/`text-xl` | 18–20 | `font-semibold` (600) | `-0.02em` |
| Body | `text-sm sm:text-base` | 14→16 | 400 | normal |
| Small / meta | `text-xs` | 12 | 400–500 | normal |
| Eyebrow / label | `text-xs uppercase` | 12 | 500–600 | `tracking-widest` (~0.2em) |
| Money (KPI) | `text-2xl`–`text-4xl` `font-mono tabular-nums` | 24–36 | 600–700 | `-0.01em` |
| Money (inline) | `text-sm font-mono tabular-nums` | 14 | 500 | normal |

Weights available: 400 / 500 / 600 / 700 / 900. **Body never below `text-sm` (14px).**
Line length: cap prose at `max-w-prose` (~65ch). Eyebrows are the only uppercase text.

---

## 3. Motion spec

The codebase already ships a full keyframe library (`styles.css`) and JS primitives
(`motion.tsx`). This section governs **how** to use them. Golden rule: **UI feedback is fast
(150–250 ms); reveals and ambient life are slow and one-shot.** A judge should feel polish,
never wait on it.

### 3.1 Durations

| Bucket | Duration | Use |
|---|---|---|
| **Instant feedback** | **150–250 ms** | hover, press/active, focus ring, color/bg change, toggle, tab switch, drawer/accordion open, optimistic value swap. Token: `duration-fast` = **180 ms**. |
| Micro-transition | 250–450 ms | card hover-lift, KPI lift, small layout shifts. (`.hover-lift` 400 ms, `.dashboard-kpi` 450 ms — pre-existing, acceptable for hover elevation.) |
| Reveal (one-shot) | 500–900 ms | scroll-in `Reveal` (700 ms), `animate-reveal` (500 ms), `animate-fade-up` (900 ms), bar-grow (900 ms), sparkline draw. Fires **once** per element. |
| Ambient (infinite) | 3–28 s | `glow-pulse`, `float`, `pulse-ring`, `marquee`, grid-pan, donut-orbit. Background life only, low opacity, never near text the user is reading. |

**Interactive feedback must sit in the 150–250 ms band.** Do not put a 700 ms reveal on a
button press or a value that updates in response to a click.

### 3.2 Easing

| Curve | Value | Use |
|---|---|---|
| **Reveal / standard-out** | `cubic-bezier(0.16, 1, 0.3, 1)` | the house curve — reveals, lifts, draws, count-ups. Confident deceleration. |
| Magnetic | `cubic-bezier(0.32, 0.72, 0, 1)` | drawer/sheet slide, snappy pulls. |
| Standard | `cubic-bezier(0.4, 0, 0.2, 1)` | button shimmer, generic transitions, `transition-colors`. |
| Linear | `linear` | only continuous ambient loops (marquee, orbit, grid-pan). |

Default for `transition-colors` / hover / focus is the standard curve — no need to override.
Never use `ease-in` alone (accelerating-away feels sluggish for UI).

### 3.3 When to animate vs not

**Animate:** state transitions (idle→loading→success), the £0.00 verification reveal (this
is the wow moment — earn it with a `Reveal` + `LiveDot` pulse + emerald settle), value
count-ups on first view (`CountUp`), scroll-in of dashboard/landing sections (staggered
`Reveal` with `delay`), step-progress checkmarks landing one by one.

**Do not animate:** text the user is reading, table rows on every re-render, anything on a
value that changes rapidly, error states (errors appear **instantly** — no fade-in delay on
a problem), or re-entrance of already-seen content. Never animate layout on keystroke.

**Stagger:** cap section stagger at ~5 items, ~60–80 ms apart (the `/app` column uses
`delay={80,140,180,220,...}`). Beyond that it reads slow — reveal the group together.

### 3.4 `prefers-reduced-motion` (mandatory)

Two layers, both already present — **keep them**:
1. CSS: the `@media (prefers-reduced-motion: reduce)` block forces all
   animation/transition to `0.01ms` and makes `.reveal-init` fully visible. Any new
   animation must fall under this automatically (use the existing utilities/keyframes).
2. JS: gate every `setInterval`/`requestAnimationFrame` motion behind
   `usePrefersReducedMotion()` or `useRotatingIndex(..., enabled)`. `CountUp` should snap to
   final value when reduced (guard the rAF loop). Never animate purely in JS without this
   check.

**Test:** with Reduce Motion on, every screen must be fully readable and every state
reachable — nothing hidden behind an animation that no longer plays.

### 3.5 Performance

Animate only `transform`, `opacity`, `filter` (all house keyframes already do). Add
`will-change` only on actively-animating elements (`.reveal-init` sets it). Never animate
`width`/`height`/`top`/`left` for feedback (layout thrash) — the two `gap-fill` keyframes
that animate `width` are ambient-only, off the interaction path.

---

## 4. Interaction-feedback contract

**Law:** every clickable/interactive element gives visible feedback within **100 ms**
(PREFLIGHT §5). No exceptions. The four feedback channels:

1. **Press/active** — every button/link/toggle depresses or shifts on `:active`
   (`active:scale-[0.98]` or `active:translate-y-px`, ≤120 ms). Instant, pointer-driven.
2. **Hover** — `hover:` bg/border/lift on pointer devices (already on buttons, KPIs, links).
3. **Focus-visible** — keyboard focus shows a ring: `focus-visible:outline-none
   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
   focus-visible:ring-offset-background` (the `/app` sample buttons + FileUpload already do
   this; shadcn button uses `ring-1` — **standardize new interactive elements to `ring-2`**).
   Never remove the outline without replacing it. Every actionable element is Tab-reachable.
4. **Async → progress + result** — the moment an async action starts: disable the trigger,
   swap its label + show a spinner (`<Loader2 className="animate-spin">`), and on settle fire
   a **toast** (success/error) via `sonner`. Optimistic UI where safe.

### 4.1 Toasts (sonner)

`src/components/ui/sonner.tsx` exists. **Mount `<Toaster richColors position="top-right" />`
once in `__root.tsx`** (currently not mounted — wiring it is the one setup step this
contract requires) and call `toast.success` / `toast.error` / `toast.loading` from actions.
Success = emerald, error = destructive, both with a lucide icon. Toast on: proposal ready,
approval posted, verification passed (£0.00), idempotent replay detected, any API/parse
error. Keep copy short and specific ("Posted to Xero · clearing £0.00"), auto-dismiss ~4 s,
errors dismiss on user action.

### 4.2 Full state matrix per interactive component

Each interactive component must define these states (— = not applicable). "First paint"
covers loading/empty/error/skeleton per PREFLIGHT §5. Async triggers must also disable
during flight to prevent double-submit.

| Component | idle | hover | active/press | focus-visible | loading | disabled | success | error | empty |
|---|---|---|---|---|---|---|---|---|---|
| **Button** (shadcn) | variant bg | `hover:bg-primary/90` | add `active:scale-[0.98]` | `ring` (→ring-2) | Loader2 + label swap + disabled | `opacity-50` + `not-allowed` (present) | brief check / toast | shake-free; toast + inline msg | — |
| **FileUpload** | dashed dropzone + hint | border/bg lift | — | `ring-2` w/ offset (present) | Loader2 + "Parsing statement…" + busy (present) | `aria-disabled`, busy (present) | proposal renders below | inline `AlertCircle` + destructive text (present) | first-use hint + "Try a sample" |
| **"Approve & Post"** (ApprovalDrawer) | emerald CTA | `hover:bg-emerald-500` + glow | press shift | `ring-2` | Loader2 + "Posting to Xero…" + disabled (present) | disabled when `!invariant_check` or approved (present) | checklist items flip to ✓ + toast | partial_error alert (`role="alert"`) + StepProgress marks failed step | — |
| **Sample-CSV chips** (`/app`) | tinted outline chip | `hover:bg-*/20` (present) | press shift | `ring-2` (present) | inherit upload busy | `opacity-50` + `not-allowed` (present) | routes to proposal | upload error surfaces in FileUpload | — |
| **Accordion / detail toggle** | chevron-right, collapsed | bg tint | — | `ring-2` | — | — | expands (`aria-expanded`, ≤250 ms) | — | — |
| **Drawer / Sheet** (Approval) | closed | — | — | trap focus inside | content skeleton if async | — | slide-in (magnetic curve) | — | — |
| **Theme toggle** | current mode icon | bg tint | press shift | `ring-2` | — | — | instant theme swap (≤180 ms) + persists | — | — |
| **Nav links / "Back to home"** | muted text | `hover:text-foreground` (present) | — | `ring-2` rounded (present) | — | — | route transition | — | — |
| **Tabs** | inactive muted | bg tint | — | `ring-2` | skeleton panel | — | active indicator slides (≤200 ms) | — | empty-panel copy |
| **KPI card** (dashboard) | flat card + border | lift + colored glow (present) | — | `ring-2` if interactive | `Skeleton` shimmer | — | `CountUp` on first view | "—" placeholder + retry | "No data yet" |
| **Status / IdempotencyBanner** | — | — | — | reset btn `ring-2` | — | — | emerald "reconciled" chip | destructive banner | — |

### 4.3 Screen-level first-paint states (every route)

Per PREFLIGHT §5, each screen ships all four:
- **Loading:** shadcn `Skeleton` blocks matching final layout (never a bare spinner on a
  full page); KPI/number areas use skeleton bars, not empty space.
- **Empty:** a calm illustration-or-icon + one sentence + the primary next action (e.g.
  `/app` idle → FileUpload + "Try a sample" chips). Never a blank panel.
- **Error:** inline, `role="alert"`, destructive border/bg + `AlertCircle`, plain-language
  cause + a retry/reset affordance. Errors appear **instantly**, never fade in.
- **Real/Demo fallback:** when `/health` is unreachable, auto-fall-back to Demo (PREFLIGHT
  §4) and surface a small persistent "Demo data" chip — informative, not alarming.

### 4.4 Verification moment (the wow)

The £0.00 clearing verification is the emotional peak. Choreograph, don't decorate:
1. StepProgress checks land sequentially (~120 ms apart) as the 3 writes "post".
2. ClearingReconciliation reveals (`Reveal`), the balance `CountUp`s to `£0.00`.
3. It settles to **emerald** with a single `LiveDot` pulse-ring and a `toast.success`.
4. Auto-scroll brings it into view (already wired in `app.tsx`). One beat, then still. No
   confetti, no looping animation on the result — stillness reads as *certainty*.

---

## 5. Buildable checklist (per polish PR)

- [ ] Uses only semantic tokens / documented emerald·rose accents — no raw hex/oklch.
- [ ] Money is `font-mono tabular-nums`; positive emerald / negative rose.
- [ ] Every interactive element: press + hover + `focus-visible:ring-2` + disabled.
- [ ] Async: disable-on-flight + spinner + label swap + `sonner` toast on settle.
- [ ] Feedback animations 150–250 ms, standard/house easing; reveals one-shot 500–900 ms.
- [ ] Loading (Skeleton) + empty + error(`role="alert"`) states present.
- [ ] Works with Reduce Motion on (CSS block + `usePrefersReducedMotion` for JS motion).
- [ ] Readable at 1280×720; body ≥14px; WCAG-AA contrast; state never hue-only.
- [ ] `<Toaster>` mounted in `__root.tsx` (one-time).
- [ ] No existing Lovable file moved/renamed (PREFLIGHT §1); edits in place, paste-back-safe.
