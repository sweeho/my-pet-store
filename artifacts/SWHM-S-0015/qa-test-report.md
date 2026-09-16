---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0015
idea: Not Applicable
branch: vortex/sprint/swhm-s-0015-3040cbce
upstream:
  [
    artifacts/SWHM-S-0015/SPRINT-PLAN.md,
    openspec/changes/swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01/design.md,
  ]
downstream:
  [
    artifacts/SWHM-S-0015/integration-test-result.md,
    artifacts/SWHM-S-0015/integration-defects-resolution.md,
  ]
---

# QA test report — SWHM-S-0015

## Executive Summary

**Verdict: PASS.** Sprint goal "Bugfix — SWHM-T-0165, SWHM-T-0166" holds on the integrated sprint
branch. Both tickets report the same fault at the same line (`enter-order-information.tsx`'s order
submit handler not carrying `{ orderId, email }` to `/order-completed`); the fault was already fixed
on this branch before either ticket ran, and each ticket's own verification confirmed that with no
production-code diff (see `openspec/changes/swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01/design.md` §D1
for the prior evidence this QA pass re-verified independently rather than took on trust). This pass
re-ran the full gate stack from a clean checkout and re-executed the order journey in a real
browser: `bun run verify` is green (577/577 unit tests), and `bun run test:e2e -- --project=chromium`
is green (37/37, 0 skipped), including the order-placement journey the sprint's two defects target.
All 6 delta-spec scenarios verified pass. No defects found; nothing to fix.

## E2E Test Status

37/37 passed, 0 failed, 0 skipped. Full command, per-spec table and Playwright's verbatim summary
are in `artifacts/SWHM-S-0015/integration-test-result.md`.

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  91 passed (91)
      Tests  577 passed (577)
   Duration  8.77s
```

Lint and typecheck both exit 0 (bundled in `verify`; no separate failing output to show). This
matches `design.md`'s D1 baseline of "91 files and 577 tests" measured during planning — no
regression since.

Ticket-scoped re-run of the two files the defects and delta spec name directly:

```
$ bun run test src/pages/enter-order-information.test.tsx src/pages/order-completed.test.tsx
 Test Files  2 passed (2)
      Tests  24 passed (24)
```

## Code Review

Read `src/pages/enter-order-information.tsx`'s submit handler while verifying the handoff scenario:
line 362 parses the placement response as `{ orderId: number; email: string }`, and line 367 calls
`navigate("/order-completed", { state: { orderId: result.orderId, email: result.email } })`. This is
exactly the shape both defects asked for. No notable concerns observed elsewhere in the reviewed
path.

## Coverage Summary

No coverage-reporting tool is declared in `package.json` or the project's command table (`verify`
runs lint + typecheck + `vitest run`, with no `--coverage` flag). Not run; not fabricated.
`91 test files / 577 tests` from the unit run above is the available proxy for breadth.

## Issues Found

None. See `artifacts/SWHM-S-0015/integration-defects-resolution.md` (empty summary table,
`INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`).

SCENARIO-VERDICT: Order confirmation screen displays order ID and email / Confirmation screen shows order ID — pass (unit: order-completed.test.tsx OC-03; e2e: order.spec.ts:126)
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / Confirmation screen shows customer email — pass (e2e: order.spec.ts:126, `BILLING.email` visible)
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / Confirmation indicates email will be sent — pass (verified by inspection of order-completed.tsx's confirmation copy, rendered in the e2e run above)
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / Submitting a valid order carries that placement's identifier to the confirmation screen — pass (unit: enter-order-information.test.tsx:222-231; e2e: order.spec.ts:134-143)
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / A second order's confirmation shows that order's own identifier — pass (e2e: order.spec.ts:147-159, second order id asserted greater than the first; unit: order-completed.test.tsx OC-03)
SCENARIO-VERDICT: Order confirmation screen displays order ID and email / A confirmation screen reached without a placement result shows no identifier — pass (unit: order-completed.test.tsx OC-05, OC-08)

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** No defects found; both committed tickets' acceptance
criteria hold on the integrated sprint branch, confirmed by an independent re-run of the full unit
suite and a real browser E2E run, not by re-stating the tickets' own claims.
