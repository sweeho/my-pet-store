# SWHM-T-0205 — Status validation guard: only PENDING orders are decidable

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 2 · Requirement: **Accept only pending orders for approval or denial**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D3, D7 and § Spec discrepancies S6, S8, S11 are what this ticket rests on.

## Objective

A decision arriving for an order that is already `APPROVED`, `DENIED` or `COMPLETED` is skipped and reported as skipped. Only `PENDING` is decidable. This ticket is the predicate and the status read; SWHM-T-0206 is the thing that calls them.

## Design reference

No UI. `artifacts/SWHM-S-0018/design/mockup-orders-approval.html` is the screen that consumes the skip reporting this ticket produces — the selection summary line is where a skipped order eventually surfaces to a reader.

## Steps

1. Write `order/status.ts` exporting `TERMINAL_STATUSES` (`APPROVED`, `DENIED`, `COMPLETED`), `isDecidable(status)`, and `readOrderDecidability(orderId)`. The last returns the current status and whether it may be decided, or `null` when no such order exists — an unknown id and a terminal one are different answers and the caller reports them differently (D3).
2. Do not open a transaction here. The caller wraps, which is the shape `fulfillment/status.ts` already uses for the same job on the same table — mirror that file.
3. Import `OrderStatus` from `admin/types.ts` and the shared types from `order/approval-types.ts`. Do not redefine the status vocabulary and do not add to `order/approval-types.ts` (D10).
4. There is **no logging** (S8). A skip is made observable by being returned, not by being written to a log the product has no facility for. Do not add a logging dependency and do not `console.log`.
5. `order/status.ts` is a new file: check it does not collide with `fulfillment/status.ts`, which stays as it is. This ticket does not change fulfilment's completion transition — the fact that it moves a non-`APPROVED` order to `COMPLETED` is recorded as S10 and raised separately.
6. Tests: `order/status.test.ts` covers all four scenarios — one `PENDING` order reported decidable, and one order in each of the three terminal states reported skipped with its current status carried back — plus the unknown-id case.

## File/module ownership

Create: `order/status.ts`, `order/status.test.ts`.
Modify: nothing.

## Fixed interface contracts

```ts
export const TERMINAL_STATUSES: readonly OrderStatus[]; // APPROVED, DENIED, COMPLETED
export function isDecidable(status: OrderStatus): boolean;
export function readOrderDecidability(
  orderId: number,
): { status: OrderStatus; decidable: boolean } | null;
```

SWHM-T-0206 calls `readOrderDecidability` and maps its three answers onto `DecisionOutcome`.

## Definition of Done

AC-1 through AC-4, each observable in `order/status.test.ts` against a real order row in each state.
