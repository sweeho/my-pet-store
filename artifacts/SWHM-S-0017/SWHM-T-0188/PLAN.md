# PLAN — SWHM-T-0188

**Task group:** `## 4. Inventory Verification & Reduction` (checkboxes 4.1–4.8)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirements:** Verify inventory availability for line items (ADDED); Deduct ordered quantities from inventory upon fulfillment (ADDED)

## Objective

One module that answers "can this line be filled?" and, when it can, takes the stock. **Read `design.md` first**, from `## Codebase findings` down — D2, D3 and S2 decide the two things this module could otherwise get wrong: it compares against the line's **full** quantity, and its atomicity comes from the caller's transaction, not from a descriptor.

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. No screen is built here. The mockup is relevant only as the reader of this module's data: the inventory screen shows the quantity this module decrements.

## Steps

1. **Write `fulfillment/inventory.ts`** with the three exports fixed below.
2. **`getInventoryQuantity` treats a missing row as 0** (D5, S14) — an item nobody has stocked is never fulfilled, and that is not an error.
3. **`checkInventory` compares held quantity against `line.quantity`, not against a remainder** (D3, S6). A line ships whole or not at all, so there is no partial-line arithmetic anywhere in this module.
4. **A successful check reduces; a failed one writes nothing.** This is the legacy `checkInventory` shape, where the check and the deduction are one call (`design.md § Fulfillment Processing`). Keep it, and say in a comment that the side effect is deliberate — a reader who expects a pure predicate is the failure this comment prevents.
5. **Do not open a transaction in this module.** `processOrder` (SWHM-T-0192) wraps the whole pass in one `db.transaction`, and a nested one buys nothing — `catalog/transaction.ts` records the same reasoning for a read. Atomicity is asserted here by showing that a reduction and its line's shipped-quantity write are never separately visible; the caller's test carries the composed case.
6. **Cover the boundary**: held == ordered (fills, leaves 0), held == ordered − 1 (refuses, leaves the figure untouched), and no row at all.

## Fixed interface contracts

```ts
export function getInventoryQuantity(itemid: string): number; // 0 when no row exists
export function checkInventory(line: FulfillmentLine): boolean; // true ⇒ stock already reduced
export function reduceQuantity(itemid: string, quantity: number): void;
```

`FulfillmentLine` comes from `fulfillment/types.ts` (SWHM-T-0187) and is not redefined.

## File / module ownership

Create or modify only:

- `fulfillment/inventory.ts` (new)
- `fulfillment/inventory.test.ts` (new)

Do not modify `fulfillment/types.ts`, `fulfillment/errors.ts`, `db/schema.ts`, or any other `fulfillment/` module — three sibling tickets are writing theirs in parallel.

## Definition of Done

- AC-1 … AC-4 hold, each evidenced by the assertion that carries it. AC-3's figures are the scenario's: 100 held, 30 ordered, 70 left.
- A refused check leaves the held quantity byte-identical to what it was.
- Nothing in this module reads or writes `orders`, `order_line_item` or any session.
