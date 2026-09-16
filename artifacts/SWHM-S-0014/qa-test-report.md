---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0014
idea: SWHM-I-0008
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream: [artifacts/SWHM-S-0014/SPRINT-PLAN.md]
downstream: [artifacts/SWHM-S-0014/sprint-summary.md]
---

# QA test report — SWHM-S-0014

## Executive Summary

**Verdict: PASS.** SWHM-I-0008 (Order Submission & Checkout) holds on the integrated sprint
branch. All 19 scenarios in `openspec/changes/swhm-i-0008-order-submission-checkout/specs/order-placement/spec.md`
verify pass. One defect (DEFECT-1) was found by the real E2E run — the order-confirmation
screen never received the order id/email because the form never read the placement response —
and was fixed in place; see `integration-defects-resolution.md`. After the fix: `bun run verify`
is green (lint, typecheck, 577 unit tests) and the full Playwright suite is green (37/37).

## E2E Test Status

Full details and the per-spec table are in `integration-test-result.md`. Summary: first run
`36 passed, 1 failed` (`e2e/order.spec.ts` confirmation-screen assertion, DEFECT-1); after the
fix, full re-run `37 passed, 0 failed, 0 skipped`.

`E2E-RESULT: chromium 37 passed, 0 failed, 0 skipped`

## Unit Test Results

```
$ bun run test
 RUN  v4.1.10 /workspace/repo
 Test Files  91 passed (91)
      Tests  577 passed (577)
```

Run against the integrated sprint branch after DEFECT-1's fix (includes the updated assertion
in `src/pages/enter-order-information.test.tsx`, EOI-13). Same 577/577 result before and after
the fix — the fix only changed what EOI-13 asserted, not the count.

## Code Review

Incidental observations while verifying, beyond DEFECT-1 (below):

- `order/order.ts` wraps the order insert, line-item inserts and cart clear in one
  `db.transaction()`, and checks the empty-cart guard before any write — matches
  design.md's decision and the "Validate cart is not empty" requirement.
- `order/id.ts`'s `sqlite_sequence` seed is idempotent by construction (`INSERT ... WHERE NOT
EXISTS`), verified by inspection against `order/id.test.ts` (ID-01/ID-02/ID-03).
- Design fidelity: compared `src/pages/enter-order-information.tsx` and
  `src/pages/order-completed.tsx` against `artifacts/SWHM-S-0014/design/MANIFEST.md`'s fixed
  elements (billing/shipping/order-summary three-column layout, per-field `maxlength` and
  invalid state, the order-id label-over-number block, the "confirmation e-mail soon at …"
  line). No material deviation found. This is advisory, verified by inspection, and does not
  affect the verdict.
- No other notable concerns observed.

## Coverage Summary

No coverage tool is configured in this project (no `coverage` script in `package.json`, no
coverage config in `vitest.config.ts`) — this is `Not Applicable` rather than a gap to fill.
Verified via the executable run counts above: 577 unit tests across 91 files (`bun run test`)
plus 37 E2E specs (`bunx playwright test --project=chromium`), both passing on the integrated
branch.

## Issues Found

- DEFECT-1 (major, FIXED-IN-PLACE): order-completed screen never showed the order id or email
  in a real browser session — `handleSubmit` in `src/pages/enter-order-information.tsx` never
  read the `POST /api/order` response body on success. Full detail, root cause and fix rounds
  in `artifacts/SWHM-S-0014/integration-defects-resolution.md`. No future-sprint DEFECT ticket
  was needed — resolved within the fix-round budget.

## Recommendation

**Proceed.** Every acceptance criterion and spec scenario for SWHM-I-0008 holds on the
integrated branch after DEFECT-1's in-place fix. Firing `validation.all_acs_passed`.

SCENARIO-VERDICT: Accept order information with billing and shipping addresses / Order form captures billing address — pass
SCENARIO-VERDICT: Accept order information with billing and shipping addresses / Order form captures shipping address — pass
SCENARIO-VERDICT: Generate unique order IDs starting from seed value / First order receives ID 1001 — pass
SCENARIO-VERDICT: Generate unique order IDs starting from seed value / Subsequent orders receive incremented IDs — pass
SCENARIO-VERDICT: Record order date as current date at placement time / Order captures current date — pass
SCENARIO-VERDICT: Create line items from shopping cart contents / Line items are created for each cart item — pass
SCENARIO-VERDICT: Create line items from shopping cart contents / Line items include category and product identifiers — pass
SCENARIO-VERDICT: Clear shopping cart after successful order placement / Cart is cleared after order placement — pass
SCENARIO-VERDICT: Validate cart is not empty before order placement / Empty cart prevents order placement — pass
SCENARIO-VERDICT: Validate cart is not empty before order placement / Non-empty cart allows order placement — pass
SCENARIO-VERDICT: Order information form displays with billing and shipping sections / Order form displays billing information section — pass
SCENARIO-VERDICT: Order information form displays with billing and shipping sections / Order form displays shipping information section — pass
SCENARIO-VERDICT: Order information form displays with billing and shipping sections / Form contains valid state options — pass, verified against account/vocabulary.ts's STATES reused by design (design.md § Codebase findings F9: "exactly the values this spec asks for")
SCENARIO-VERDICT: Order information form displays with billing and shipping sections / Form contains valid country options — pass, verified against account/vocabulary.ts's COUNTRIES reused by design (design.md § Codebase findings F9); the vocabulary's "USA" is the existing, deliberately-reused value for the scenario's "United States"
SCENARIO-VERDICT: Enforce field length constraints on order information form / First name field limits to 30 characters — pass
SCENARIO-VERDICT: Enforce field length constraints on order information form / Address field limits to 70 characters — pass
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / Confirmation screen shows order ID — pass (DEFECT-1 fixed in place; failed on first E2E run)
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / Confirmation screen shows customer email — pass (DEFECT-1 fixed in place; failed on first E2E run)
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / Confirmation indicates email will be sent — pass
