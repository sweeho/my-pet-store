---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0022
ticket: SWHM-T-0239
branch: vortex/sprint/swhm-s-0022-75bc2a59
upstream: [openspec/changes/swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02/design.md]
---

# PLAN — SWHM-T-0239: `/NotFound` and `/RootErrorBoundary` are reachable as public screens

Read `openspec/changes/swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02/design.md` first. The measured route table, the rejected alternative and the reason each step takes the shape it does are there; this file does not repeat them.

## Objective

Two components that were never written to be navigated to — the catch-all's target and an unwired `errorElement` — stop being public addresses, and the next component parked under `src/pages/` fails a check instead of shipping as a URL.

## Steps

1. **Stop the two files producing routes.** Add them to the `Pages({ exclude })` list in `vite.config.ts`, alongside the existing `UnavailableInLanguage.tsx` entry and with a comment in the same spirit naming why each is not a screen. Per design.md D1 — do not move either file; design.md F4 explains what a move would break.
2. **Pin both paths in the browser tier.** Extend `e2e/legacy-routes.spec.ts` with a second `test.describe` block covering `/NotFound` and `/RootErrorBoundary`, mirroring the `/users` block's shape. Per design.md D5, which also records why no unit test can make this assertion.
3. **Add the route inventory guard.** A new repository-level Vitest file following `src/layout-width.test.ts`'s shape — enumerate the pages directory, require every non-test `.tsx` to be either a recorded intended screen or named in the config's exclude list, and fail naming the offending file. Per design.md D3 for what the guard asserts and D4 for why it reads the config as text rather than importing a shared constant.
4. **Seed the inventory from the current route table.** design.md F1 lists the screens a production build generates today; that is the starting content, minus the two files step 1 excludes.

## File / module ownership

This ticket may create or modify exactly these:

- `vite.config.ts` — the `Pages({ exclude })` array and its comment. Nothing else in the file.
- `src/page-routes.test.ts` — new. The guard from step 3. (Name it as you prefer; it belongs beside the other repository-level guards under `src/`, in the `client` Vitest project.)
- `e2e/legacy-routes.spec.ts` — one added `test.describe` block. The existing `/users` block and the API assertion are untouched.

Out of bounds, and deliberately so: `src/pages/NotFound.tsx`, `src/pages/RootErrorBoundary.tsx` and `src/pages/[...all].tsx` are not edited or moved (design.md D1, D6); `src/App.md` is not edited (design.md O2); `vitest.config.ts` is unchanged (design.md F6); no root doc is in this ticket's scope.

**Fixed interface contract.** `src/pages/[...all].tsx` keeps `export { default } from "./NotFound";` verbatim — the catch-all's re-export is what makes an unrouted path render the not-found screen, and excluding a file from route generation does not affect module resolution. If a step appears to require changing that line, the step is wrong.

## Definition of Done

- AC-1 and AC-2 hold in a real browser, asserted by step 2's spec.
- AC-3 holds, asserted by step 3's guard — including that the failure message names the file.
- AC-4 holds: the existing `/users` assertions still pass unchanged, which is the regression this fix must not take with it.
- The not-found screen renders identically at an unrouted path to how it renders today; this change adds no route, no redirect and no component edit.
