<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Design system (read before generating any UI)

The canonical design language lives in **[`docs/DESIGN.md`](./docs/DESIGN.md)** with a
machine-readable mirror in **[`design-tokens.json`](./design-tokens.json)** and a runtime
mirror in the `@theme` block of **`src/styles.css`**. If any two disagree,
`design-tokens.json` is the source of truth.

Non-negotiable rules for every UI change:

- **Colors:** use semantic tokens only (`bg-background`, `text-foreground`, `bg-card`,
  `text-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, `text-destructive`,
  `text-success`, `text-warning`). Never hardcode hex, `text-white`, `bg-black`, or arbitrary
  Tailwind color scales for structural colors. Accent tints from `emerald-*`, `rose-*`,
  `amber-*` are allowed for state chips only, at the intensities documented in `DESIGN.md` §2.
  No new hues (purple, indigo, teal, pink).
- **Fonts:** body/UI uses `font-sans` (Geist). Editorial accents inside headlines use
  `font-display italic` (Instrument Serif) on one or two words only — never full lines.
  Money, IDs, and any aligned number column use `font-mono tabular-nums` (JetBrains Mono).
  Banned: Inter, Roboto, Poppins, generic serifs.
- **Layout:** asymmetric bento grids, never equal 3-column feature rows. Marketing sections
  use `py-24` desktop / `py-16` mobile minimum. Full-height sections use `min-h-[100dvh]`,
  never `h-screen`. Every multi-column layout collapses to single column below `md`.
- **Components:** reproduce the patterns in `DESIGN.md` §5 — double-bezel cards, pill CTAs
  with nested-arrow wells, eyebrow tags, gradient/wavy headline underlines, ledger rows.
  Reference implementations: `src/components/HeroReceipt.tsx`, `src/routes/index.tsx`.
- **Borders & shadows:** always name a border color (Tailwind v4's bare `border` is
  `currentColor`). Hairlines are `border-white/10` or `ring-1 ring-white/10` on dark.
  Shadows are diffused and tinted — never harsh black drop shadows.
- **Motion:** only animate `transform` / `opacity` / `filter`. Use the easings and
  durations in `DESIGN.md` §6 (`cubic-bezier(0.16,1,0.3,1)` for reveals,
  `cubic-bezier(0.32,0.72,0,1)` for hover/magnetic). No `linear`, no default `ease-in-out`.
- **Anti-patterns:** see `DESIGN.md` §8 — purple/indigo gradients on white, filler UI copy
  ("Scroll to explore", bouncing chevrons), and equal 3-column card rows are forbidden.

When adding a new color, font weight, spacing step, or easing: update
`design-tokens.json` first, then regenerate the `@theme` block in `src/styles.css`, then
update the tables in `docs/DESIGN.md`. Never edit only one.

