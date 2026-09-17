---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0021
ticket: SWHM-T-0238
branch: vortex/feat/SWHM-T-0238-adminshell-on-the-shared-header-and-the-46ea1fe2
upstream: [artifacts/SWHM-S-0021/SWHM-T-0238/PLAN.md]
downstream: [artifacts/SWHM-S-0021/qa-test-report.md]
---

# Summary — SWHM-T-0238: AdminShell on the shared header, and the route guards' column

## What changed

`AdminShell` is reduced to `StoreHeader`'s administration variant plus the back-link and content
frame (design.md § Decisions D8); it no longer takes or forwards a `username` prop. Its seven
callers drop the dead `GET /api/signon/session` effect that existed only to supply that prop
(F4). `RequireSignOn` and `RequireAdmin`'s pending/refusal states move from a literal `672px` onto
the shared `ADMIN_CONTENT_WIDTH` declaration (PLAN.md step 4, this ticket's AC-8). The two
page-level Logout controls on `admin/index.tsx` and `supplier/index.tsx` are untouched (F12).

## Files

- `src/components/AdminShell.tsx` — reduced to `StoreHeader variant="admin"` + back-link + frame; dropped `username`.
- `src/components/AdminShell.test.tsx` — rewritten for the new shape; adds header/content DOM-order and width assertions.
- `src/components/RequireSignOn.tsx`, `RequireAdmin.tsx` — pending/refusal `max-w-[672px]` → `ADMIN_CONTENT_WIDTH`.
- `src/components/RequireSignOn.test.tsx`, `RequireAdmin.test.tsx` — added width assertions for the pending/refusal states.
- `src/pages/admin/{index,orders,orders-approval,reports/orders,reports/revenue}.tsx`, `src/pages/supplier/{index,inventory}.tsx` — removed the dead session-fetch effect, `SessionInfo` type and `username` state; `AdminShell` call drops the prop.
- Matching `*.test.tsx` beside each of the seven pages above — mock fixtures extended to answer `/api/cart` (now fetched by `StoreHeader` inside `AdminShell`); the two home-screen tests' now-dead "pending username" case is replaced with a synchronous render assertion and an explicit F12 (page Logout + header Sign out coexist) case.

## AC coverage

- AC-1, AC-2, AC-3: met by `StoreHeader`'s admin variant (T1, unchanged here) mounted through the reduced `AdminShell` — `AdminShell.test.tsx` asserts the label, catalogue/cart links and username render.
- AC-4: unaffected — `admin/signon.tsx` and `admin/signon-failed.tsx` are out of scope and untouched.
- AC-5: covered by `StoreHeader.test.tsx` (T1's own test), unaffected by this ticket.
- AC-6: `AdminShell.test.tsx › AC-6` asserts the header precedes the back-link and content in document order.
- AC-7: `AdminShell.test.tsx › AC-7 / AC-8` asserts the header's inner container and the content frame share `ADMIN_CONTENT_WIDTH`.
- AC-8: `RequireSignOn.test.tsx` and `RequireAdmin.test.tsx`'s new width assertions, plus every one of the seven screens continuing to render through `AdminShell`'s single frame declaration.
- AC-9: `RequireSignOn.test.tsx` and `RequireAdmin.test.tsx`'s existing `role="status"` pending-state cases are untouched.
- AC-10: `admin/index.test.tsx` and `supplier/index.test.tsx`'s new "F12" cases assert the page's own Logout control renders alongside the header's Sign out.

## Verification

- Red (pre-mock-update, against the already-reduced source): `bun --bun vitest run <seven page test files>` → 39 failed, 5 passed, each failure `unexpected fetch: /api/cart` from `StoreHeader` inside `AdminShell`.
- Green: `bun run verify` (lint + typecheck + full unit suite) → 126 test files, 879 tests, all passed.
- `bun run verify:full`'s E2E tier was not run: its preflight (`node scripts/ensure-playwright-browser.mjs`) reports Chromium genuinely not installed in this container, matching the existing `AGENTS.md` note that implementation containers ship none. No `e2e/` spec references this ticket's scope.

## Notes

Per this ticket's AC-8 and PLAN.md step 4, **both** `RequireSignOn` and `RequireAdmin`'s
pending/refusal states now take `ADMIN_CONTENT_WIDTH` (832px), even though `RequireSignOn` itself
only ever guards customer-facing screens laid out at the store's 672px width (`CONTENT_WIDTH`).
This is what the ticket's explicit AC and PLAN.md step 4 both say, verbatim; `design.md`'s F8/D6
narrative groups the two guards under the store's 672px figure instead, which reads in tension with
it. Followed the ticket-level AC and PLAN.md, since they are this ticket's Definition of Done —
flagged here rather than silently resolved, in case Planning intended otherwise.
