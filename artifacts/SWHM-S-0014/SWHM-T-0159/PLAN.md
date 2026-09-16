---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0159
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0153/PLAN.md,
  ]
---

# PLAN — SWHM-T-0159: Order confirmation screen

## Objective

Build `/order-completed`: what a shopper sees once their order exists — its identifier, and the address a confirmation will go to.

## Steps

1. **`src/pages/order-completed.tsx`**, built to the mockup. Creating the file is the whole route registration (ARCHITECTURE.md § Routing).
2. **Add `/order-completed` to `PROTECTED_RESOURCES`.** Unlike `/enter-order-information`, this path is not already listed (design.md § Codebase findings F7), and the screen shows an order identifier and an email address, so it is not public. The standing rule is that a new protected resource is added to the configuration, never as a new check in the page — the page still wraps in `RequireSignOn`, which reads that same configuration through `/api/signon/check`.
3. **Read § Spec discrepancies S13 before writing the order-id markup.** The scenario asserts the screen shows "Your order Id is 1005" as one sentence. The mockup renders "Your order Id is" as a label above the number as a separate, larger element. Build the mockup, and compose the two so the block's accessible text reads as the scenario's sentence — a test matching that exact string against a single element would fail on a correct implementation.
4. The screen renders from the `{ orderId, email }` the placement route returned (SWHM-T-0156's fixed response shape). **Do not fetch an order back.** No endpoint reads an order for a shopper, and adding one is out of scope — order history is an open product question, not this change's.
5. Include the Continue Shopping action the mockup shows, returning to the catalogue.
6. Tests: `src/pages/order-completed.test.tsx` for the order id, the email, and the Continue Shopping link; `auth/protected-resources.test.ts` for the new entry.

## Scope boundary

The "a confirmation e-mail is coming" message is SWHM-T-0160's, which depends on this ticket. Build the id and the email here; leave that line to it.

## File/module ownership

Create or modify only: `src/pages/order-completed.tsx`, `src/pages/order-completed.test.tsx`, `auth/protected-resources.ts`, `auth/protected-resources.test.ts`.

Nothing else.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-order-confirmation.html` is authoritative for this screen; `artifacts/SWHM-S-0014/design/wireframe-order-confirmation.html` fixes the structure. `artifacts/SWHM-S-0014/design/MANIFEST.md` flags the order-id composition trap above.

## Definition of Done

AC-1 through AC-5 on the ticket.
