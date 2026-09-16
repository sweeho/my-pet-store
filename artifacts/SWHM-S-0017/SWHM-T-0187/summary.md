---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0017
ticket: SWHM-T-0187
branch: vortex/feat/SWHM-T-0187-inventory-table-fulfilment-module-and-it-584f9159
upstream: [artifacts/SWHM-S-0017/SWHM-T-0187/PLAN.md]
downstream: [artifacts/SWHM-S-0017/qa-test-report.md]
---

# Summary — SWHM-T-0187: Inventory table, fulfilment module and its registrations

## What changed

Added the `inventory` table (itemid → quantity, no ledger) with its committed migration, created
`fulfillment/` with `types.ts` and `errors.ts` written whole per the fixed interface contracts,
registered the directory across Vitest's two projects and `tsconfig.node.json`, and wired a guarded
development seed. No screen or route is built here — PLAN.md § Design reference states none is in
scope for this ticket.

## Files

- `db/schema.ts` — added `inventory` (itemid pk → `item.itemid`, quantity not null).
- `drizzle/0009_steady_microchip.sql` + `drizzle/meta/{_journal.json,0009_snapshot.json}` — generated migration for the table above.
- `fulfillment/types.ts` — the fixed interface contracts (`FulfillmentLine`, `InvoiceOrder`, `InventoryRow`, `InventoryUpdate`, `InventoryUpdateResult`, `FulfillmentRequest`, `FulfillmentResponse`), importing `OrderStatus` from `admin/types.ts` rather than redefining it.
- `fulfillment/errors.ts` — `InvalidFulfillmentMessageError`, `OrderNotFoundError`, `InvoiceGenerationError`, `InvalidInventoryUpdateError`.
- `fulfillment/seed.ts` — `seedInventory()`, giving every row currently in `item` the same starting quantity.
- `fulfillment/errors.test.ts`, `fulfillment/seed.test.ts` — new tests (see `tdd-test-result.md`).
- `db/client.ts` — calls `seedInventory()` behind the same `!process.env.VITEST` guard and emptiness check the catalogue seed uses, after the catalogue seed (FK ordering).
- `vitest.config.ts` — added `fulfillment/**` to the `client` project's `exclude` and `fulfillment/**/*.test.ts` to the `server` project's `include`.
- `tsconfig.node.json` — added `fulfillment` to `include`.

## AC coverage

- AC-1 (a row holds a quantity against an item id; migration committed) — `db/schema.ts`'s `inventory` table, `drizzle/0009_steady_microchip.sql`; `fulfillment/seed.test.ts › FT-04`.
- AC-2 (a missing row reads as 0, not an error or null) — no code branch needed, since nothing in this ticket queries `inventory` on the read side; proved directly at the query level by `fulfillment/seed.test.ts › FT-05`.
- AC-3 (fulfillment tests run only in the `server` project) — the three registrations above; proved at runtime by `fulfillment/seed.test.ts › FT-01` (`window` is undefined under `server`'s node environment) and by the full `bun run test` run collecting both new files under `|server|`.
- AC-4 (dev db seeds non-zero stock per catalogue item; Vitest db seeds none) — `fulfillment/seed.ts`'s `seedInventory()` plus the guard in `db/client.ts`; `fulfillment/seed.test.ts › FT-02` (empty under Vitest) and `› FT-03` (non-zero after a direct call).
- AC-5 (an order is `PENDING` with lines at `quantity_shipped` 0, asserted against the existing tables, nothing redefined) — no schema change to `orders`/`order_line_item`; `fulfillment/seed.test.ts › FT-06`.

## Verification

```
$ bun --bun vitest run fulfillment/
 Test Files  2 passed (2)
      Tests  11 passed (11)

$ bun run verify
✓ lint  ✓ typecheck
 Test Files  100 passed (100)
      Tests  630 passed (630)
```

`bun run verify:full` also ran; its `test:e2e` step fails at the preflight because this implementation
container has no Chromium installed (`AGENTS.md` § Notes from previous agents records the same for
six prior tickets in this sprint) — not retried, per that note. Full detail and the red→green proof
are in `tdd-test-result.md`.

## Notes

Group 1's other five checkboxes (1.1, 1.2, 1.4, 1.6, and the status/line-item relationships) describe
entities the repository already has (`design.md` F1, F3, F4, § Spec discrepancies S3) — confirmed by
`fulfillment/seed.test.ts › FT-06` rather than redefined. No file outside this ticket's ownership list
was touched.
