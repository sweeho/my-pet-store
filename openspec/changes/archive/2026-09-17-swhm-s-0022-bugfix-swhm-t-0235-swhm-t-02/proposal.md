## Why

Two defects were raised during SWHM-S-0021 and committed to this bugfix sprint. They are unrelated to each other, and only one of them is a defect in this repository.

**SWHM-T-0239 — `/NotFound` and `/RootErrorBoundary` are public screens.** `vite-plugin-pages` turns every non-excluded `.tsx` under `src/pages/` into a route, and neither of those two files is excluded. Confirmed by reading the route table out of a production build of the sprint branch: it carries `path:'NotFound'` and `path:'RootErrorBoundary'` as top-level routes alongside the catch-all's `path:'*'`. `/RootErrorBoundary` renders a bare "Error — An error occurred. Please try again later." page to anyone who types the path, with nothing wrong and no link onward; `/NotFound` publishes the not-found screen at a second address it was never meant to have. Neither file was written to be navigated to: `NotFound` is the catch-all's target and `RootErrorBoundary` is a React Router `errorElement` that `src/main.tsx` never wires up.

**SWHM-T-0235 — a dispatched agent run can be stranded without a codebase context.** Every claim in that ticket's evidence was re-verified line by line against the installed platform source at `/app/packages/core` (`@vortex/core@7.2.0`) and holds. The fix, however, cannot land here: `/app` is an unpacked runtime install with no git repository, no remote and no CI, and the dispatching call site (`wakeAssignedAgentsActivity`) is not even in that package. No commit on this product repository's sprint branch can change it. The verified root cause is recorded so the platform team inherits a finished diagnosis rather than a second investigation; see `design.md` § The platform defect and `artifacts/SWHM-S-0022/SWHM-T-0235/PLAN.md`.

## What Changes

- `NotFound.tsx` and `RootErrorBoundary.tsx` stop producing routes of their own. Both paths fall through to the catch-all and render the not-found screen, which keeps its single address at any unrouted path.
- The browser tier pins both paths, in the shape `e2e/legacy-routes.spec.ts` already uses for the boilerplate `/users` screens.
- A checked-in route inventory guards the class of fault rather than the two instances: every `.tsx` under `src/pages/` must be listed as an intended screen or named as excluded from routing, so a future component parked in that directory fails the unit suite instead of shipping as a public URL.
- `ARCHITECTURE.md` § Routing changes with it — "nothing lists routes anywhere" stops being true, deliberately.
- **No change lands in this repository for SWHM-T-0235.** Its root cause is recorded and the ticket is deferred with that reason.

Explicitly out of scope:

- **Deleting `RootErrorBoundary.tsx`.** Nothing in live code renders it and `src/App.md`, which documents the intended `errorElement` wiring, is an illustrative template doc rather than compiled code. Removing dead code is a decision beyond this defect; see `design.md` § Open questions.
- **Wiring an error boundary at all.** The product has no `errorElement` today and this change does not give it one.
- **Moving either file out of `src/pages/`.** Considered and rejected — `design.md` D1.
- **Any edit under `/app/packages/core`.** It is not version-controlled from here and a container edit is discarded.

## Impact

Affected capabilities:

- **`application-foundation`** — one requirement modified. "Product-branded application shell" already forbids the boilerplate's example screens from staying reachable; its scenarios did not cover the two non-screen components the same template left under `src/pages/`. Two scenarios are added to it: one pinning both paths to the not-found screen, one pinning the inventory guard that catches the next such file.

No capability is affected by SWHM-T-0235 — nothing the product does changes, so it carries no spec delta.

Affected code:

- `vite.config.ts` — the `Pages({ exclude })` list
- `src/page-routes.test.ts` (new) — the route inventory guard
- `e2e/legacy-routes.spec.ts` — two path assertions
- `ARCHITECTURE.md` § Routing — authored on the planning ticket, not by the fix

Risks this change accepts:

- **The inventory needs a line per new screen.** That is the cost of the guard and the point of it: a screen is published deliberately or not at all. The failure message names the offending file so the fix is obvious from the test output alone.
- **The behavioural assertion runs only in the browser tier.** `vitest.config.ts` deliberately omits the `Pages` plugin, so no unit test can observe file-based routing; the guard covers the source-level invariant and the browser tier covers the reachable path.
