# SWHM-T-0214 — Fulfilment completes an order without requiring APPROVED

Change: `swhm-s-0019-bugfix-swhm-t-0214-fulfilmen`
Read `openspec/changes/swhm-s-0019-bugfix-swhm-t-0214-fulfilmen/design.md` first — it carries the
measured context and every decision this plan rests on, and is not repeated here.

## Objective

A fulfilment run acts only on an APPROVED order. A PENDING or DENIED order comes out of a run with
its status, its shipped quantities and its inventory exactly as they went in, and with no invoice.
An APPROVED, fully-stocked order still completes as it does today.

## Design reference

The idea behind this defect carries no design blocks — it is an idea-less defect raised from a
server-side finding, with no canvas and no mockup. Nothing in this ticket is user-visible: no page,
component or style changes, and the one JSON response shape involved is unchanged (design.md D4).

## Steps

1. **Predicate** (design.md D3). Export `isFulfillable(status: OrderStatus): boolean` from
   `fulfillment/status.ts`, returning true only for `"APPROVED"`. Place it beside `readOrderStatus`,
   mirroring `order/status.ts`'s `isDecidable`.
2. **Completion guard** (design.md D1). Rewrite `markOrderCompleted`'s guard as a positive test
   through `isFulfillable`: write `COMPLETED` only from `APPROVED`, return `false` otherwise. An
   unknown id (`readOrderStatus` → `null`) and an already-`COMPLETED` order both keep today's
   answer without being named as exceptions. Update the module comment above it, which currently
   explains the old exclusion list.
3. **Pass guard** (design.md D2). In `processOrder`, after `readInvoiceOrder(orderId)` — so an
   unknown id still raises `OrderNotFoundError` — read the status and `return null` when it is not
   fulfillable, before `readLineItems`, any `checkInventory`, any `markLineShipped` and any
   `createInvoice`. Leave the surrounding `db.transaction` as it is.
4. **Module tests.** `fulfillment/status.test.ts`: ST-03 seeds `APPROVED` (it currently seeds
   `PENDING` and asserts the bug, status.test.ts:46-53); add cases for `PENDING` and `DENIED`
   returning false and leaving the row untouched. ST-04, ST-05 and ST-06 keep their meaning — check
   ST-05's first call now needs an `APPROVED` seed.
5. **Pass tests.** `fulfillment/fulfillment.test.ts`: re-seed PT-02 … PT-07 as `APPROVED` (lines 89,
   103, 116, 136, 163, 180) and change the three "stays PENDING" expectations (108, 125, 199) to
   `APPROVED`. Add a case: a `DENIED` order holding stock ships no line, deducts no inventory,
   returns `null` and stays `DENIED`.
6. **Route tests.** `routes/api/fulfillment/process.post.test.ts`: its `seedOrder` hardcodes
   `status: "PENDING"` (line 39) — give it the status to seed, use `APPROVED` for the existing
   cases, and correct the expectations at lines 100, 167 and 178. Add a case: a `DENIED` order is
   answered 200 with `{ orderId, invoice: null, status: "DENIED" }` and nothing shipped.
7. **Browser journey** (design.md D6, and F8 for why this is not optional). In
   `e2e/fulfillment.spec.ts`, between the `POST /api/order` that places the order and the first
   `POST /api/fulfillment/process`, approve it:
   `page.request.post("/api/admin/orders/decisions", { data: { decisions: [{ orderId, status: "APPROVED" }] } })`.
   Without this the existing invoice assertion fails — the order `jps_admin` places is `PENDING`.
   Then add a second case that denies an order and asserts the run answers a null invoice, leaves it
   `DENIED`, and leaves the item's quantity as `/api/supplier/inventory` reported it beforehand.

## File / module ownership

Create or modify only these:

- `fulfillment/status.ts` — the predicate and the completion guard
- `fulfillment/fulfillment.ts` — the early return in `processOrder`
- `fulfillment/status.test.ts`, `fulfillment/fulfillment.test.ts` — module coverage
- `routes/api/fulfillment/process.post.test.ts` — route coverage
- `e2e/fulfillment.spec.ts` — the browser journey
- `openspec/changes/swhm-s-0019-bugfix-swhm-t-0214-fulfilmen/tasks.md` — tick your boxes only

Do not touch `order/` (its guard is correct, design.md F5), `db/schema.ts` or `drizzle/` (no schema
change), `routes/api/fulfillment/process.post.ts` (the handler needs no branch, D4), or
`db/client.ts` (the seeded administrator's missing profile row is recorded as a follow-up in
proposal.md, not fixed here).

## Fixed interface contracts

- `markOrderCompleted(orderId: number): boolean` — unchanged signature; `true` now means "was
  APPROVED and is now COMPLETED".
- `processOrder(orderId: number, shippingDate?: Date): string | null` — unchanged signature;
  `OrderNotFoundError` still raised for an unknown id.
- `isFulfillable(status: OrderStatus): boolean` — new export from `fulfillment/status.ts`, the only
  place the rule is written.
- `FulfillmentResponse` `{ orderId, invoice, status }` and the route's 200 / 400 / 404 / 500 answers
  — unchanged. No new error class, no new status code, no schema change, no migration.

## Definition of Done

- AC-1 … AC-7 on this ticket hold, each traceable to the scenario it was derived from in
  `openspec/changes/swhm-s-0019-bugfix-swhm-t-0214-fulfilmen/specs/fulfillment-management/spec.md`.
- The regression assertions named in steps 4–7 exist and are green at the module and route tiers.
- The browser tier is not runnable in the engineer container (no Chromium); the E2E edits are
  observed in CI on this branch. Do not install a browser — run the browser-free gate, say so, and
  read the verdict from CI.
- `tasks.md` section 2 and 3 boxes ticked.
