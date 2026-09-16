---
ticket: SWHM-T-0194
type: summary
---

# Summary — SWHM-T-0194

## What changed

Added the supplier home screen at `src/pages/supplier/index.tsx` (route
`/supplier`, registered by creating the file — `ARCHITECTURE.md § Routing`).
Built from `mockup-supplier-home.html`: the heading **Supplier**, the lede,
a "What this module does" card with its five statements, an "Inventory"
card ("Administrators only.") with a **Display Inventory** control, and a
**Logout** control below. Colours and type come from the application's own
Tailwind tokens (`text-foreground`, `text-muted-foreground`, `border-border`,
`bg-card`), not the mockup's inline CSS.

Structurally mirrors `src/pages/admin/index.tsx`: a default export wrapping
`SupplierHomeContent` in `RequireAdmin`; the content component renders
inside `AdminShell`, fetching the signed-on username from
`/api/signon/session`. Both components are reused, not modified. Display
Inventory navigates to `/supplier/inventory`; Logout posts to
`POST /api/signon/logout` and navigates to `/` — no new session mechanism.

## Files touched

- `src/pages/supplier/index.tsx` (new) — the screen.
- `src/pages/supplier/index.test.tsx` (new) — 4 tests.
- `artifacts/SWHM-S-0017/SWHM-T-0194/tdd-test-result.md` (new)
- `artifacts/SWHM-S-0017/SWHM-T-0194/summary.md` (new, this file)

No other file was modified — `src/components/`, `src/pages/admin/`,
`auth/protected-resources.ts` and `src/index.css` are untouched, per ticket
ownership. Confirmed `/supplier` is already a `requiresRole: ADMIN_ROLE`
entry (registered by SWHM-T-0193), so the whole subtree already requires the
administrator role and this page has no non-administrator variant.

## Acceptance criteria coverage

- AC "Home page displays module description" → the heading, lede and
  "What this module does" list are asserted directly by the render test.
- AC "Home page provides display inventory button" → asserted by role/name
  and by the navigation-on-click test (navigates to `/supplier/inventory`).
- AC "Home page provides logout button" → asserted by role/name and by the
  POST-then-navigate test (posts to `/api/signon/logout`, navigates to `/`).

## Verification

- `bun --bun vitest run src/pages/supplier/index.test.tsx` — 4/4 passed
  (red confirmed first: module did not exist).
- `bun run verify` (lint + typecheck + full unit suite) — 694/694 tests
  passed, lint and typecheck clean.
- `bun run verify:full` — attempted; its E2E preflight reports Chromium is
  not installed in this container (documented in `AGENTS.md`). The browser
  journey through this screen is SWHM-T-0196's; falling back to `verify` is
  the documented rule, not a gap in this ticket's coverage.
