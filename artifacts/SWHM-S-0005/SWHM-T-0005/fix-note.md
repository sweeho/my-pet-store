---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0005
ticket: SWHM-T-0005
branch: vortex/fix/SWHM-T-0005-light-mode-destructive-foreground-is-the-98a9833e
upstream:
  [
    artifacts/SWHM-S-0005/SWHM-T-0005/PLAN.md,
    openspec/changes/swhm-s-0005-bugfix-swhm-t-0005-light-mod/design.md,
  ]
---

# Fix note — SWHM-T-0005

## Root cause

`src/index.css:22-23` — the light theme's `:root` block defines `--destructive` and
`--destructive-foreground` as the byte-identical value `oklch(0.577 0.245 27.325)`
(`#e7000b`). Any element using the `destructive` button variant paints its label in
exactly its background colour: measured contrast 1.00:1.

The defect report suggested modelling the fix on the `.dark` block's pair. Measurement
(design.md § "Measured context") shows that pair is itself only 2.63:1, below AA — copying
it would produce a second failing pair. Not followed; see design.md § D2.

## Fix

Set the light `--destructive-foreground` to `oklch(1 0 0)` (`#ffffff`), the value with the
largest available margin against the fixed `--destructive` background (4.77:1 — design.md
§ D1). `--destructive` itself, the `.dark` block, and all consumers of `--destructive` as
text colour (`src/pages/signon.tsx`, `signon-failed.tsx`, `user-creation-error.tsx`,
`customer.tsx`) are untouched — they read `--destructive`, not the foreground token.

## Files touched

- `src/index.css` — one line, `:root`'s `--destructive-foreground` value.
- `src/theme-tokens.test.ts` — new regression guard: parses `src/index.css` directly
  (not a rendered DOM — see design.md § D3), asserts `--destructive` /
  `--destructive-foreground` differ in both `:root` and `.dark`, and asserts the light
  pair's contrast is ≥ 4.5:1. Failure messages name the offending theme.
