---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0156
branch: vortex/feat/SWHM-T-0156-order-creation-dd97f995
upstream: [artifacts/SWHM-S-0014/SWHM-T-0156/PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Summary — SWHM-T-0156: Order creation

## What changed

Added `order/order.ts`'s `placeOrder(userName, submission)`, which inserts the order row —
session username, placement-time date, `PENDING` status, both addresses copied from the
submission — and wired `routes/api/order/index.post.ts`'s success path to call it and return
`{ orderId, email }`. The existing 401/400 branches are untouched. No line items, no cart
clearing, no transaction — those arrive with SWHM-T-0157/SWHM-T-0158.

## Files

- `order/order.ts` — new; `placeOrder` and `PlaceOrderResult`.
- `order/order.test.ts` — new; 7 cases (OT-01–OT-07).
- `routes/api/order/index.post.ts` — success path now calls `placeOrder` instead of returning
  `{ accepted: true }`.
- `routes/api/order/index.post.test.ts` — PO-04 updated to assert the new `{ orderId, email }`
  response instead of `{ accepted: true }`.

## AC coverage

- AC-1, AC-2 (billing/shipping captured and stored) — `order/order.ts`'s `billingColumns`/
  `shippingColumns`, covered by `OT-02`/`OT-03`.
- AC-3, AC-7 (order date = placement time, asserted against a controlled clock) — `new Date()`
  in `placeOrder`, covered by `OT-06` (`vi.useFakeTimers`/`setSystemTime`).
- AC-4 (`user_name` is the session's, never the body's) — `placeOrder`'s signature takes
  `userName` as a separate parameter the route resolves from `useSignOnSession`, never read off
  `submission`; covered by `OT-01`.
- AC-5 (`PENDING`, no new status) — literal in `placeOrder`'s insert, covered by `OT-05`.
- AC-6 (addresses are what was submitted; no account read/write) — `placeOrder` only ever reads
  `submission.billingAddress`/`shippingAddress`, never touches `account/`; covered by `OT-04`.
- AC-8 (route returns `{ orderId, email }`, 401/400 unchanged) — `index.post.ts`'s success
  return; covered by `PO-04`, with `PO-01`–`PO-03` proving the existing branches are unaffected.

## Verification

```
$ bun --bun vitest run order/order.test.ts routes/api/order/index.post.test.ts
 Test Files  2 passed (2)
      Tests  11 passed (11)

$ bun run verify        # lint + typecheck + full unit suite
 Test Files  88 passed (88)
      Tests  544 passed (544)
```

`bun run verify:full`'s E2E tier fails only on this container's missing Chromium
(`ensure-playwright-browser.mjs`), per AGENTS.md's known containers-ship-no-Chromium note; E2E
is observed in CI / integration QA. See `tdd-test-result.md` — `TDD-RESULT: 544 passed, 0 failed`.

## Notes

- `order_amount` is written as a `0` placeholder (the column is `NOT NULL` with no default) —
  per the ticket, SWHM-T-0157 overwrites it once it totals the line items; no test in this
  ticket asserts that value.
- The response's `email` is the billing address's email. Nothing upstream fixes which of the
  two per-section emails is "the" order contact — the legacy spec had one shared `contactInfo`
  field, but this schema splits contact details per section (design.md S6). Billing is the
  section listed first (legacy `address_a`), so it was the more defensible default; SWHM-T-0159
  (confirmation screen) consumes this response as-is.
