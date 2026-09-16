---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0160
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0159/PLAN.md,
  ]
---

# PLAN — SWHM-T-0160: Confirmation notification — the promise the screen makes

## Objective

Tell the shopper a confirmation email is coming, to the address they gave. That is the whole ticket, and it is deliberately small.

## Why it is this small

Read design.md § Spec discrepancies S4 first. The extracted specification's notification group describes an `AsyncSender` posting to a message queue and catching two container exceptions. There is no message queue, no mail transport and no async sender in this repository, and the idea places sending out of scope: delivery belongs to change `swhm-i-0012-customer-notifications-commu`.

What the delta spec actually requires of this change is one scenario — that the confirmation screen says an email is coming. Every other checkbox in the group is tagged to this ticket because every box in a group must be, and is recorded as not built.

## Steps

1. Add the message to `src/pages/order-completed.tsx`, interpolating the email address the order was placed with, in the wording and position the mockup shows.
2. Assert it in `src/pages/order-completed.test.tsx` against an address the test supplies, not a hard-coded one — the point of the assertion is the interpolation, and a literal address passes even if the value is ignored.

## What NOT to build

No sender, no queue, no transport, no retry, no background job, and **no no-op module standing in for one**. A module that exists only to do nothing is an abstraction for single-use code, and the next agent has to work out whether it is a seam or dead code. When a sender arrives it will bring its own shape; what this ticket leaves behind is the promise it has to honour, pinned by a test.

This ticket adds no dependency to the repository.

## A known gap, recorded rather than hidden

The screen promises an email that nothing sends, and will keep promising it until change `swhm-i-0012-customer-notifications-commu` lands. That is the specification's wording and a scenario asserts it verbatim, so it ships as written. An improvement ticket raised during planning carries the gap so it is not rediscovered as a defect.

## File/module ownership

Create or modify only: `src/pages/order-completed.tsx`, `src/pages/order-completed.test.tsx`.

Nothing else.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-order-confirmation.html` — the mail row beneath the order-id block, with its icon and its wording.

## Definition of Done

AC-1 through AC-3 on the ticket.
