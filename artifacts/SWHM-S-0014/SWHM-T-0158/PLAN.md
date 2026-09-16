---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0158
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0157/PLAN.md,
  ]
---

# PLAN — SWHM-T-0158: Cart clearing after order placement

## Objective

Empty the shopper's cart once their order exists, and make the whole placement atomic so either all of it happened or none of it did.

## Steps

1. **Call `clearCartAfterOrder(sessionId)` from `cart/checkout.ts`.** Do not delete `cart_items` rows from `order/`. The clearing rule lives in the cart capability and stays there — that is why the previous sprint exported a named seam rather than leaving the caller to issue a delete (design.md § Codebase findings F3).
2. **Clear only after creation succeeds.** This is a hard constraint from `legacy-analysis/rebuild-guidance.md:98`, not a preference: a failed placement must leave the cart intact so the shopper can retry. § Decisions D4.
3. **Wrap the whole placement in one `db.transaction()`** — order insert, line item inserts, clear. `db.transaction()` is already the repository's write-transaction mechanism; `cart/cart.ts`'s `updateItems` and `admin/order-status.ts` are the precedents (§ Codebase findings F11). The idea's own risk note claimed only `catalog/transaction.ts`'s `readConsistent()` was available; that is wrong, and § Codebase findings F11 records why.
4. **There is no `cart.count` to set.** § Spec discrepancies S9: count is derived when a cart is read, so deleting the rows _is_ all three of the specification's steps — clear the items, set the count, write it back. The scenario's `cart.count = 0` is then observable exactly as written, with nothing assigned.
5. Do not rely on a foreign-key cascade from `sessions` or anywhere else. Foreign-key enforcement is off in this database and every `ON DELETE CASCADE` in the schema is declarative only — ARCHITECTURE.md § Data model states this outright, and it is the trap the previous sprint recorded.
6. Tests: `order/order.test.ts` — the cart reads empty after a successful placement; a failure partway leaves the cart exactly as it was with no order and no orphaned line item; and one session's placement does not touch another session's cart.

## Scope boundary

No empty-cart check — SWHM-T-0161 owns that and depends on this ticket. This ticket clears a cart that had items; refusing one that did not is the next one's.

## File/module ownership

Create or modify only: `order/order.ts`, `order/order.test.ts`.

Nothing else. `cart/checkout.ts` is complete as of SWHM-T-0157 — call it, do not edit it.

**Deviation recorded during implementation:** `placeOrder`'s cart-clearing needs the shopper's
`sessionId` (`cart_items` is keyed on session id, never username — `cart/cart.ts`), which
`placeOrder(userName, submission)`'s existing two-parameter signature had no way to receive. The
only caller is `routes/api/order/index.post.ts` (already resolving the full session via
`useSignOnSession`, but previously discarding everything but `j_signon_username`), so widening
`placeOrder` to a third `sessionId` parameter required a two-line change there — destructure the
session once and pass `session.id` through, alongside `userName`. No other caller exists, the
401/400 branches are untouched, and `SWHM-T-0161` (which depends on this ticket) already lists this
same route file in its own ownership, confirming the file is meant to keep accreting wiring across
this ticket sequence. See `summary.md` § Notes for the full reasoning.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-enter-order-information.html` carries the note that the shopper is told their cart is emptied on submit. That promise is what this ticket makes true.

## Definition of Done

AC-1 through AC-5 on the ticket. AC-3 is the one that actually needs a deliberate test: a passing happy path says nothing about whether the transaction is real.
