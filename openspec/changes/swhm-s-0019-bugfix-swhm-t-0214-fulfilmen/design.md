# Design — fulfil only approved purchase orders

## Measured context

Everything below was read or executed on this sprint branch (`vortex/sprint/swhm-s-0019-7bf1d6c1`,
forked from `2a94176`), not taken from the defect report.

- **F1 — the guard.** `fulfillment/status.ts:24-33`: `markOrderCompleted` returns `false` for `null`
  and `COMPLETED` and writes `COMPLETED` for everything else. `APPROVED` is never required.
- **F2 — the only call site.** `fulfillment/fulfillment.ts:60-62` calls `markOrderCompleted` when
  every line of the pass was available. Nothing before it reads the order's status;
  `readInvoiceOrder` (line 17) selects `order_id`, `user_name` and `order_date` only.
- **F3 — reproduced.** A throwaway integration test in the `server` project seeded orders directly
  and called the real functions. `markOrderCompleted` on `DENIED` → `COMPLETED`, returned `true`.
  On `PENDING` → `COMPLETED`. `processOrder` on a `DENIED` order holding 100 units of its item →
  line shipped, inventory 100 → 95, invoice returned, order `COMPLETED`. The test file was deleted
  after the run; its assertions are reproduced as scenarios in this change's delta.
- **F4 — a denied order is fulfilled, not merely mis-labelled.** F3's third result. This is the
  finding the report does not carry and the reason the gate goes at the top of the pass.
- **F5 — the approval side is correct.** `order/status.ts:14-18` refuses to re-decide an order that
  is already `APPROVED`, `DENIED` or `COMPLETED`; `order/decision.ts:25-36` applies a decision only
  through that guard. Nothing there needs to change.
- **F6 — the sibling convention.** `order/status.ts` expresses "which statuses may be acted on" as a
  small exported predicate (`isDecidable`) beside the status read, and its header says it was shaped
  after `fulfillment/status.ts` for the same job on the same table. The mirror image is available
  here.
- **F7 — tests pinning the bug.** `fulfillment/status.test.ts:46-53` (ST-03) asserts
  `PENDING → COMPLETED` succeeds. `fulfillment/fulfillment.test.ts` seeds `"PENDING"` at lines 89,
  103, 116, 136, 163 and 180, asserting `COMPLETED` at 96 and 151 and `PENDING` at 108, 125 and 199.
  `routes/api/fulfillment/process.post.test.ts:39` hardcodes `status: "PENDING"` in its own
  `seedOrder`, and asserts `COMPLETED` at 167 and `PENDING` at 100 and 178.
- **F8 — the browser journey is `PENDING`, and nothing below the browser says so.**
  `e2e/fulfillment.spec.ts:88-117` signs in as `jps_admin`, places an order through `POST /api/order`
  and expects the fulfilment run to return an invoice. `order/order.ts:65-72` resolves the placement
  locale from `profiles.preferred_language`; `db/client.ts:68-71` seeds `jps_admin` into `auth_users`
  alone; `account/customer.ts:40` is the only `insert(profiles)` in the product. So the locale is
  `null`, and `order/approval.ts:20-23` returns `PENDING` for a null locale whatever the amount.
- **F9 — the response shape has room for this already.** `FulfillmentResponse` is
  `{ orderId, invoice, status }` and `routes/api/fulfillment/process.post.ts:28-33` already answers
  a null invoice with the order's unchanged status for an out-of-stock order
  (`process.post.test.ts:173-179`). A non-approved order is the same answer with a different reason.

## Decisions

### D1 — The gate is a positive test for `APPROVED`, not a longer exclusion list

`markOrderCompleted` becomes "complete only from `APPROVED`" rather than "complete unless `null` or
`COMPLETED`". An exclusion list is wrong by default: it admits every status nobody thought of when
it was written, which is exactly how `DENIED` came to be completable — the list was correct on the
day it was authored and was not re-read when the statuses changed. A positive test is correct for
statuses that do not exist yet, and it keeps the existing answers for `null` and `COMPLETED` as
consequences rather than as clauses that have to be maintained.

### D2 — The pass refuses before it fulfils, not after

`processOrder` reads the status once, **after** `readInvoiceOrder` so an unknown id still raises
`OrderNotFoundError` and the route still answers 404, and returns `null` immediately when it is not
`APPROVED` — before any inventory check, any shipped-quantity write and any invoice. Guarding only
the completion step would still ship a denied order's goods and deduct its stock (F4), leaving a
state strictly worse than today's: an order reading `DENIED` whose items have left the warehouse.
The transaction wrapper is unchanged; the early return simply happens inside it.

### D3 — "Which statuses may be fulfilled" is written once

`fulfillment/status.ts` exports `isFulfillable(status: OrderStatus): boolean` — `status === "APPROVED"` —
and both `markOrderCompleted` and `processOrder` decide through it. Two call sites each carrying
their own copy of the rule is how they come to disagree, and the sibling module already demonstrates
the shape this codebase uses for it (F6). It stays in `status.ts` because that module owns the
status read; the pass keeps owning the "all lines available" judgement, as its header says.

### D4 — A refused run is an ordinary answer, not an error

A non-approved order is answered 200 with `{ orderId, invoice: null, status }` carrying its own
unchanged status. No new error class, no 409. The route's caller learns what happened from the
`status` field it already receives, and the alternative — a new error type — would add a branch to
the handler, a new failure vocabulary to the capability, and a distinction no caller in this product
acts on. This matches how an out-of-stock order is already reported (F9).

### D5 — Partial fulfilment leaves the status alone, whatever it is

The existing scenario says a partially fulfilled order "SHALL remain PENDING". That was accurate
before approval existed and is now wrong in its letter: a partially fulfilled order is `APPROVED`
and stays `APPROVED`. The modified scenario states it as the status being unchanged, so the
behaviour it pins — the pass writes no status unless every line went out — survives the next status
the workflow gains.

### D6 — The browser journey approves its own order

`e2e/fulfillment.spec.ts` gains a `POST /api/admin/orders/decisions` call with
`{ decisions: [{ orderId, status: "APPROVED" }] }` between placing the order and fulfilling it. This
is not test bookkeeping — it is the journey the product actually has, and the spec was passing only
because fulfilment ignored the gate (F8). `jps_admin` holds the administrator role, so the same
session that placed the order can approve it. The call is correct whether placement produced
`PENDING` or `APPROVED`: an already-approved order is reported as skipped and stays `APPROVED`
(F5). A second case in the same file denies an order and asserts the fulfilment run ships nothing —
the browser-tier oracle for the defect itself, and the tier where this is observed at all, since the
engineer container has no Chromium.

### Not promoted

D1–D6 shaped this change only, with one exception recorded in `ARCHITECTURE.md` § Key Decisions: a
capability that moves an order toward shipment reads the approval decision before acting. That one
binds work beyond this change — the next capability that ships, invoices or returns goods faces the
same question, and the failure mode is silent, since a fulfilment run over a denied order succeeds
at every step it performs.
