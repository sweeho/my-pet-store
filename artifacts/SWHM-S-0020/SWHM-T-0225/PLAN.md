# SWHM-T-0225 — Email generation: subject and body per notification kind

Change: `swhm-i-0012-customer-notifications-commu` · task group `## 2. Email Generation`
Read `openspec/changes/swhm-i-0012-customer-notifications-commu/design.md` first. Discrepancy S5 is the one that shapes this ticket: the extracted task asks for email _templates_, and there is no template engine in this repository and no template customization in scope.

## Objective

Turn a queued notification plus its resolved recipient into the message that will be handed to a transport. Pure — no database read, no I/O, nothing sent.

Requirement implemented: **Notification content** (`specs/notifications/spec.md`).

## Steps

1. **Add `MailMessage` and the builder's input type to `notifications/types.ts`** (contract below). This is the only file SWHM-T-0224 also owns; that ticket is a dependency, so the edit is sequential, not concurrent.

2. **Write `notifications/message.ts`.** `buildMessage(input)` returns `{ to, subject, body }`. One function with a per-kind lookup for the wording — not three functions and not a template file (S5). The address is the recipient's, and the builder is given it rather than resolving it: resolution belongs to `resolveRecipient` and the fallback to the dispatcher (SWHM-T-0226), so this function never decides who a message goes to.

3. **Name all three facts in the body**: the order id, the customer's name, and the order's current status. That is the requirement's scenario verbatim, so treat it as the assertion: a body missing any one of the three fails.

4. **Handle an absent name.** Every contact field is nullable (design.md F6), so build the name from whichever of the given and family names exist and address the customer without a name when neither does. No `"null"`, no empty bracket, no `"Dear ,"` — the shipped default-noun lesson in the key-decision index applies: a placeholder that reads wrong for one caller reads wrong silently.

5. **Distinguish the three kinds.** An approval, a denial and a completion carry different subjects and different body wording. A customer who receives two of them must be able to tell which is which from the subject alone.

6. **Test in `notifications/message.test.ts`**: the three facts present for each kind; the three subjects distinct; the no-name, given-name-only and family-name-only cases; and that the function is callable with plain objects and no database fixture, which is what proves it pure.

## File/module ownership

Created: `notifications/message.ts`, `notifications/message.test.ts`.
Modified: `notifications/types.ts` (additive only — the types SWHM-T-0224 fixed are not changed).

Nothing else. This ticket writes no route, no schema and no migration.

## Fixed interface contracts

```ts
// notifications/types.ts — added
export type MailMessage = { to: string; subject: string; body: string };
export type MessageInput = {
  orderId: number;
  kind: NotificationKind;
  status: string;
  recipient: NotificationRecipient;
  to: string;
};

// notifications/message.ts
export function buildMessage(input: MessageInput): MailMessage;
```

`to` is passed in already decided, so `buildMessage` never reads `recipient.email` to choose an address.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-4. AC-1 is the change's **Notification content** requirement; AC-2 and AC-3 are the per-kind and absent-name behaviour it implies; AC-4 fixes the module as pure so the dispatcher can compose it without a fixture.
