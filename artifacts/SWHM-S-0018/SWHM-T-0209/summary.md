---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0209
branch: vortex/feat/SWHM-T-0209-status-colour-coding-the-status-token-fa-5b2860b3
upstream: [artifacts/SWHM-S-0018/SWHM-T-0209/PLAN.md]
downstream: [artifacts/SWHM-S-0018/qa-test-report.md]
---

# Summary — SWHM-T-0209: Status colour coding — the status token family and the colour-coded cell

## What changed

Added the nine `--status-{pending,approved,denied}-{bg,fg,border}` custom properties to
`src/index.css`'s `:root` (the mockup's own light values, taken verbatim) and nine authored dark
counterparts to `.dark`, mapped through `@theme inline` so Tailwind generates real utility classes.
Applied them in `StatusSelect`'s trigger and option dots, following the mockup's
`.status-select.{pending,approved,denied}` rules and its open/focus ring treatment. The status text
still renders in every case — colour is decoration, never the only cue.

## Files

- `src/index.css` — nine light tokens (from the mockup), nine authored dark tokens, and their
  `@theme inline` mappings.
- `src/theme-tokens.test.ts` — extended with the same distinctness/contrast checks the destructive
  pair already has, for all three new pairs.
- `src/components/ui/status-select.tsx` — the trigger now carries a per-status class (background,
  foreground, border) plus an open-state ring; each option's dot is coloured the same way. Props
  signature unchanged (SWHM-T-0208's).
- `src/components/ui/status-select.test.tsx` — extended: each status renders its own
  `status-select-{status}` class, the three are mutually exclusive, and the status text stays
  present in every case.

## AC coverage

- AC-1 (status cells show the correct background colour per status) — the trigger's per-status
  class in `status-select.tsx`, tested by `status-select.test.tsx › AC-1` (one case per status) and
  the token contrast/distinctness checks in `theme-tokens.test.ts`.
- AC-2 (colour coding aids identification without needing the text, but the text still renders) —
  tested by `status-select.test.tsx › AC-2` (mutual exclusivity of the three classes, and the status
  text's continued presence) and the measured 4.5:1+ light-theme contrast ratios in
  `theme-tokens.test.ts`.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  120 passed (120)
     Tests  811 passed (811)
```

`bun run verify:full` was attempted first; its browser tier fails at the documented Chromium-missing
preflight in this container (`AGENTS.md § Notes from previous agents`) — not retried per that note.
`bun run build` was run separately to confirm the new tokens compile into real Tailwind CSS: the
built stylesheet resolves all nine custom properties in both themes with the authored `oklch()`
values, and the JS bundle carries the `status-select-{pending,approved,denied}` marker classes. A
real browser to view the rendered colours was not available in this container either (same
limitation SWHM-T-0208 recorded) — Testing Library's class/accessible-text assertions are the
verification actually performed, plus the measured WCAG contrast math in `theme-tokens.test.ts`.

See `tdd-test-result.md` — `TDD-RESULT: 811 passed, 0 failed`.

## Notes

The mockup gives no dark-theme values (its stylesheet defines only `:root`, no `.dark` block), so
the nine dark tokens are authored here per PLAN.md step 2 — same three hues (95 amber, 152 green,
27.325 red) restated at lightness/chroma that reads as a dark-surface chip, not a formula applied to
the light values. Computed (not estimated) contrast for all three dark pairs also clears 8:1+,
though only the light pairs are gated by `theme-tokens.test.ts`, matching the destructive pair's own
precedent.
