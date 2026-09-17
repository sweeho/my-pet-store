# SWHM-T-0207 — Supplier purchase order generation on approval

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 4 · Requirement: **Generate supplier purchase orders for approved orders**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D4, D6, D7 and § Spec discrepancies S2, S12 are what this ticket rests on.

## Objective

Approving an order writes a supplier purchase order carrying the order id, the PO date, the shipping address and every line item. It is two tables, not an XML document, and it is written where the fulfilment capability can read it rather than transmitted anywhere.

## Read S2 before writing anything

AC-3 says "the PO XML SHALL be sent to the supplier queue". There is no XML dependency and no broker in this repository, and none is introduced — `ARCHITECTURE.md § Key Decisions` settled that for every ported asynchronous capability one sprint ago. The criterion is met by the PO record existing, complete, where fulfilment reads it. Do not add an XML library, do not hand-roll a serializer, and do not add a queue.

## Design reference

The mockup's footnote states the user-visible half of this: "Approved orders generate a supplier purchase order". No new UI.

## Steps

1. Add `supplier_po` and `supplier_po_line_item` to `db/schema.ts`. `supplier_po` is keyed on `order_id` referencing `orders.orderId` — one PO per approved order, which is what makes a repeat approval unable to produce a second (D7). It holds `po_date` and the nine shipping fields the requirement enumerates, copied from the order's `shipping_*` columns. `supplier_po_line_item` is keyed on (`order_id`, `line_number`) and holds `catid`, `productid`, `itemid`, `quantity` and `unit_price`. Generate the migration into `drizzle/` and commit it.
2. Every field is **copied**, never joined back at read time (D4) — the same rule that makes an order carry its own address. A PO read a year later must still say where that order was shipped.
3. Write `order/supplier-po.ts` exporting `createSupplierPo(orderId, poDate)`. It reads the order and its lines, inserts the PO and its line rows, and returns the created record. It opens no transaction — the caller's covers it (D6).
4. Wire it into `order/decision.ts` at the extension point SWHM-T-0206 left: called only when the applied decision is `APPROVED`, never on a denial and never on a skip (tasks.md 4.7).
5. `catid` and `productid` are nullable on `order_line_item` (the demo seed sets neither). Carry the null through rather than inventing a value or refusing the line — the PO records what the order recorded.
6. Tests: `order/supplier-po.test.ts` asserts a PO row with the order id, date and full shipping address; a three-line order producing three line rows carrying all six fields; and that approving the same order twice leaves exactly one PO. Extend `order/decision.test.ts` to assert a denial writes no PO.

## File/module ownership

Create: `order/supplier-po.ts`, `order/supplier-po.test.ts`, one file under `drizzle/`.
Modify: `db/schema.ts` (the two new tables only — do not touch `orders`), `order/decision.ts`, `order/decision.test.ts`.

## Fixed interface contracts

```ts
export function createSupplierPo(orderId: number, poDate?: Date): SupplierPurchaseOrder;
```

`SupplierPurchaseOrder` and `SupplierPoLine` are `order/approval-types.ts`'s, written whole by SWHM-T-0204 — use them, do not extend that file. `poDate` defaults to the moment of the call so a test can fix it, the pattern `fulfillment/fulfillment.ts` uses for `shippingDate`.

## Definition of Done

AC-1, AC-2 and AC-3 — the third read as S2 describes it, and asserted as "the PO and its lines are persisted and readable", which is the observable the scenario is checking.
