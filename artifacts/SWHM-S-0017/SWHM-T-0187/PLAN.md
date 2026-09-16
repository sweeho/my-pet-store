# PLAN — SWHM-T-0187

**Task group:** `## 1. Data Model & Entities` (checkboxes 1.1–1.6)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirements:** none directly — this ticket is the foundation the other nine build on.

## Objective

Add the one table this capability needs, create the `fulfillment/` module with the two files every later ticket imports, register the directory in all three lists, seed development stock, and prove the order and line-item shape the group's other five checkboxes ask you to "implement" already exists.

**Read `design.md` first**, from `## Codebase findings` down. It records that 1.1, 1.2, 1.4, 1.6 describe tables this repository already has (F1, F3, F4; S3) and that only `inventory` is new (F2).

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. No screen is built here. The inventory mockup matters only for the shape this ticket's table has to support: one quantity per item id, listed for **every** catalogue item including ones never stocked (D5).

## Steps

1. **Add `inventory` to `db/schema.ts`** — `itemid` text primary key referencing `item.itemid`, `quantity` integer NOT NULL. No reservation column, no history, no surrogate id (§ Decisions D5; `ARCHITECTURE.md § Data model`). Follow the file's existing commenting habit: say why there is no ledger.
2. **Generate the migration into `drizzle/` and commit it.** A schema change is not complete without it (`ARCHITECTURE.md § Data model`).
3. **Write `fulfillment/types.ts` whole** (D6 — no later ticket in this sprint extends it). The shapes below are fixed; four tickets code against them in parallel.
4. **Write `fulfillment/errors.ts` whole** (D6). Four error classes, each setting its own `name`: `InvalidFulfillmentMessageError`, `OrderNotFoundError`, `InvoiceGenerationError` (the `XMLDocumentException` counterpart, S7), `InvalidInventoryUpdateError`. No behaviour beyond a message.
5. **Register `fulfillment/` in all three lists** (F10): `vitest.config.ts` — `fulfillment/**/*.test.ts` into the `server` project's `include` and `fulfillment/**` into the `client` project's `exclude`; `tsconfig.node.json` — `fulfillment` into `include`. Registering in one and not the others is the documented failure mode, and it fails only on a test that reaches the database driver.
6. **Seed development stock.** `fulfillment/seed.ts` exporting `seedInventory(): void`, called from `db/client.ts` behind the same `!process.env.VITEST` guard and the same emptiness check the catalogue seed uses (F14). Give every seeded catalogue item the same starting quantity — the figure is demo data, not a product decision. Under Vitest the table stays empty so no assertion is ever checked against stock it did not create (S14).
7. **Assert the inherited shape rather than redefining it** (S3). One test that places or inserts an order and shows it is `PENDING` with every line at `quantity_shipped` 0, and that a missing `inventory` row reads as 0. Do not touch `orders`, `order_line_item` or `ORDER_STATUSES`.

## Fixed interface contracts

`fulfillment/types.ts`, written whole by this ticket and imported by every later one:

```ts
import type { OrderStatus } from "../admin/types";

export type FulfillmentLine = {
  orderId: number;
  lineNumber: number;
  itemid: string;
  catid: string | null;
  productid: string | null;
  quantity: number;
  quantityShipped: number;
  unitPrice: number;
};

export type InvoiceOrder = { orderId: number; userName: string; orderDate: Date };

export type InventoryRow = { itemid: string; quantity: number };
export type InventoryUpdate = { itemid: string; quantity: number };
export type InventoryUpdateResult = { updated: string[]; notFound: string[] };

export type FulfillmentRequest = { orderId: number };
export type FulfillmentResponse = { orderId: number; invoice: string | null; status: OrderStatus };
```

`OrderStatus` is imported from `admin/types.ts` and never redefined (S4).

## File / module ownership

Create or modify only:

- `db/schema.ts` — add `inventory` and nothing else
- `drizzle/` — the generated migration + its `meta` update
- `fulfillment/types.ts`, `fulfillment/errors.ts`, `fulfillment/seed.ts` (all new) + their `*.test.ts`
- `db/client.ts` — the `seedInventory()` call, guarded
- `vitest.config.ts`, `tsconfig.node.json` — the three registrations

Do not modify `orders`, `order_line_item`, `admin/types.ts`, `order/`, `catalog/seed.ts` or any route.

## Definition of Done

- AC-1 … AC-5 hold, each evidenced by the assertion that carries it.
- `fulfillment/` resolves from the `server` Vitest project and from `tsconfig.node.json`, and is excluded from the `client` project.
- No existing table or column is redefined, and no existing test changes behaviour.
