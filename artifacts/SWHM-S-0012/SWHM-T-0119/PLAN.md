# SWHM-T-0119 — Batch order status update

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 6. Order Status Updates` (6.1–6.7)
**Requirement:** Update order status in batch

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **S5 and D5 govern this ticket.** Both of its acceptance criteria name an
> `AsyncSender` EJB and a message queue; there is neither. Read S5 before you write anything.

## Objective

Move several orders to a new status in one operation, atomically. After this ticket
`POST /api/admin/orders/status` accepts a list of order ids and a status, and either all of them move
or none does.

## Steps

1. **`admin/order-status.ts`** — `updateOrderStatus(orderIds, newStatus)`. The whole batch runs inside
   one `db.transaction`. `catalog/transaction.ts` is the precedent and its own comment already records
   why the legacy EJB framing does not survive an embedded single-connection database: there is no
   concurrent writer to isolate from and no queue to hand work to, so what a transaction buys is the
   property the scenario actually cares about — every order moves or none does. Follow that module's
   shape; do not import `readConsistent` itself, which is named for a read.
2. **Report per-order outcomes** (D5). Unknown order ids must not vanish: the result names which ids
   moved and which were not found. A batch where every id is unknown is still a success with an empty
   `updated` list — nothing failed, nothing matched — and the caller can tell the difference. Silently
   returning "SUCCESS" for a request that changed nothing is the failure mode this exists to prevent.
3. **Validate the target status** against `ORDER_STATUSES` from `admin/types.ts` (SWHM-T-0118). An
   unknown status is a 400 before the transaction opens, not a row-level failure inside it.
4. **`POST /api/admin/orders/status`** at `routes/api/admin/orders/status.post.ts`. `requireAdmin`
   first, return its error as-is. Read the body with `readBody`, as `routes/api/signon/index.post.ts`
   does. Reject a missing or empty `orderIds`, a non-array, and a non-numeric id with 400 and
   `{ error }`. JSON in, JSON out — no `UPDATESTATUS` discriminator, no `OrderApproval` document (S4).
5. **Approve and deny are not special.** This route moves an order to any valid status. The approval
   _workflow_ — thresholds, supplier purchase orders, the approve/deny panel — belongs to
   `swhm-i-0011` and is out of scope here; do not add rules about which transitions are permitted.
6. **Tests.** `admin/order-status.test.ts`: several orders move together; a mix of known and unknown ids
   reports both lists and still moves the known ones; the transaction rolls back as a unit when the
   write fails partway, leaving every order at its original status. That last one is the reason the
   transaction is here — assert it against the database, not against a mock.
   `routes/api/admin/orders/status.post.test.ts`: the 401 and 403 from the guard, 400 for an unknown
   status, 400 for a malformed body, and the response shape on success.

## Fixed interface contracts

```ts
// admin/order-status.ts
export type StatusUpdateResult = {
  updated: number[];   // order ids that moved
  notFound: number[];  // order ids that matched no row
};

export function updateOrderStatus(
  orderIds: number[],
  newStatus: OrderStatus,
): StatusUpdateResult;
```

`POST /api/admin/orders/status` with `{ orderIds: number[], status: OrderStatus }` →
`StatusUpdateResult`, or `{ error: string }` with 400/401/403.

## File/module ownership

Create or modify only: `admin/order-status.ts`, `admin/order-status.test.ts`,
`routes/api/admin/orders/status.post.ts`, `routes/api/admin/orders/status.post.test.ts`.

Nothing else. `db/schema.ts` and `admin/orders.ts` are SWHM-T-0118's and are already landed —
read them, do not edit them.

## Definition of Done

AC-1 and AC-2 on the ticket, read against S5:

- AC-1 asserts an `UPDATESTATUS` request delegated to `AsyncSender`. The observable outcome that
  replaces it: posting several order ids and a new status moves every one of those orders to that
  status in one request.
- AC-2 asserts an `OrderApproval` XML sent via the `AsyncSender` EJB. The observable outcome that
  replaces it: the batch is atomic — a failure partway leaves every order in the batch at its original
  status, with none partially applied.

## Gotchas

- `readConsistent` in `catalog/transaction.ts` is named for a read and takes no argument. Follow its
  shape; do not reuse it for a write.
- A batch that matches nothing is not an error. Returning 404 for it makes the caller unable to
  distinguish "no such orders" from "the endpoint is wrong".
- Asserting rollback against a mocked database asserts the mock. Use the in-memory database Vitest
  already swaps in.
