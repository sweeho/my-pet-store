# SWHM-T-0224 — Notification service: queue entry point, completion trigger, recipient lookup

Change: `swhm-i-0012-customer-notifications-commu` · task group `## 1. Notification Service`
Read `openspec/changes/swhm-i-0012-customer-notifications-commu/design.md` first — its § Codebase findings, § Spec discrepancies and § Decisions are the record this plan rests on and are not repeated here.

## Objective

Give the capability its own directory, one way in, and the two things the message will need: a `COMPLETION` kind with a trigger, and the customer's contact details read from their account. Nothing is sent by this ticket.

Requirement implemented: **Customer email retrieval** (`specs/notifications/spec.md`). The queue side of **Order notification delivery** is set up here; the sending half is SWHM-T-0226.

## Steps

1. **Create `notifications/` and register it.** Add the directory to the `server` project's `include` and the `client` project's `exclude` in `vitest.config.ts` — both, per design.md F10. Registering it in one list only is the failure mode, and a test that reaches `db/client.ts` from the jsdom project cannot load `bun:sqlite` at all. **Deviation, recorded in summary.md:** `notifications` also needs adding to `tsconfig.node.json`'s `include` — `tsc --build` refused to resolve the new directory (`TS6307`) without it. Not called out in this step originally; the same directory-registration obligation extends to the TypeScript project, not only Vitest.

2. **Extend the `notifications` table** in `db/schema.ts` with delivery state: a `status` column that is not null and defaults to `QUEUED`, a nullable `sent_at` timestamp, and a nullable `failure_reason`. Do not create a second table — design.md D2 explains why the shipped rows and the rows the dispatcher reads have to be the same rows. Generate the migration into `drizzle/` and commit it; the schema change is incomplete without it.

3. **Move the kind vocabulary into `notifications/types.ts`** and widen it: `NotificationKind` becomes `"APPROVAL" | "DENIAL" | "COMPLETION"`, alongside `NotificationStatus` and `NotificationRecipient` (§ Fixed interface contracts below). `order/approval-types.ts` re-exports `NotificationKind` from here rather than declaring its own, so the two vocabularies cannot drift.

4. **Write `notifications/notify.ts`.** `notify(orderId, kind, queuedAt?)` writes one queued row, carrying the order's `billing_email` as the fallback address exactly as the shipped `order/notification.ts` does today. It opens no transaction — the caller's covers it, which is the shape `order/supplier-po.ts` and `order/notification.ts` already use. `order/notification.ts` and its test are removed; this supersedes them (D3, S4).

5. **Re-point the two existing call sites.** `order/decision.ts` calls `notify()` instead of `queueNotification()`, unchanged in every other respect — both outcomes queue, a skip and an unknown order queue nothing.

6. **Add the completion trigger.** `fulfillment/status.ts`'s `markOrderCompleted()` calls `notify(orderId, "COMPLETION")` on the path where it actually moves the order, and only there. Per design.md F4 that point is already guarded twice over: the status must be `APPROVED`, and `processOrder` only reaches it when every line has shipped. A partial run and a re-run over a `COMPLETED` order both return false without queuing.

7. **Write `notifications/recipient.ts`.** `resolveRecipient(orderId)` reads the order's `user_name` (F7) and returns the account's given name, family name and email through `account/customer.ts`'s `findAccount()` — never by querying `contact_info` directly, which would be a second read path for the same fact. Every field is nullable and an account that does not exist resolves to all-null rather than throwing (F6): an absent address is an ordinary outcome here, not an error.

8. **Tests, in `notifications/`** (they reach the database, so the registration in step 1 is what lets them run): a queued row per kind with the right order id; the partial-fulfilment and re-decision cases queuing nothing; `resolveRecipient` returning the account's values and returning nulls where the account is empty. `order/decision.test.ts` and `fulfillment/status.test.ts` follow their modules' new call. Mirror the fixture shape in the existing `order/notification.test.ts` rather than inventing one.

## File/module ownership

Created: `notifications/types.ts`, `notifications/notify.ts`, `notifications/notify.test.ts`, `notifications/recipient.ts`, `notifications/recipient.test.ts`, one migration under `drizzle/`.
Modified: `db/schema.ts`, `vitest.config.ts`, `order/approval-types.ts`, `order/decision.ts`, `order/decision.test.ts`, `fulfillment/status.ts`, `fulfillment/status.test.ts`.
Removed: `order/notification.ts`, `order/notification.test.ts`.

No other ticket in this sprint touches any of these. SWHM-T-0225 and SWHM-T-0226 add new files under `notifications/` and depend on this ticket, so nothing here is written concurrently.

## Fixed interface contracts

Peers code against these and must not change them:

```ts
// notifications/types.ts
export type NotificationKind = "APPROVAL" | "DENIAL" | "COMPLETION";
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "UNDELIVERABLE";
export type NotificationRecipient = {
  email: string | null;
  givenName: string | null;
  familyName: string | null;
};

// notifications/notify.ts
export function notify(orderId: number, kind: NotificationKind, queuedAt?: Date): void;

// notifications/recipient.ts
export function resolveRecipient(orderId: number): NotificationRecipient;
```

The `notifications` table keeps `id`, `order_id`, `kind`, `recipient_email` and `queued_at` as they are and gains `status`, `sent_at`, `failure_reason`.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-6. AC-1 is the change's **Customer email retrieval** requirement; AC-2 and AC-3 are the queueing behaviour the three transitions owe; AC-4 through AC-6 fix the contract, the schema and the harness registration the next three tickets build on.
