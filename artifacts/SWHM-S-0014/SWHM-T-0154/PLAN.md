---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0154
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0153/PLAN.md,
  ]
---

# PLAN — SWHM-T-0154: Form routing and validation

## Objective

Make the form submit: a validator, the one route this capability exposes, and the error presentation a refusal produces. The route answers 401 and 400 here; SWHM-T-0156 adds the success path on top.

## Steps

1. **`order/validation.ts`**, mirroring `account/validation.ts`: an exported validator and an exported error class the route maps to 400. Required fields are the address and contact fields for both sections; email is checked for format.
2. **State and country are not enforced server side.** `account/vocabulary.ts` marks both as form options only, and `account/validation.ts` deliberately validates language, category and card type while leaving those two alone (design.md § Codebase findings F9). Reusing that treatment preserves current behaviour; enforcing it here would make this capability the only one that does, for no scenario.
3. **`routes/api/order/index.post.ts`**, following `routes/api/customer/index.put.ts` line for line (§ Codebase findings F11): `useSignOnSession(event)` → 401 without `j_signon_username`, validate → 400 on the error class, otherwise proceed. Nitro registers the route by the file existing; there is nothing to configure (§ Spec discrepancies S3).
4. **Wire the form's submit.** A 400 re-renders in place — the SPA equivalent of the Struts "failure → re-render form" forward (§ Spec discrepancies S3). The shopper's entered values survive the refusal; nothing is cleared.
5. **Error presentation, both levels.** One form-level `role="alert"` above the form saying the submission was refused, and on each offending input `aria-invalid="true"` plus an adjacent `role="alert"` message naming what is wrong with that field. The pattern and the reasoning are in DESIGN.md § Form validation states, written this sprint from this screen's mockup; build from that section rather than from the mockup's CSS. Neither element renders until there is something to report.
6. Tests: `order/validation.test.ts` for each required field and the email format; `routes/api/order/index.post.test.ts` for 401, 400 and the pass-through; `src/pages/enter-order-information.test.tsx` for the two levels of error presentation and for values surviving a refusal.

## Scope boundary

No order is created here and nothing is written to the database. The success branch hands off to a placement function SWHM-T-0156 introduces — leave a clear seam for it rather than inlining a stub that later has to be unpicked.

## File/module ownership

Create or modify only: `order/validation.ts`, `order/validation.test.ts`, `routes/api/order/index.post.ts`, `routes/api/order/index.post.test.ts`, `src/pages/enter-order-information.tsx`, `src/pages/enter-order-information.test.tsx`.

Nothing else. `order/types.ts` is complete and imported, never edited (design.md § Decisions D8). The field set on the page is already correct — add behaviour, do not restructure the markup.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-enter-order-information.html` shows the refused state: the form-level alert banner at the top and the invalid email field with its border and message. That is the state this ticket produces.

## Definition of Done

AC-1 through AC-7 on the ticket.
