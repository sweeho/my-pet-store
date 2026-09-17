# SWHM-T-0213 — Customer notifications queued on approval and denial

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 10 · Requirement: **Send notifications on order approval and denial**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D5, D6, D7 and § Spec discrepancies S9 are what this ticket rests on.

## Objective

A decision records that the customer is owed word of it. A row, not an email: the scenarios say "queued", and a row is exactly that.

## Read S9 before writing anything

Nothing in this product sends email and no notification infrastructure exists. `swhm-i-0012` owns delivery and has not been built. Do not add a mail dependency, a transport, a retry path or a scheduler. `tasks.md` 10.5 ("handle notification errors gracefully") is satisfied by the row sharing the decision's transaction: a failure rolls the whole decision back, which is the only failure mode a single insert has here.

Note the extracted `## Notification System` section sends a **completion** notification on denial. The delta spec corrects that to a denial notification and the delta spec is what you build.

## Design reference

The mockup's footnote states the user-visible half: "both approvals and denials notify the customer". No new UI — nothing shows a notification to anyone yet, which is recorded in `PRODUCT.md § Not yet decided`.

## Steps

1. Add `notifications` to `db/schema.ts`: an autoincrement id, `order_id` referencing `orders.orderId`, `kind` (`APPROVAL` or `DENIAL`), `recipient_email`, and `queued_at`. Generate the migration into `drizzle/` and commit it. Do not make `order_id` the primary key — an order can be owed more than one notification over its life, unlike a supplier PO.
2. `recipient_email` is **copied** from the order's `billing_email` at the moment the notification is queued, not joined from the account (D5, and the standing rule that an order records what was agreed). It is nullable on the order, so carry a null through rather than refusing the decision — the notification records what the order held.
3. Write `order/notification.ts` exporting `queueNotification(orderId, kind, queuedAt?)`. It opens no transaction; the caller's covers it (D6).
4. Wire it into `order/decision.ts` at the extension point: called on **both** outcomes — `APPROVAL` after an approval, `DENIAL` after a denial — and on neither a skip nor a missing order. On an approval it runs after `createSupplierPo`, inside the same transaction, so a PO failure queues nothing (D6).
5. Tests: `order/notification.test.ts` asserts the row's kind, order id and copied email for each outcome, and the null-email case. Extend `order/decision.test.ts` to assert an approval queues exactly one `APPROVAL` row, a denial exactly one `DENIAL` row, a skipped terminal order queues none, and deciding the same order twice queues exactly one (D7).

## File/module ownership

Create: `order/notification.ts`, `order/notification.test.ts`, one file under `drizzle/`.
Modify: `db/schema.ts` (the `notifications` table only), `order/decision.ts`, `order/decision.test.ts`.

## Fixed interface contracts

```ts
export function queueNotification(
  orderId: number,
  kind: NotificationKind, // "APPROVAL" | "DENIAL", from order/approval-types.ts
  queuedAt?: Date,
): void;
```

`NotificationKind` is `order/approval-types.ts`'s, written whole by SWHM-T-0204 — use it, do not extend that file. `swhm-i-0012` will read this table; the column names are its contract, so do not abbreviate them.

## Definition of Done

AC-1 and AC-2, each observable by reading the `notifications` table back after a decision.
