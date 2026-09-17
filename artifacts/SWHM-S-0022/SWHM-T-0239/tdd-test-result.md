---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0022
ticket: SWHM-T-0239
branch: vortex/fix/SWHM-T-0239-notfound-and-rooterrorboundary-are-reach-58bc1c9d
upstream: [artifacts/SWHM-S-0022/SWHM-T-0239/PLAN.md]
---

# TDD result — SWHM-T-0239

## Test cases

| Test                                                                                                                                                                       | Covers     | Intent                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/page-routes.test.ts › page route inventory — every page file is classified › every .tsx file under src/pages is an intended screen or excluded from route generation` | AC-3       | a `.tsx` under `src/pages` that is neither a recorded intended screen nor named in `vite.config.ts`'s `Pages({ exclude })` fails the check by name |
| `e2e/legacy-routes.spec.ts › Component pages are not reachable at an address of their own › /NotFound renders the not-found screen, not the error boundary`                | AC-1       | `/NotFound` renders the not-found heading, not the error-boundary copy                                                                             |
| `e2e/legacy-routes.spec.ts › Component pages are not reachable at an address of their own › /RootErrorBoundary renders the not-found screen, not the error boundary`       | AC-1, AC-2 | `/RootErrorBoundary` renders the not-found screen through the catch-all, not the error-boundary copy                                               |
| `e2e/legacy-routes.spec.ts › Legacy /users scaffold routes` (existing, unmodified)                                                                                         | AC-4       | `/users`, `/users/1`, `/users/profile` still fall through to the not-found screen                                                                  |

## Red run

`bun --bun vitest run src/page-routes.test.ts`, run against `vite.config.ts` with the fix reverted
(`Pages({ exclude })` still only naming `*.test.tsx`, `*.test.ts` and `UnavailableInLanguage.tsx`):

```
FAIL  |client| src/page-routes.test.ts > page route inventory — every page file is classified > every .tsx file under src/pages is an intended screen or excluded from route generation
AssertionError: unclassified page file(s) — add to INTENDED_SCREENS in src/page-routes.test.ts if this is a screen, or to vite.config.ts's Pages({ exclude }) if it is not: src/pages/NotFound.tsx, src/pages/RootErrorBoundary.tsx: expected [ 'src/pages/NotFound.tsx', …(1) ] to deeply equal []

 Test Files  1 failed (1)
      Tests  1 failed (1)
```

The failure names both offending files, confirming the pre-fix gap the guard exists to catch.

The `e2e/legacy-routes.spec.ts` block cannot get an equivalent red run in this container: this
container's Chromium is genuinely not installed (`scripts/ensure-playwright-browser.mjs` fails
fast — see `## Green run`), and `vitest.config.ts` deliberately has no file-based-routing support
(design.md § F6), so no unit-test tier can see this half of the bug either. The bug itself was
reproduced directly instead: `bun run build`, then reading the generated route table out of
`.output/public/assets/index-*.js`, showed literal `path:\`NotFound\``and`path:\`RootErrorBoundary\``entries before the`vite.config.ts`fix, and neither after it (see`fix-note.md`). The new Playwright spec is committed as real test code and is
`Pending Verification` by this run; it executes in CI on this branch and again in the
INTEGRATION_QA phase, which is where the assertion is actually observed running.

## Green run

`bun run verify` (this stack's full pre-commit gate — lint, typecheck, and the complete unit test
suite, including the new `src/page-routes.test.ts`), run after restoring the `vite.config.ts` fix:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  133 passed (133)
      Tests  902 passed (902)
```

`bun run test:e2e` was attempted first, per `verify-full`, and failed its own preflight rather than
running any spec:

```
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
```

This matches the pattern already recorded in `AGENTS.md` § Notes from previous agents for six
other tickets in this sprint: the implementation container genuinely has no Chromium. Per that
note, falling back to `bun run verify` rather than retrying or installing a browser.

TDD-RESULT: 902 passed, 0 failed
