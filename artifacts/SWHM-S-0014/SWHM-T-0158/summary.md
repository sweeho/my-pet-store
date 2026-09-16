---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0158
branch: vortex/feat/SWHM-T-0158-cart-clearing-after-order-placement-f454c29a
upstream: [artifacts/SWHM-S-0014/SWHM-T-0158/PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Summary — SWHM-T-0158: Cart clearing after order placement

## What changed

`placeOrder` (`order/order.ts`) now wraps the order insert, `createLineItems`, and
`clearCartAfterOrder` (`cart/checkout.ts`) in one `db.transaction()`, taking a new `sessionId`
parameter so the cart it clears is the shopper's own. A failure anywhere in the transaction rolls
back the whole thing — no partial order, no orphaned line item, and the cart is never cleared.

## Files

- `order/order.ts` — `placeOrder` takes `(userName, submission, sessionId)`, wraps the body in
  `db.transaction()`, calls `createLineItems` then `clearCartAfterOrder` inside it.
- `order/order.test.ts` — existing `OT-*`/`LI-*` cases updated to the new 3-arg call (behaviour
  unchanged); 5 new cases (`CC-01`…`CC-05`) for clearing, cross-session isolation, and rollback.
- `routes/api/order/index.post.ts` — passes `session.id` as `placeOrder`'s third argument (see
  Notes — outside this ticket's stated ownership, but necessary).
- `artifacts/SWHM-S-0014/SWHM-T-0158/{tdd-test-result.md,PLAN.md}` — PLAN.md's ownership section
  gained a paragraph recording the route deviation below.

## AC coverage

- AC-1 (cart empty after placement) — `order/order.test.ts › CC-01`.
- AC-2 (single transaction covering order insert, line items, clear) — `order/order.ts`'s
  `placeOrder`; `CC-03`, `CC-04` prove it is a real transaction, not just sequential calls.
- AC-3 (a failed insert leaves the cart intact, no partial order, no orphaned line item) —
  `CC-03` (order-insert failure, via a `vi.spyOn(db, "insert")` throw on the first call), `CC-04`
  (line-item-insert failure, throw on the second call) — same technique
  `cart/cart.test.ts`/`admin/order-status.test.ts` already use for their own rollback proof.
- AC-4 (cleared via `clearCartAfterOrder`, no delete of `order/`'s own) — `CC-05` spies on
  `cart/checkout.ts`'s `clearCartAfterOrder` export directly and asserts it (not a direct delete)
  is what runs; `order/order.ts` also imports no `cartItems` table reference at all, verified by
  inspection.
- AC-5 (one session's clear leaves another's cart untouched) — `CC-02`.

## Verification

```
$ bun run lint && bun run typecheck && bun run test   # bun run verify
Test Files  90 passed (90)
     Tests  563 passed (563)
```

See `tdd-test-result.md` — `TDD-RESULT: 563 passed, 0 failed`.

`bun run verify:full`'s E2E tier was attempted and stopped at the documented missing-Chromium
preflight (no browser in this container); the same tier runs in CI and at integration QA.

## Notes

- **Deviation: `routes/api/order/index.post.ts` needed a two-line change, outside this ticket's
  stated file ownership (`order/order.ts` + its test only).** `cart_items` is keyed on session id,
  never username (`cart/cart.ts`), so clearing a cart needs the session's `id`, which
  `placeOrder`'s existing `(userName, submission)` signature had no way to receive — the caller has
  to supply it. The route was the only caller, already resolving the full session via
  `useSignOnSession` but discarding everything except `j_signon_username`; the fix was to keep the
  whole `session` object and pass `session.id` as `placeOrder`'s third argument. This was
  unavoidable: without it, this ticket's whole feature (cart clearing on real order placement)
  would have no effect outside its own unit tests, since production traffic only reaches
  `placeOrder` through that route. Treated as a minor, additive deviation rather than a blocking
  one — no existing behaviour on that route changed (401/400 branches untouched), no other ticket
  is concurrently editing that file, and `SWHM-T-0161`'s own `PLAN.md` (already on the branch, a
  ticket that depends on this one) already lists the same route file in its ownership, confirming
  the file is expected to keep accreting wiring across this ticket sequence. Recorded on this
  ticket's own `PLAN.md` under File/module ownership.
- `db.transaction()` here follows the exact precedent PLAN.md names (`cart/cart.ts`'s
  `updateItems`, `admin/order-status.ts`'s `updateOrderStatus`): the callback calls the outer `db`
  singleton directly (no `tx` parameter threaded through), which is this repository's established
  pattern for the synchronous better-sqlite3 dialect.
- `createLineItems` stays independently exported and callable — the pre-existing `LI-*` tests still
  call it directly, layered on top of a `placeOrder` call that (harmlessly) also creates line items
  and clears a cart for a separate, empty, throwaway session seeded just for that setup step.
