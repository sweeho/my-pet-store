---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0204
branch: vortex/feat/SWHM-T-0204-auto-approval-logic-locale-thresholds-an-66744cf5
upstream: [artifacts/SWHM-S-0018/SWHM-T-0204/PLAN.md]
downstream: [artifacts/SWHM-S-0018/qa-test-report.md]
---

# Summary — SWHM-T-0204: Auto-approval logic — locale thresholds and the order locale

## What changed

Added `order/approval-types.ts` (the sprint's shared type file, written whole per D10) and
`order/approval.ts`'s pure `decideApproval(locale, orderAmount)`. Added a nullable `orders.locale`
column, written at placement from `profiles.preferred_language` (never resolved at decision time,
D2). `placeOrder` now decides the inserted row's status from `decideApproval` using the cart's
subtotal, instead of hardcoding `PENDING`.

## Files

- `order/approval-types.ts` — new. `ApprovalLocale`, `ApprovalDecision`, `DecisionOutcome`,
  `SupplierPurchaseOrder`, `SupplierPoLine`, `NotificationKind`, written whole for later tickets to
  import.
- `order/approval.ts` — new. `decideApproval`, a pure function of locale and amount.
- `order/approval.test.ts` — new. Unit coverage for the four scenarios plus both thresholds'
  boundaries and the unmatched/null-locale branch.
- `db/schema.ts` — added `orders.locale` (nullable `text`).
- `drizzle/0010_fast_polaris.sql` + `drizzle/meta/*` — generated migration for the column.
- `order/order.ts` — `placeOrder` resolves the placing customer's `preferredLanguage`, writes it to
  `orders.locale`, and sets the inserted row's status from `decideApproval(locale, cart.subtotal)`.
- `order/order.test.ts` — updated `OT-05` (a default-locale order under threshold is now `APPROVED`,
  not unconditionally `PENDING`) and added an `AP-01`..`AP-06` block covering all four locale/amount
  scenarios plus locale persistence and the no-profile-row case.
- `db/client.ts` — demo `SEED_ORDERS` now carry a `locale`, including one `ja_JP` order at a
  yen-scale amount (¥68,400) matching the mockup's pending rows.

## AC coverage

- AC-1 (US order under $500 → APPROVED) — `order/approval.ts`, tested by
  `approval.test.ts › AC-1` and `order.test.ts › AP-01`.
- AC-2 (US order over $500 → PENDING) — tested by `approval.test.ts › AC-2` and
  `order.test.ts › AP-02`.
- AC-3 (Japan order under ¥50,000 → APPROVED) — tested by `approval.test.ts › AC-3` and
  `order.test.ts › AP-03`.
- AC-4 (Japan order over ¥50,000 → PENDING) — tested by `approval.test.ts › AC-4` and
  `order.test.ts › AP-04`.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  113 passed (113)
     Tests  738 passed (738)
```

`bun run verify:full` was attempted first; its browser tier fails at the documented preflight
(Chromium not installed in this container — `AGENTS.md § Notes from previous agents`), so `verify`
stands in per that note. E2E is not part of this ticket's scope (no UI change) and runs again in CI
and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 738 passed, 0 failed`.

## Notes

The decision needs the order's total before the row is inserted (status is set at insert time), but
`order/order.ts`'s existing `createLineItems` only totals `order_amount` in a follow-up `UPDATE`
after the line items are written. `placeOrder` already calls `getCart(sessionId)` for the
empty-cart guard, so the decision uses that same call's `subtotal` — the identical figure
`createLineItems` later writes onto the row (proven by the existing `LI-06` test) — rather than
re-querying or duplicating the total. Not a deviation from `PLAN.md`, which left the "how" of
sequencing to the implementation.
