# PLAN — SWHM-T-0192

**Task group:** `## 3. Order Fulfillment Processing` (checkboxes 3.1–3.8)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirement:** Return serialized invoice to order processing after fulfillment (ADDED)

## Objective

The fulfilment pass: walk an order's lines, skip what has shipped, ship what stock allows, complete the order when everything has gone out, and return the invoice or null. This ticket **composes** the four modules its dependencies built and adds no rule they already own. **Read `design.md` first**, from `## Codebase findings` down — D2 and D3 are this ticket's entire shape, and the flowchart in the idea's § Solution is the same algorithm drawn out.

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. No screen is built here. The supplier-home mockup's "What this module does" list is a plain-English statement of this function's behaviour and is worth reading as a second description of it.

## Steps

1. **Write `fulfillment/fulfillment.ts`** with the one public export fixed below.
2. **Wrap the whole pass in one `db.transaction`** (D2, S2, S13). Every deduction, every shipped-quantity write and the status transition commit together or not at all. This is what makes AC-3 true and what the "atomic and durable" scenario observes.
3. **Read the order first**; throw `OrderNotFoundError` (from `fulfillment/errors.ts`) when there is none. Keep the read private to this module — it needs `user_name` and `order_date` for the invoice, which no sibling module exposes.
4. **Walk the lines in order**, using `readLineItems` and `isAlreadyShipped`. Track `allItemsAvailable`, initialised `true` before the loop (3.3). A line that is already shipped is skipped **without** an inventory check (S6) and does **not** make the order unavailable — it is done, not missing.
5. **For each unshipped line, call `checkInventory`.** On `true`, call `markLineShipped` and collect the line for the invoice. On `false`, leave the line alone and set `allItemsAvailable` to `false`.
6. **Complete the order only when `allItemsAvailable`** — call `markOrderCompleted`. Otherwise write nothing to the status; AC-2 of SWHM-T-0190 is the case where it stays `PENDING`.
7. **Build the invoice only when at least one line was fulfilled** in this run; return `null` otherwise (the scenario is explicit that null, not an empty invoice, is the answer). Pass the shipping date in — default the parameter to `new Date()` at the call site of the route, not inside the pass, so a test can fix it.
8. **Assert idempotence directly** (AC-3, S11): run twice over an order that cannot be fully filled, restock between runs, and show the second run ships only what was outstanding and the first run's lines are not deducted again.

## Fixed interface contracts

```ts
export function processOrder(orderId: number, shippingDate?: Date): string | null;
```

Returns the invoice XML when this run fulfilled at least one line, `null` when it fulfilled none. Throws `OrderNotFoundError` for an unknown order id. Consumed by `routes/api/fulfillment/process.post.ts` (SWHM-T-0193).

## File / module ownership

Create or modify only:

- `fulfillment/fulfillment.ts` (new)
- `fulfillment/fulfillment.test.ts` (new)

Do not modify `fulfillment/inventory.ts`, `fulfillment/invoice.ts`, `fulfillment/status.ts`, `fulfillment/line-items.ts`, `fulfillment/types.ts` or `fulfillment/errors.ts` — they are fixed contracts from this ticket's four dependencies. If one of them is wrong, say so on the ticket rather than editing around it.

## Definition of Done

- AC-1 … AC-3 hold, each evidenced by the assertion that carries it.
- A pass that throws partway leaves the order with no deduction, no shipped quantity and no status change — asserted, not assumed.
- No rule owned by a dependency is re-implemented here: this file contains no comparison of a held quantity, no status string and no XML.
