# PayoutBridge Design System

Single source of truth for every surface — marketing site, app, emails, docs, future tools. Any human or AI agent building UI for PayoutBridge must follow this document verbatim.

Machine-readable mirror: [`design-tokens.json`](./design-tokens.json)
Runtime mirror (web): `src/styles.css` (`@theme` block + `html.mono-dark` / `html.mono-light`)

If these three files disagree, `design-tokens.json` wins and the other two must be regenerated.

---

## 1. Brand atmosphere

Serious fintech with editorial polish. Dark, high-contrast surfaces that read like professional accounting software — not a SaaS landing page. One distinctive serif accent (Instrument Serif, italic) contrasts a precise grotesque body (Geist). Motion is restrained and physical: fades, gentle scale, cubic-bezier easings — never linear, never bouncy.

- **Density:** Balanced (marketing) → Dense (app dashboards)
- **Variance:** Asymmetric bento layouts, not equal 3-column grids
- **Tone words:** auditable, forensic, calm, exact, quietly premium

---

## 2. Color tokens

Every color must be referenced by semantic token — **never** raw hex or arbitrary Tailwind color scales in components. Values below are the default dark theme (`:root`). Light and monochromatic themes live in `src/styles.css`.

| Token | oklch | Hex (approx) | Role |
|---|---|---|---|
| `--background` | `oklch(0.208 0.042 265.755)` | `#0f172a` | Page background (slate-900) |
| `--foreground` | `oklch(0.984 0.003 247.858)` | `#f8fafc` | Primary text |
| `--card` | `oklch(0.279 0.041 260.031)` | `#1e293b` | Card surfaces (slate-800) |
| `--card-foreground` | `oklch(0.984 0.003 247.858)` | `#f8fafc` | Text on cards |
| `--primary` | `oklch(0.623 0.214 259.815)` | `#3b82f6` | Primary accent (blue-500) |
| `--primary-foreground` | `oklch(0.984 0.003 247.858)` | `#f8fafc` | Text on primary |
| `--secondary` / `--muted` / `--accent` | `oklch(0.372 0.044 257.287)` | `#334155` | Secondary surfaces (slate-700) |
| `--muted-foreground` | `oklch(0.704 0.04 256.788)` | `#94a3b8` | Secondary text (slate-400) |
| `--destructive` | `oklch(0.637 0.237 25.331)` | `#ef4444` | Errors (red-500) |
| `--success` | `oklch(0.723 0.19 149.579)` | `#22c55e` | Verified state (green-500) |
| `--warning` | `oklch(0.769 0.188 70.08)` | `#f59e0b` | Warnings (amber-500) |
| `--border` | `oklch(1 0 0 / 10%)` | white/10 | Hairline borders |
| `--ring` | same as `--primary` | | Focus rings |

**Accent tints permitted in components** (for state chips, receipts, badges):
`emerald-*`, `rose-*`, `amber-*` from Tailwind — always at `-400/-500` for text on dark, `-300/-400` for muted, with `/20` or `/25` backgrounds and `/40` rings. Never introduce new hues (purple, teal, pink, indigo).

---

## 3. Typography

Three families, loaded once via `<link>` in `src/routes/__root.tsx`:

| CSS var | Family | Use |
|---|---|---|
| `--font-sans` | **Geist** 400–900 | Body, UI, headings |
| `--font-display` | **Instrument Serif** (italic) | Editorial accents inside headlines only |
| `--font-mono` | **JetBrains Mono** 400–600 | Money amounts, ledger rows, IDs |

Rules:
- Headings: `font-sans`, `tracking-[-0.02em]` (default) or `tracking-[-0.03em]` for hero-scale.
- Serif accents: `font-display italic` on **one or two words** per headline — never full lines.
- Numbers/money: `font-mono tabular-nums` for any figure that must align in a column.
- Feature settings enabled globally: `"tnum" 1, "ss01" 1, "cv11" 1`.
- **Banned fonts:** Inter, Roboto, Poppins, Arial, generic Times/Georgia serifs.

---

## 4. Spacing, radius, shadow

