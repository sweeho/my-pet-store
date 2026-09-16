---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0015
ticket: SWHM-T-0165
branch: vortex/fix/SWHM-T-0165-enter-order-information-tsx-doesn-t-pass-07b16c42
upstream:
  [
    artifacts/SWHM-S-0015/SWHM-T-0165/PLAN.md,
    openspec/changes/swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01/design.md,
  ]
---

# Fix note — SWHM-T-0165: enter-order-information.tsx doesn't pass { orderId, email } to /order-completed

## Root cause

None found on this branch — the reported fault is not present. `handleSubmit`'s success path in
`src/pages/enter-order-information.tsx` (lines 362-367) already parses the placement response
(`{ orderId, email }`, the fixed shape from `routes/api/order/index.post.ts`) and passes it as
router state: `navigate("/order-completed", { state: { orderId: result.orderId, email:
result.email } })`. This landed in commit `5d0bb64` (SWHM-S-0014 / SWHM-T-0159) and has not moved
since. `design.md § D1` records the same finding independently for this sprint's planning.

## Fix

No production code change. Confirmed each acceptance criterion holds against the existing code and
existing assertions:

- **AC-1** (confirmation screen shows the order id from that placement) — `handleSubmit` navigates
  with `state: { orderId: result.orderId, ... }`; `order-completed.tsx`'s labelled order-id group
  renders it, exercised by `order-completed.test.tsx` OC-01 (renders) and OC-03 (a non-fixed id,
  2042, renders correctly — not a hard-coded 1005).
- **AC-2** (confirmation screen names the billing email, interpolated) — same navigation call
  passes `email: result.email`; `order-completed.test.tsx` OC-06/OC-07 assert the confirmation copy
  interpolates a non-fixed address.
- **AC-3** (no placement result → no identifier, no email line) — `order-completed.test.tsx` OC-05
  (no order-id group when no state) and OC-08 (no confirmation-email line when no state).
- **AC-4** (the caller-side assertion + the order-completed cases hold) — `bun run verify` is green:
  91 test files, 577 tests, including `enter-order-information.test.tsx` EOI-13 (the exact
  handoff assertion this ticket asks for) and `order-completed.test.tsx`.

To prove EOI-13 is a real oracle for this defect rather than a vacuous assertion, `navigate(
"/order-completed", { state: {...} })` was temporarily reduced to `navigate("/order-completed")`
(the defect this ticket describes) and EOI-13 was re-run: it failed with the expected diff
(received call carried no second argument; expected `{ state: { orderId: 1005, email:
"maya.chen@example.com" } }`). The file was then restored to its original content (`git diff`
empty) before any other step. Full red output is in `tdd-test-result.md`.

The browser tier (`e2e/order.spec.ts`) was not re-run here — Chromium is genuinely absent in this
container (`scripts/ensure-playwright-browser.mjs` fails fast) — but was already observed passing
in CI run `35138625151` on this sprint branch (37/37 E2E tests green), per `design.md § D1`.
`e2e/order.spec.ts` and its acceptance criteria belong to SWHM-T-0166.

## Files touched

None. No file outside the temporary, reverted probe above was modified.
