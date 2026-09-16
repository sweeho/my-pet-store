---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0159
branch: vortex/feat/SWHM-T-0159-order-confirmation-screen-dcc10bdf
upstream: [artifacts/SWHM-S-0014/SWHM-T-0159/PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Summary — SWHM-T-0159: Order confirmation screen

## What changed

Added `/order-completed`, built to `mockup-order-confirmation.html`: the check icon, heading, order-id
block, and Continue Shopping action. It reads `{ orderId, email }` from React Router navigation state
(the shape SWHM-T-0156's placement route returns) and issues no fetch. Added the route to
`PROTECTED_RESOURCES`.

## Files

- `src/pages/order-completed.tsx` — new. `OrderCompleted` (content) + default export wrapped in
  `RequireSignOn`.
- `src/pages/order-completed.test.tsx` — new, 5 cases (OC-01…OC-05).
- `auth/protected-resources.ts` — one new entry, `{ legacy: "order_completed.jsp", path: "/order-completed" }`.
- `auth/protected-resources.test.ts` — new (no prior test file existed for this module), 2 cases
  (PR-01, PR-02).

## AC coverage

- AC-1 (order id shown as "Your order Id is 1005") — `src/pages/order-completed.test.tsx › OC-01`, `OC-03`.
- AC-2 (customer email confirmation line) — **not built here.** PLAN.md's scope boundary and
  `SWHM-T-0160`'s own `PLAN.md` (step 1: "Add the message to `src/pages/order-completed.tsx`,
  interpolating the email address...") both assign this line to `SWHM-T-0160`, which depends on this
  ticket and shares this file's ownership. Building it here would collide with that ticket's plan.
  See Notes.
- AC-3 (`/order-completed` protected) — `auth/protected-resources.test.ts › PR-01`, `PR-02`.
- AC-4 (built to the mockup: order-id block + Continue Shopping to the catalogue) —
  `src/pages/order-completed.tsx`; `OC-02`, `OC-04`.
- AC-5 (renders from `{ orderId, email }`, no fetch) — `src/pages/order-completed.tsx` reads
  `useLocation().state` only, no `fetch` call in the module; `OC-05` covers the no-state case.

## Verification

```
$ bun run lint && bun run typecheck && bun run test   # bun run verify
Test Files  89 passed (89)
     Tests  544 passed (544)
```

See `tdd-test-result.md` — `TDD-RESULT: 544 passed, 0 failed`.

`bun run verify:full`'s E2E tier was attempted and stopped at the documented missing-Chromium
preflight (no browser in this container); the same tier runs in CI and at integration QA.

## Notes

- **AC-2 deviation, not an oversight.** The ticket's own dispatch text lists "Confirmation screen
  shows customer email" among this ticket's acceptance criteria, but `PLAN.md`'s scope boundary
  states plainly: "The 'a confirmation e-mail is coming' message is SWHM-T-0160's, which depends on
  this ticket. Build the id and the email here; leave that line to it." `SWHM-T-0160`'s own `PLAN.md`
  (already on the branch) confirms this independently — its step 1 is to add that exact message to
  this same file, and its Definition of Done is scoped to that one line. Building it in this ticket
  would pre-empt SWHM-T-0160's whole reason to exist and risk a rework once it lands. Followed the
  two PLAN.md files as the more specific, cross-corroborating authority over the dispatch's scenario
  bucketing.
- **`{ orderId, email }` never actually reaches this page yet.** This ticket owns only the receiving
  screen. `src/pages/enter-order-information.tsx`'s success-path `navigate("/order-completed")` (built
  in SWHM-T-0154) still passes no state, and none of SWHM-T-0156/0157/0158's file ownership includes
  that page, so nothing in the current sprint plan wires the route's real response into this screen's
  navigation state. Flagged as a follow-up defect (see broadcast) rather than fixed here — that file
  is outside this ticket's ownership.
- The order-id block uses `role="group"` with a composed `aria-label` ("Your order Id is {id}") over
  two `aria-hidden` visual elements, matching design.md § Spec discrepancies S13 and the existing
  `aria-hidden` + accessible-name-on-wrapper pattern already used elsewhere (DESIGN.md § Brand mark,
  § Reported figures) — the label and number stay visually separate per the mockup while reading as
  one sentence to assistive tech.