- Radius scale from `--radius: 0.625rem`: `sm/md/lg/xl` via `calc()`. Cards use `rounded-2xl`, hero receipt uses `rounded-[2rem]`.
- Section padding: `py-24` desktop, `py-16` mobile minimum.
- Hairlines: `border-white/10` or `ring-1 ring-white/10` on dark; never `border` alone (Tailwind v4 defaults to `currentColor`).
- Shadows: diffused and tinted (`shadow-2xl shadow-blue-950/40`); never harsh black drop shadows.

---

## 5. Component patterns

Reusable patterns already implemented — reproduce these, don't invent alternatives.

### 5.1 Double-bezel card
Outer shell (`p-1.5`, subtle bg, `ring-1 ring-white/10`, `rounded-2xl`) wrapping an inner core (`rounded-[calc(1rem-0.375rem)]`, own gradient bg, `shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]`). Reference: `src/components/HeroReceipt.tsx`.

### 5.2 Pill CTA with nested arrow
Primary button: `rounded-full`, high-contrast fill, `px-6 py-3`. Trailing `ArrowRight` sits inside its own `size-8 rounded-full` well flush to the right edge, transitions with `cubic-bezier(0.32, 0.72, 0, 1)`.

### 5.3 Eyebrow tag
`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]` with tone variants (primary/rose/amber/emerald) — text at `-100`, bg at `/20`, ring at `/60`.

### 5.4 Headline underlines
- Gradient soft-glow underline for positive-emphasis words ("bank feed").
- Red wavy SVG underline for negative-emphasis words ("lying").
Both must clear descenders (`pb-2` on the parent line) and never clip at any breakpoint.

### 5.5 Ledger row
Icon well (`size-6 rounded-md ring-1 ring-white/10`) + label/sub stack + right-aligned `font-mono tabular-nums` amount. Positive tone `emerald-300`, negative `rose-300`, neutral `white/80`.

---

## 6. Motion

| Utility | Purpose | Timing |
|---|---|---|
| `animate-fade-up` | Scroll-in reveals | 900ms `cubic-bezier(0.16, 1, 0.3, 1)` |
| `animate-reveal` | Cards mounting | 500ms `cubic-bezier(0.16, 1, 0.3, 1)` |
| `animate-gradient-shift` | Ambient gradients | 8s ease infinite |
| `animate-glow-pulse` | Ambient glows | 4s ease-in-out infinite |

Rules: only animate `transform` / `opacity` / `filter`. No `linear`, no default `ease-in-out`. Hover transitions use `duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]`.

---

## 7. Layout

- Asymmetric bento grids over equal 3-column rows.
- Container: `max-w-6xl mx-auto px-6` (marketing), `max-w-7xl` (app).
- Full-height sections: `min-h-[100dvh]`, never `h-screen`.
- Mobile: every multi-column layout collapses to single column below `md`. Use `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` for text-plus-widget rows.

---

## 8. Anti-patterns (never do)

- Raw hex or Tailwind color scales for structural colors in components (use tokens).
- Inter, Poppins, or generic serifs.
- Purple/indigo gradients on white — the "AI SaaS" cliché.
- Equal 3-column card rows for features.
- `border` without an explicit color (Tailwind v4 = `currentColor`).
- `h-screen` on landing sections (iOS Safari jump).
- Linear or default easings.
- New accent hues outside the palette in §2.
- Filler UI copy ("Scroll to explore", bouncing chevrons).

---

## 9. How to consume this in another tool

- **Figma / Tokens Studio:** import `design-tokens.json` (W3C DTCG format).
- **Another web app:** copy `src/styles.css` `@theme` block + the three `<link>` font tags in `__root.tsx`.
- **AI coding tool (Cursor, v0, Lovable):** point it at `AGENTS.md` — the "Design system" section restates the rules an agent needs before generating UI.
- **Emails / PDFs / slides:** read the hex column in §2 and the family names in §3.

Update flow: edit `design-tokens.json` → regenerate `src/styles.css` `@theme` → update the table in §2 of this file. Never edit only one.
