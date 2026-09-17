# SWHM-T-0206 — Order approval and denial workflow: the single-order applier

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 3 · Requirement: **Transition order status through approval workflow**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D3, D6, D7 and § Spec discrepancies S6, S7 are what this ticket rests on.

## Objective

One function that takes an order id and a decision, refuses it if the order is not decidable, and otherwise moves the order to `APPROVED` or `DENIED`. It is the seam the supplier PO (SWHM-T-0207) and the notification (SWHM-T-0213) are hung off, and the unit the batch layer (SWHM-T-0212) iterates.

## Design reference

No UI. The mockup's footnote — "Approved orders generate a supplier purchase order; both approvals and denials notify the customer" — describes what this seam will carry once the two later tickets extend it.

## Steps

1. Write `order/decision.ts` exporting `applyDecision(orderId, decision)`. Call `readOrderDecidability` from `order/status.ts` first; return `{ result: "notFound" }` for a missing order, `{ result: "skipped", status }` for a terminal one, and otherwise write the new status and return `{ result: "applied", status }` (D3).
2. **Open no transaction here.** `applyDecision` is called inside the caller's transaction, exactly as `fulfillment/status.ts` is called inside the fulfilment pass. SWHM-T-0212 wraps a whole batch in one (D6).
3. Leave a clearly marked extension point after the status write where SWHM-T-0207 inserts the supplier PO call (approved only) and SWHM-T-0213 inserts the notification call (both outcomes). Those two tickets modify this file; they run after this one in the chain, so there is no concurrent edit.
4. There is no `OrderApproval` transfer object and no XML (S7). The decision is the plain `ApprovalDecision` value from `order/approval-types.ts`.
5. Write nothing to `admin/order-status.ts` — the existing `updateOrderStatus` stays exactly as it is. Two endpoints write `orders.status` and only the approval path is guarded; that tension is recorded as S11 and is deliberately not resolved here.
6. Tests: `order/decision.test.ts` asserts a `PENDING` order moves to `APPROVED`, a `PENDING` order moves to `DENIED`, the row in the database actually carries the new status afterwards, and each terminal state is returned as a skip with the order's status unchanged.

## File/module ownership

Create: `order/decision.ts`, `order/decision.test.ts`.
Modify: nothing.

`order/decision.ts` is later modified by SWHM-T-0207 and SWHM-T-0213, in that order, each behind a dependency edge.

## Fixed interface contracts

```ts
export function applyDecision(orderId: number, decision: ApprovalDecision): DecisionOutcome;
```

`DecisionOutcome` is `order/approval-types.ts`'s, unchanged. The three-way return is the contract SWHM-T-0212 aggregates and SWHM-T-0211 serializes.

## Definition of Done

AC-1 and AC-2, each observable in `order/decision.test.ts` by reading the order row back after the call.
