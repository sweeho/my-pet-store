---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0207
branch: vortex/feat/SWHM-T-0207-supplier-purchase-order-generation-on-ap-96464f5c
upstream: [artifacts/SWHM-S-0018/SWHM-T-0207/PLAN.md]
downstream: [artifacts/SWHM-S-0018/SWHM-T-0213]
---

# Summary — SWHM-T-0207: Supplier purchase order generation on approval

## What changed

Added `supplier_po` and `supplier_po_line_item` tables and `order/supplier-po.ts`'s
`createSupplierPo(orderId, poDate?)`, which copies the order's shipping address and every line item
into the new tables. Wired it into `order/decision.ts`'s existing extension point so an APPROVED
decision writes the PO and a DENIED or skipped decision does not. No XML, no queue (S2) — the record
existing where `fulfillment/` can read it is what satisfies "sent to the supplier queue".

## Files

- `db/schema.ts` — added `supplierPo` (keyed on `order_id`, one row per order — the primary key is what
  makes a repeat approval unable to write a second PO, D7) and `supplierPoLineItem` (keyed on
  `order_id, line_number`). Only these two tables added; `orders` untouched.
- `drizzle/0011_tiresome_jubilee.sql` + `drizzle/meta/*` — generated migration for both tables.
- `order/supplier-po.ts` — new. `createSupplierPo` reads the order's shipping columns and its line
  items, inserts the PO row and its line rows, and returns the `SupplierPurchaseOrder` record. Opens
  no transaction — the caller's covers it.
- `order/supplier-po.test.ts` — new. A PO row with full shipping address; a three-line order producing
  three line rows including a null catid/productid line; the S2 persisted-and-readable assertion; and
  that a second call for the same order throws (the schema's primary key, not application logic,
  enforces D7).
- `order/decision.ts` — `applyDecision` calls `createSupplierPo(orderId)` at the existing extension
  point, gated on `decision === "APPROVED"`.
- `order/decision.test.ts` — added `DA-09` (approval writes a PO) and `DA-10` (denial writes none).

## AC coverage

- AC-1 (PO generated with order ID, date, shipping address) — `supplier-po.test.ts › AC-1`.
- AC-2 (PO includes all line items with catid/productid/itemid/lineNumber/quantity/unitPrice) —
  `supplier-po.test.ts › AC-2`.
- AC-3 (PO "sent to the supplier queue" — read per S2 as the record existing where fulfilment reads
  it) — `supplier-po.test.ts › AC-3`.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  116 passed (116)
     Tests  759 passed (759)
```

`bun run verify:full` was attempted first; its browser tier fails at the documented preflight
(Chromium not installed in this container — `AGENTS.md § Notes from previous agents`), so `verify`
stands in per that note. E2E is not part of this ticket's scope (no UI change) and runs again in CI
and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 759 passed, 0 failed`.

## Notes

`SupplierPurchaseOrder.shippingAddress` is `OrderAddress` (10 fields: 4 `ContactInfo` + 6 `Address`,
including `streetName2`), so `supplier_po` carries all 10 `shipping_*` columns rather than the 9 the
delta spec's prose lists — the prose's "street" collapses `streetName1`/`streetName2` into one concept,
but the fixed interface contract requires the full `OrderAddress` shape to round-trip on read. Not a
deviation: the fixed contract in `PLAN.md` wins over the prose count.

`createSupplierPo` reads the order row with a non-null assertion rather than a `notFound` branch —
`applyDecision` only reaches it after `readOrderDecidability` has already confirmed the order exists,
so there is no reachable case to handle.
