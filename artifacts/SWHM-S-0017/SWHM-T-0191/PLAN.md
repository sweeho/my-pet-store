# PLAN — SWHM-T-0191

**Task group:** `## 7. Line Item Shipment Tracking` (checkboxes 7.1–7.5)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirements:** Update line item shipped quantities during fulfillment (ADDED); Skip already-shipped line items during processing (ADDED)

## Objective

Read an order's lines, say which have already shipped, and record a shipment against one. **Read `design.md` first**, from `## Codebase findings` down. Two entries decide this ticket: the column already exists and already defaults to 0 (F1, F4; 7.1 and 7.2 are satisfied by confirming that, not by a migration), and S6 explains why the skip rule is equality even though a scenario is titled "partially shipped".

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. No screen is built here and neither mockup shows a line item.

## Steps

1. **Write `fulfillment/line-items.ts`** with the three exports fixed below.
2. **`readLineItems` returns the order's lines in `line_number` order.** Order matters: the pass walks them and the invoice lists them, and an unordered read makes both non-deterministic across runs.
3. **`isAlreadyShipped` is `quantityShipped === quantity`** — nothing else (S6). A line is either untouched or fully shipped; no state in between can arise, because `markLineShipped` only ever writes the full quantity (D3). Say that in a comment, because the scenario title "Partially shipped items are skipped" reads as if a third state exists.
4. **`markLineShipped` sets `quantity_shipped = quantity`** for one (`order_id`, `line_number`) pair — the composite key is the whole `where` clause (F1). It never accepts an arbitrary quantity: a signature that takes one invites a caller to invent a partial shipment the rest of the capability cannot represent.
5. **Do not open a transaction** (D2), and do not touch inventory — a sibling ticket owns that.
6. **Assert the skip rule against both scenario shapes** (`quantity=50, quantityShipped=50` in each) and the write against `quantity=50, quantityShipped=0` → 50.

## Fixed interface contracts

```ts
export function readLineItems(orderId: number): FulfillmentLine[]; // ordered by lineNumber
export function isAlreadyShipped(line: FulfillmentLine): boolean; // quantityShipped === quantity
export function markLineShipped(line: FulfillmentLine): void; // writes quantityShipped = quantity
```

`FulfillmentLine` comes from `fulfillment/types.ts` (SWHM-T-0187).

## File / module ownership

Create or modify only:

- `fulfillment/line-items.ts` (new)
- `fulfillment/line-items.test.ts` (new)

Do not modify `db/schema.ts`, `order/`, or any other `fulfillment/` module — three sibling tickets are writing theirs in parallel.

## Definition of Done

- AC-1 … AC-4 hold, each evidenced by the assertion that carries it. AC-1's figure is the scenario's 50.
- A line the module reports as already shipped is never written to by it.
- No migration, no schema change, and no new column.
