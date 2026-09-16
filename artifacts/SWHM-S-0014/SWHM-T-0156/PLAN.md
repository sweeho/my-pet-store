---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0156
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0154/PLAN.md,
    artifacts/SWHM-S-0014/SWHM-T-0155/PLAN.md,
  ]
---

# PLAN — SWHM-T-0156: Order creation

## Objective

Write the order row and connect it to the route, so a valid submission becomes a persisted order.

## Steps

1. **`order/order.ts`** exports the placement function. It takes the session's username and the validated submission, and returns what the route answers with. Leave the module easy to extend: SWHM-T-0157 and SWHM-T-0158 append to it, in that order, and each depends on this ticket.
2. **Use the existing column names.** `order_id`, `order_date`, `user_name`, `order_amount` — not `poId`, `poDate`, `customerId`, `totalPrice`. design.md § Spec discrepancies S11 explains why: four other modules read this table, and renaming to match a Java field name breaks them for nothing observable.
3. **The customer is the session's, never the body's.** Read the username from `useSignOnSession`, which the route has already resolved. A username supplied in the request body is ignored — an order placed on someone else's account is the failure this prevents.
4. **Status starts at `PENDING`.** `orders.status` is `notNull` and `PENDING` is already the first of four statuses in `admin/types.ts` (§ Codebase findings F8). No new vocabulary, no migration, and no acceptance criterion — § Spec discrepancies S10 records that the delta spec says nothing about status, so this is a column the schema requires rather than behaviour this change specifies.
5. **Both addresses are copied onto the order.** Not a reference to `addresses`, and no write back to the customer's account. This is ARCHITECTURE.md § Key Decisions, authored as design.md § Decisions D2: an order records what was agreed, so a customer who moves house does not retroactively change where an order was shipped. The form does not prefill from the account either (§ Decisions D6) — that is an open product question, not something to settle by writing code.
6. **The order date is the placement time.** § Spec discrepancies S14: the scenario's "September 8, 2026" is a date fixed when the specification was extracted. Test it against a controlled clock, never a literal date, or the suite starts failing the day after it is written.
7. **Wire the route's success path.** `routes/api/order/index.post.ts` returns `{ orderId, email }` — the fixed response shape `src/pages/order-completed.tsx` reads. The 401 and 400 branches SWHM-T-0154 built stay exactly as they are.
8. `order_amount` is written by SWHM-T-0157, which totals the line items. Leave it to that ticket rather than writing a zero this ticket's tests then assert.
9. Tests: `order/order.test.ts` for the row's fields, the session-not-body username, the copied addresses, `PENDING`, and the clock-controlled date; `routes/api/order/index.post.test.ts` for the success response shape alongside the existing 401/400 cases.

## Scope boundary

No line items and no cart clearing — SWHM-T-0157 and SWHM-T-0158 own those and depend on this. The transaction that wraps all three arrives with SWHM-T-0158; do not build a partial one here.

## File/module ownership

Create or modify only: `order/order.ts`, `order/order.test.ts`, `routes/api/order/index.post.ts`, `routes/api/order/index.post.test.ts`.

Nothing else. `order/types.ts`, `order/validation.ts` and `order/id.ts` are complete and imported, never edited.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-enter-order-information.html` is the source of the field set this ticket persists. No new surface.

## Definition of Done

AC-1 through AC-8 on the ticket. AC-8 fixes the response shape a later ticket's screen reads, so changing it later means changing two tickets' work.
