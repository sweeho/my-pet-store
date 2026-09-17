---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0022
ticket: SWHM-T-0239
branch: vortex/fix/SWHM-T-0239-notfound-and-rooterrorboundary-are-reach-58bc1c9d
upstream: [artifacts/SWHM-S-0022/SWHM-T-0239/PLAN.md]
downstream: [artifacts/SWHM-S-0022/qa-test-report.md]
---

# Fix note — SWHM-T-0239: `/NotFound` and `/RootErrorBoundary` are reachable as public screens

## Root cause

`vite-plugin-pages` (`Pages({ dirs: "src/pages", extensions: ["tsx", "jsx"] })` in
`vite.config.ts`) turns every non-excluded `.tsx` file under `src/pages/` into a route. The
plugin's `exclude` array only named test files and one shared component
(`UnavailableInLanguage.tsx`), so `NotFound.tsx` — the catch-all's render target, imported by
`src/pages/[...all].tsx` — and `RootErrorBoundary.tsx` — an `errorElement` nothing in
`src/main.tsx` wires up — were scanned like any other screen and published as top-level routes.
Confirmed by building the project and reading the generated route table out of
`.output/public/assets/index-*.js`: it listed `path:\`NotFound\``and`path:\`RootErrorBoundary\``as literal top-level paths alongside the catch-all's`path:\`\*\``. Neither file was ever written to
be navigated to directly.

## Fix

Added `**/NotFound.tsx` and `**/RootErrorBoundary.tsx` to `Pages({ exclude })` in
`vite.config.ts`, following the existing `UnavailableInLanguage.tsx` precedent. Excluding a file
from route generation does not affect module resolution, so `src/pages/[...all].tsx`'s
`export { default } from "./NotFound";` keeps working unchanged, and any path that isn't a real
screen now falls through to the catch-all's `*` route, which already renders `NotFound`. No route
was added, no redirect was introduced, and neither page component was edited or moved.

Also added a checked-in route inventory (`src/page-routes.test.ts`) so a future component parked
under `src/pages/` fails a Vitest check — naming the offending file — instead of silently shipping
as a public URL, since nothing in a file's text distinguishes a screen from a component.

## Regression test

- `e2e/legacy-routes.spec.ts › Component pages are not reachable at an address of their own` (new
  `test.describe` block) — pins the actual bug: `/NotFound` and `/RootErrorBoundary` render the
  not-found screen, and the error boundary's "An error occurred" copy is absent. Playwright is the
  only tier that can assert this (`vitest.config.ts` has no file-based-routing support), so no
  unit-test red/green exists for this half of the fix — see `tdd-test-result.md`.
- `src/page-routes.test.ts › page route inventory` (new file) — the forward-looking guard for
  AC-3. Red→green recorded in `tdd-test-result.md`.

## Files touched

- `vite.config.ts` — added `**/NotFound.tsx` and `**/RootErrorBoundary.tsx` to `Pages({ exclude })`
  with a comment explaining why, alongside the existing entries.
- `src/page-routes.test.ts` (new) — the route inventory guard: every non-test `.tsx` under
  `src/pages/` must be either a recorded intended screen or named in `vite.config.ts`'s exclude
  list, or the check fails naming the file.
- `e2e/legacy-routes.spec.ts` — added one `test.describe` block asserting `/NotFound` and
  `/RootErrorBoundary` render the not-found screen. The existing `/users` block and the
  `GET /api/users` assertion are untouched.
