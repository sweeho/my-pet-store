---
artifact: tdd-test-result
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

# TDD result — SWHM-T-0005

## Test cases

| Test                                                                                                 | Covers | Intent                                                         |
| ---------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| `src/theme-tokens.test.ts › 'light' theme: --destructive and --destructive-foreground are different` | AC-2   | light theme's destructive pair must not collapse to one colour |
| `src/theme-tokens.test.ts › 'dark' theme: --destructive and --destructive-foreground are different`  | AC-2   | dark theme's destructive pair must not collapse to one colour  |
| `src/theme-tokens.test.ts › light theme: ... clears WCAG AA (4.5:1) ...`                             | AC-1   | light destructive foreground/background contrast is ≥ 4.5:1    |

Regression guard fails on the offending theme by name: the identical-pair assertion is
run per-theme (`it.each`) so a future collapse in either block produces a message
prefixed `[light]` or `[dark]` naming the theme, satisfying AC-3.

## Red run

`bun --bun vitest run src/theme-tokens.test.ts` against the unmodified `src/index.css`
(`--destructive-foreground` still `oklch(0.577 0.245 27.325)`, identical to
`--destructive`):

```
 ❯ |client| src/theme-tokens.test.ts (3 tests | 2 failed) 4ms
     × 'light' theme: --destructive and --destructive-foreground are different colours
     × light theme: destructive foreground clears WCAG AA (4.5:1) against destructive background

 FAIL  |client| src/theme-tokens.test.ts > theme tokens — destructive pair > 'light' theme: --destructive and --destructive-foreground are different colours
AssertionError: [light] --destructive and --destructive-foreground must not be identical: expected 'oklch(0.577 0.245 27.325)' not to be 'oklch(0.577 0.245 27.325)'

 FAIL  |client| src/theme-tokens.test.ts > theme tokens — destructive pair > light theme: destructive foreground clears WCAG AA (4.5:1) against destructive background
AssertionError: [light] --destructive/--destructive-foreground contrast is 1.00:1, below the 4.5:1 AA minimum: expected 1 to be greater than or equal to 4.5

 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
```

The one passing test in the red run is the dark-theme distinctness check — the dark pair
was never identical, only below AA (design.md § D2), so that assertion was green from the
start and stays green after the fix.

## Green run

After setting `:root`'s `--destructive-foreground` to `oklch(1 0 0)`:

`bun --bun vitest run src/theme-tokens.test.ts`:

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

`bun run verify` — this stack's full gate (lint, typecheck, complete unit/integration
suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  50 passed (50)
      Tests  246 passed (246)
```

`bun run test:e2e` was not run: the E2E preflight (`scripts/ensure-playwright-browser.mjs`)
reports Chromium is genuinely not installed in this container — the documented limitation
recorded in `AGENTS.md`'s Notes from previous agents for this sprint's predecessor. This
ticket changes only a CSS custom property and adds a stylesheet-parsing unit test, with no
new route or page, so there is no new E2E-observable behavior; CI runs the full pipeline
including E2E before the DONE transition.

TDD-RESULT: 246 passed, 0 failed
