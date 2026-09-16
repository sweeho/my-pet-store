---
ticket: SWHM-T-0193
title: Fulfilment entry point and access rules
---

## What changed

Added the fulfilment capability's entry point and its access rules, per PLAN.md's
fixed interface contract:

- `fulfillment/receive.ts` — `parseFulfillmentRequest(body): FulfillmentRequest`, a
  pure function throwing `InvalidFulfillmentMessageError` for anything that is not
  `{ orderId: number }` (the message-selector counterpart, design.md S1/S11).
- `routes/api/fulfillment/process.post.ts` — `POST /api/fulfillment/process`: parses
  the body, calls `processOrder` (SWHM-T-0192), answers
  `{ orderId, invoice, status }`. 400 for an unparseable body, 404 for
  `OrderNotFoundError`; no in-handler role check, since access is enforced entirely
  by the path-level resource entry below plus the existing `middleware/signon.ts`
  (mirroring `routes/api/order/index.post.ts`'s shape — creating the file is the
  whole registration step).
- `auth/protected-resources.ts` — three new `requiresRole: ADMIN_ROLE` entries:
  `/api/fulfillment`, `/supplier`, `/api/supplier`. No other entry or behaviour was
  touched.

## Files touched

- `fulfillment/receive.ts` (new)
- `fulfillment/receive.test.ts` (new) — 8 unit tests.
- `routes/api/fulfillment/process.post.ts` (new)
- `routes/api/fulfillment/process.post.test.ts` (new) — 4 integration tests.
- `auth/protected-resources.ts` — 3 lines added, nothing else changed.
- `auth/protected-resources.test.ts` — 10 new cases (PR-05..PR-14) added to the
  existing suite.
- `artifacts/SWHM-S-0017/SWHM-T-0193/tdd-test-result.md`, `summary.md` (new)

No other file was modified — `fulfillment/fulfillment.ts`, `middleware/signon.ts`,
`auth/signon-filter.ts`, and the pre-existing resource entries are untouched, per the
ticket's ownership boundary.

## Acceptance criteria coverage

- "PO is received from message queue" (message-driven bean extracts and processes):
  RT-01, and the route's happy path PT-03.
- "A request whose body is not an order identifier is refused with 400 and changes
  no inventory, no shipped quantity and no order status": PT-01.
- "A request naming an order that does not exist is refused with 404": PT-02.
- "`/supplier`, `/api/supplier` and `/api/fulfillment` each require the
  administrator role... a signed-on request without the role is refused rather than
  redirected": PR-05..PR-07 (registration), PR-09..PR-13 (the actual access rule via
  `evaluateAccess`, mirroring `signon-filter.test.ts`'s own admin-path assertions).

## Verification

```
$ bun run test -- fulfillment/receive.test.ts routes/api/fulfillment/process.post.test.ts auth/protected-resources.test.ts
  → 3 files, 26 tests passed
$ bun run verify:full
  lint     → pass
  typecheck→ pass
  test     → 107 files, 690 tests passed
  test:e2e → Chromium not installed in this container (documented gap, see
             AGENTS.md § Notes from previous agents); not retried, runs in CI/QA
```

## Notes

- `readOrderStatus(request.orderId)!` in the route uses a justified non-null
  assertion: `processOrder` above already threw `OrderNotFoundError` if the order
  didn't exist, so the status read cannot be null at that point.
- The `legacy:` labels follow design.md's own naming: `SupplierOrderMDB` for
  `/api/fulfillment` (D1 — the queue becomes this request), `index.jsp` for
  `/supplier` (the supplier home page JSP being replaced), `RcvrRequestProcessor`
  for `/api/supplier` (the servlet the inventory-update form posted to, S8).
