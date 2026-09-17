# SWHM-T-0226 — Delivery: the mail transport boundary and the drain pass

Change: `swhm-i-0012-customer-notifications-commu` · task group `## 3. Message Queue`
Read `openspec/changes/swhm-i-0012-customer-notifications-commu/design.md` first. Decisions D4 (what drains the queue), D5 (when the recipient is resolved), D6 (at-most-once) and D8 (the transport) are this ticket's whole rationale, and discrepancy S1 is why there is no broker.

## Objective

Turn queued rows into sent messages, and record what became of each one. This is the ticket that makes the capability's three delivery scenarios true.

Requirements implemented: **Order notification delivery** and **Async notification delivery** (`specs/notifications/spec.md`).

## Steps

1. **Write `notifications/transport.ts`** — a `MailTransport` interface and a default implementation that records the message rather than delivering it, injectable by the caller. Mirror `payment/processor.ts`, which is the repository's one existing instance of this shape (design.md F8, D8). Add no dependency: there is no mail library here and nowhere to hold credentials (F5).

2. **Write `notifications/dispatch.ts`.** `dispatchQueued(transport?)` reads the rows still in `QUEUED`, and for each one:
   - resolves the recipient with `resolveRecipient` (SWHM-T-0224) and picks the address: the account's email, falling back to the row's `recipient_email`, per D5. The account wins — that is what the **Customer email retrieval** requirement observes, and it is the narrow exception to the copy-onto-the-order rule recorded in the key-decision index.
   - with no address from either, marks the row `UNDELIVERABLE` with a reason and hands the transport nothing. This is terminal and is **not** a failure (S6); a QA verdict must be able to tell the two apart.
   - otherwise builds the message with `buildMessage` (SWHM-T-0225), hands it to the transport, and marks the row `SENT` with a timestamp.
   - on a throw from the transport, marks the row `FAILED` with the reason and logs it with the order id, then continues to the next row. `console.error` is the mechanism this repository has (F12). The throw never propagates.

   Every row it picks up ends terminal in the same pass, which is what makes a repeat run a no-op (D7) — the obligation the standing "nothing retries, so the operation must tolerate being run twice" decision transfers to this capability.

3. **Drain after the transaction commits, on the request that queued the row** (D4). Two call sites, both after the call that owns the transaction returns, never inside it:
   - `routes/api/admin/orders/decisions.post.ts`, after `applyOrderDecisions`.
   - `routes/api/fulfillment/process.post.ts`, after `processOrder`.

   Order matters and is the whole of the async requirement: the status update has already committed by the time anything is handed to a transport, so it does not wait for delivery. Do not introduce a scheduler, a Nitro task, or a dispatch endpoint — D4 records why each was rejected.

4. **A drain failure never changes the response.** Neither call site's status code, body or error handling changes: a notification that could not be sent is a fact about the notification, not about the decision or the fulfilment run. This is § Error Handling in the change's own design document.

5. **Tests.** In `notifications/dispatch.test.ts`, with an injected transport that records what it was handed: the sent path with the account's address; the fallback to the row's address; the undeliverable path with no address anywhere; the failure path with a throwing transport, asserting the row's reason and that the order's status is untouched; and a second pass immediately after the first handing the transport nothing. In `notifications/transport.test.ts`, that the default records rather than delivers. The two route tests assert that the request still succeeds when the transport throws.

## File/module ownership

Created: `notifications/transport.ts`, `notifications/transport.test.ts`, `notifications/dispatch.ts`, `notifications/dispatch.test.ts`.
Modified: `routes/api/admin/orders/decisions.post.ts`, `routes/api/admin/orders/decisions.post.test.ts`, `routes/api/fulfillment/process.post.ts`, `routes/api/fulfillment/process.post.test.ts`.

No schema change and no migration — SWHM-T-0224 already added every column this ticket writes. No new route and no change to the protected-resource list: both call sites are endpoints that already exist and are already protected.

## Fixed interface contracts

```ts
// notifications/transport.ts
export interface MailTransport {
  send(message: MailMessage): void;
}
export const recordingTransport: MailTransport;

// notifications/dispatch.ts
export type DispatchResult = { sent: number; failed: number; undeliverable: number };
export function dispatchQueued(transport?: MailTransport): DispatchResult;
```

`dispatchQueued` never throws: every per-row outcome is recorded on the row and counted in the result.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-8. AC-1 to AC-3 are the change's three **Order notification delivery** scenarios; AC-4 is **Async notification delivery**; AC-5 to AC-7 are the terminal-status, isolation and repeat-safety behaviour D6 and D7 require; AC-8 fixes the transport as an injected boundary with no dependency added.
