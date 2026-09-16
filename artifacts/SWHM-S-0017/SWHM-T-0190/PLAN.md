# PLAN — SWHM-T-0190

**Task group:** `## 6. Order Status Tracking` (checkboxes 6.1–6.5)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirement:** Mark purchase orders as completed when all items are fulfilled (ADDED)

## Objective

The order's status transition, and only that. **Read `design.md` first**, from `## Codebase findings` down: 6.1, 6.2 and 6.5 describe things this repository already has (F3, F4; S3, S5) — the status column exists, checkout already creates an order as `PENDING`, and Java bean accessors are not a thing this codebase builds.

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. No screen is built here, and neither mockup shows an order status; the administrative orders screen that does render one already exists and is not touched.

## Steps

1. **Write `fulfillment/status.ts`** with the two exports fixed below. Nothing else goes in this file.
2. **Import `OrderStatus` from `admin/types.ts`** and do not redefine it. The vocabulary has four values here, not the two the spec names (F3, S4); `APPROVED` and `DENIED` belong to a later capability and this ticket neither reads nor writes them specially.
3. **`markOrderCompleted` refuses to move an order that is already `COMPLETED`** (6.4) and reports that nothing changed by returning `false`. A second fulfilment run over a finished order is an ordinary event (D3), not an error — do not throw.
4. **Do not decide _when_ to complete.** This module is told to complete an order; the "all lines available" judgement belongs to the pass (SWHM-T-0192). Keeping the decision out of here is what lets AC-2 be asserted directly: an order that is not told to complete stays `PENDING`, with no branch in this file.
5. **Do not open a transaction.** The pass wraps it (D2).
6. **Assert both directions and the no-op**: `PENDING` → `COMPLETED` returns `true`; a second call returns `false` and the row is unchanged; an unknown order id returns `false` rather than throwing.

## Fixed interface contracts

```ts
export function readOrderStatus(orderId: number): OrderStatus | null; // null when no such order
export function markOrderCompleted(orderId: number): boolean; // false ⇒ nothing changed
```

## File / module ownership

Create or modify only:

- `fulfillment/status.ts` (new)
- `fulfillment/status.test.ts` (new)

Do not modify `admin/types.ts`, `admin/order-status.ts`, `order/`, `db/schema.ts`, or any other `fulfillment/` module — three sibling tickets are writing theirs in parallel.

## Definition of Done

- AC-1 … AC-3 hold, each evidenced by the assertion that carries it.
- `ORDER_STATUSES` is imported, never re-declared, and no new status value is introduced.
- The module contains no rule about when an order should be completed.
