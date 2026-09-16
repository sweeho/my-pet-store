# PLAN — SWHM-T-0195

**Task group:** `## 8. Inventory Management UI` (checkboxes 8.1–8.8)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirement:** Inventory update screen displays items with quantities and update options (ADDED)

## Objective

The screen at `/supplier/inventory` and the two endpoints behind it: every catalogue item with the quantity held, a new quantity per row, a tick per row, and one control that writes the ticked rows together. **Read `design.md` first**, from `## Codebase findings` down — S8 (no JSP, no `RcvrRequestProcessor`), S9 (the administrator role exists and is enforced in three places) and D9 (only ticked rows are written).

## Design reference

`artifacts/SWHM-S-0017/design/` — `mockup-inventory-update.html` is the authority. It fixes the four columns in order — **Item ID · Existing quantity · New quantity · Update** — a text input and a checkbox per row, the hint "Only ticked rows are updated…" and the **Update Inventory** control, both **outside** the table. `wireframe-inventory-update.html` adds the route and the loading state: heading kept, list replaced by a `role="status"` region reading "Loading inventory…".

`DESIGN.md § Tabular data` now carries the editable-table rules this screen is the first to follow. Read it: every control in a row carries an accessible name that names **that row's** item id, selection and editing are separate controls, and the submit control sits outside the table.

## Steps

1. **Write `fulfillment/inventory-admin.ts`** with the two exports fixed below. `listInventory` returns **every** item in the catalogue, ordered by item id, with 0 for an item that has no inventory row (D5) — a left join, not a read of `inventory` alone, or a never-stocked item is invisible on the screen that exists to stock it.
2. **`applyInventoryUpdates` writes inside one `db.transaction` and reports unknown item ids** rather than dropping them, following `admin/order-status.ts`'s established `{ updated, notFound }` shape (F6). A quantity that is negative or not an integer is refused with `InvalidInventoryUpdateError`.
3. **Write the two routes** — `routes/api/supplier/inventory/index.get.ts` and `index.post.ts` — each calling `requireAdmin` from `admin/request.ts` first, as every `/api/admin` route already does. Reuse it; do not write a second role check (F5).
4. **Write `src/pages/supplier/inventory.tsx`**, wrapped in `RequireAdmin`, inside `AdminShell`, using the `Table` primitives. There is no input or checkbox primitive and none is added (F8): use native inputs with the shared class string `src/pages/customer.tsx` uses.
5. **Give every row control an accessible name containing the item id** — "New quantity for BIRDS-PARROTS-1", "Update BIRDS-PARROTS-1". A column header does not name a control inside a cell, so without this every row's input is announced identically and no test can tell them apart (`DESIGN.md § Tabular data`).
6. **Submit only the ticked rows** (D9, AC-5). A typed value in an unticked row is not sent. After a successful write, re-read the list so the Existing quantity column shows what was actually stored rather than what was typed.
7. **Report the outcome as the design system requires**: the in-flight state per `DESIGN.md § Pending actions`, a refusal per `§ Form validation states` at the form. The loading state is the wireframe's `role="status"` region.
8. **Tests**: `fulfillment/inventory-admin.test.ts` and both route tests in the `server` project; `src/pages/supplier/inventory.test.tsx` in `client`. Cover the never-stocked item, the unticked row, and an unknown item id.

## Fixed interface contracts

```ts
export function listInventory(): InventoryRow[]; // every catalogue item, ordered by itemid, 0 when unstocked
export function applyInventoryUpdates(updates: InventoryUpdate[]): InventoryUpdateResult;
```

`GET /api/supplier/inventory` → `{ items: InventoryRow[] }`.
`POST /api/supplier/inventory` — request `{ updates: InventoryUpdate[] }`, response `InventoryUpdateResult` (`{ updated: string[], notFound: string[] }`). Types from `fulfillment/types.ts` (SWHM-T-0187).

## File / module ownership

Create or modify only:

- `fulfillment/inventory-admin.ts` (new) + `fulfillment/inventory-admin.test.ts`
- `routes/api/supplier/inventory/index.get.ts`, `index.post.ts` (new) + their `*.test.ts`
- `src/pages/supplier/inventory.tsx` (new) + `src/pages/supplier/inventory.test.tsx`

Do not modify `fulfillment/inventory.ts` (the fulfilment pass's module — a different concern with a different caller), `admin/request.ts`, `auth/protected-resources.ts` (SWHM-T-0193 registered `/supplier` and `/api/supplier`), `src/components/`, `src/pages/supplier/index.tsx` (SWHM-T-0194's) or `src/index.css`.

## Definition of Done

- AC-1 … AC-5 hold, each evidenced by the assertion that carries it. AC-3 is met in this product's terms, per S8: the form submits the selected rows to `POST /api/supplier/inventory`, the endpoint that updates inventory. Record that on the ticket; do not build a `RcvrRequestProcessor` path.
- A never-stocked catalogue item appears on the screen showing 0 and can be given a quantity.
- No new shared component, no new design token, and no second role check.
