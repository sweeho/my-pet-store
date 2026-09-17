# SWHM-T-0211 — Batch decision entry point: the endpoint that replaces the approval queue

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 8 · Requirements: **Orders Approval screen displays pending orders with editable status**, **Accept only pending orders for approval or denial**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D6, D7 and § Spec discrepancies S1, S7, S8, S11 are what this ticket rests on.

## Objective

`POST /api/admin/orders/decisions` — the HTTP entry point the Commit control writes to. It is `OrderApprovalMDB.onMessage()` with the transport removed.

## Read S1 before writing anything

`tasks.md` group 8 is JMS end to end: a message-driven bean, a `Required` transaction attribute, a queue message selector, `onMessage()`, and message parsing. There is no broker in this repository and none is introduced. The bean is a route handler, the message is the request body, the selector is body validation, and the transaction attribute is the `db.transaction` SWHM-T-0212 already opens. Do not add a broker, a bean abstraction or a descriptor file.

## Design reference

The mockup's **Commit** control is what calls this. Its footnote — "Commit sends every changed status to the server" — is the endpoint's whole contract.

## Steps

1. Create `routes/api/admin/orders/decisions.post.ts`. A new file: **do not modify `status.post.ts`**, which serves the `admin-operations` capability's own batch requirement and whose body shape (`{ orderIds, status }`, one status for all) cannot express the mixed-status batch the screen commits (S11).
2. Call `requireAdmin(event)` first and return its error as-is, then validate — the shape both sibling admin routes already use and whose reasoning their comments record. The `/api/admin` protected-resource entry guards by prefix, so this path needs no resource-list entry.
3. Parse `{ decisions: [{ orderId: number, status: "APPROVED" | "DENIED" }] }`. Refuse with 400 on: a missing or empty array, a non-numeric `orderId`, or a status that is not one of the two. `PENDING` is **not** accepted as a decision — it is the state an order is in, not a decision anyone commits — and the screen never sends one (S7). Mirror `status.post.ts`'s parse-helper structure.
4. Delegate to `applyOrderDecisions` from `admin/order-status.ts` and return its `DecisionBatchResult` unchanged. The route holds no logic of its own beyond parsing.
5. Skipped orders come back in the response rather than as an error, which is how the "SHALL be skipped and not re-processed" scenarios stay observable without a logging facility (S8).
6. Tests: `routes/api/admin/orders/decisions.post.test.ts` against a real `H3Event`, no server — the pattern the sibling route tests use. Cover: a non-admin refused; each malformed body refused with 400; a valid mixed batch returning the right three buckets with the order rows actually moved; and the same batch posted twice, where the second returns every order as skipped and changes nothing.

## File/module ownership

Create: `routes/api/admin/orders/decisions.post.ts`, `routes/api/admin/orders/decisions.post.test.ts`.
Modify: nothing.

`status.post.ts` and `index.get.ts` are untouched by this sprint.

## Fixed interface contracts

```
POST /api/admin/orders/decisions
  body     { decisions: { orderId: number; status: "APPROVED" | "DENIED" }[] }
  200      { applied: number[]; skipped: number[]; notFound: number[] }
  400      { error: string }
```

SWHM-T-0210's screen codes against exactly this. `DecisionBatchResult` is `admin/order-status.ts`'s, unchanged.

## Definition of Done

AC-1 (the commit reaches the server and is processed) and AC-2 (a pending order in the batch is decided), both observable in the route test by reading the order rows back.
