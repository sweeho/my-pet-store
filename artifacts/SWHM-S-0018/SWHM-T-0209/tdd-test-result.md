---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0209
branch: vortex/feat/SWHM-T-0209-status-colour-coding-the-status-token-fa-5b2860b3
upstream: [artifacts/SWHM-S-0018/SWHM-T-0209/PLAN.md]
---

# TDD result — SWHM-T-0209

## Test cases

| Test                                                                                                                   | Covers                     | Intent                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `theme-tokens.test.ts › [light/dark] theme: --status-pending-bg and --status-pending-fg are different colours`         | PLAN.md step 3             | distinctness, both themes                                               |
| `theme-tokens.test.ts › [light/dark] theme: --status-approved-bg and --status-approved-fg are different colours`       | PLAN.md step 3             | distinctness, both themes                                               |
| `theme-tokens.test.ts › [light/dark] theme: --status-denied-bg and --status-denied-fg are different colours`           | PLAN.md step 3             | distinctness, both themes                                               |
| `theme-tokens.test.ts › light theme: --status-pending-fg clears WCAG AA (4.5:1) against --status-pending-bg`           | AC-1, AC-2, PLAN.md step 2 | measured contrast, not estimated                                        |
| `theme-tokens.test.ts › light theme: --status-approved-fg clears WCAG AA (4.5:1) against --status-approved-bg`         | AC-1, AC-2, PLAN.md step 2 | measured contrast, not estimated                                        |
| `theme-tokens.test.ts › light theme: --status-denied-fg clears WCAG AA (4.5:1) against --status-denied-bg`             | AC-1, AC-2, PLAN.md step 2 | measured contrast, not estimated                                        |
| `status-select.test.tsx › AC-1: PENDING renders the status-select-pending class on its trigger`                        | AC-1                       | hue family applied per status                                           |
| `status-select.test.tsx › AC-1: APPROVED renders the status-select-approved class on its trigger`                      | AC-1                       | hue family applied per status                                           |
| `status-select.test.tsx › AC-1: DENIED renders the status-select-denied class on its trigger`                          | AC-1                       | hue family applied per status                                           |
| `status-select.test.tsx › AC-2: [status]'s trigger does not also carry another status's class`                         | AC-2                       | the three treatments are mutually exclusive                             |
| `status-select.test.tsx › AC-2: [status]'s status text is still rendered in the trigger, colour is never the only cue` | AC-2                       | WCAG 1.4.1 — text stays, colour is not the sole carrier                 |
| `status-select.test.tsx › SS-01..SS-05 (pre-existing, SWHM-T-0208)`                                                    | regression                 | trigger naming, options list, onChange, disabled — unaffected by colour |

## Red run

`bun --bun vitest run src/theme-tokens.test.ts` — `src/index.css` temporarily reverted to its
pre-ticket state (no `--status-*` tokens):

```
FAIL src/theme-tokens.test.ts > theme tokens — status pairs (pending, approved, denied) > 'light' theme: --status-pending-bg and --status-pending-fg are different colours
Error: Could not find --status-pending-bg in block
FAIL src/theme-tokens.test.ts > theme tokens — status pairs (pending, approved, denied) > light theme: --status-pending-fg clears WCAG AA (4.5:1) against --status-pending-bg
Error: Could not find --status-pending-bg in block
... (9 of 12 new cases fail the same way, across pending/approved/denied × distinctness/contrast)

Test Files  1 failed (1)
     Tests  9 failed | 3 passed (12)
```

`bun --bun vitest run src/components/ui/status-select.test.tsx` — `status-select.tsx` temporarily
reverted to its pre-ticket state (neutral surface, no status classes):

```
FAIL status-select.test.tsx > StatusSelect — status colour coding (SWHM-T-0209) > AC-1: PENDING renders the status-select-pending class on its trigger
Expected the element to have class: status-select-pending
Received: border-input bg-background flex h-8 w-[148px] ... (no status class)
FAIL ... APPROVED renders the status-select-approved class ...
FAIL ... DENIED renders the status-select-denied class ...

Test Files  1 failed (1)
     Tests  3 failed | 11 passed (14)
```

(The "does not carry another status's class" and "text is still rendered" cases pass even against
the unwired component, since a neutral trigger trivially satisfies both — only the three "renders
its own class" cases genuinely required the change.)

Both reverts were restored immediately after capturing each failure.

## Green run

`bun run verify` — this project's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`). `verify:full`'s browser tier was attempted and fails at the documented preflight (Chromium not installed in this container — `AGENTS.md § Notes from previous agents`); not retried per that note. `bun run build` was also run separately to confirm the new `@theme inline` mappings compile into real Tailwind utilities — the built CSS contains all nine `--status-{pending,approved,denied}-{bg,fg,border}` custom properties resolved with their authored `oklch()` values in both `:root` and `.dark`, and the JS bundle carries the `status-select-{pending,approved,denied}` marker classes.

```
$ bun run lint && bun run typecheck && bun run test
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   ✓ (no output)
tsc --build                                                                  ✓ (no output)
NODE_ENV=test bun --bun vitest run

 Test Files  120 passed (120)
      Tests  811 passed (811)
```

TDD-RESULT: 811 passed, 0 failed
