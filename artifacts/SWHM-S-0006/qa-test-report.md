---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0006
idea: Not Applicable
branch: vortex/sprint/swhm-s-0006-e3b91808
upstream:
  [
    artifacts/SWHM-S-0006/SPRINT-PLAN.md,
    artifacts/SWHM-S-0006/integration-test-result.md,
    artifacts/SWHM-S-0006/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHM-S-0006/sprint-summary.md]
---

# QA test report — SWHM-S-0006

## Executive Summary

**Verdict: PASS.** SWHM-S-0006 is a one-ticket bugfix sprint (SWHM-T-0059): give `RequireSignOn` and `CustomerProfile` an accessible pending state instead of rendering `null`, and anchor `e2e/customer-profile.spec.ts`'s post-re-sign-in wait on the settled screen instead of a blind content-assertion timeout. Verified on the integrated sprint branch: build succeeds, `bun run verify` (lint + typecheck + unit) is green at 250/250, and the real Playwright E2E suite (12 specs, including the previously-flaky `customer-profile.spec.ts`) passed three-for-three full runs, including the run that matters most — the target spec — every time it actually executed. All five scenarios in the `application-foundation` delta spec verify pass. No defects found; nothing fixed in place.

## E2E Test Status

Executed (not configured-only) against the integrated sprint branch: `bun install` → `bun run build` → `bunx playwright test --list` (confirmed all 12 tests across 5 spec files fall under the single `chromium` project) → `bun run test:e2e --project=chromium`. Full detail, the per-spec table, and the flake-check narrative are in `integration-test-result.md`.

Playwright summary: `12 passed (4.0s)`, 0 failed, 0 skipped.

E2E-RESULT: chromium 12 passed, 0 failed, 0 skipped

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  51 passed (51)
      Tests  250 passed (250)
```

Baseline before this ticket (per its `tdd-test-result.md`, same 250/250 total) already includes SWHM-T-0059's new/added tests: `src/components/RequireSignOn.test.tsx` (new file, 3 cases) and `src/pages/customer.test.tsx`'s added PT-10, with PT-01 through PT-09 unmodified.

## Code Review

Read the diff (`ebb41d4`) against `design.md` (D1–D6) and the delta spec. `RequireSignOn`'s access-check contract is unchanged — the denial branch still calls `navigate(result.redirectTo)` and never renders children, only its undecided-branch render changed from `null` to a `role="status"` element, matching D2/D3. `customer.tsx`'s no-account branch now renders the `<h1>` shell plus a `role="status"` paragraph inside the same `mx-auto max-w-[672px] p-6` container the loaded view uses, matching D4. The E2E spec change is minimal and targeted: one `expect(...).toBeVisible({ timeout: 15000 })` wait on the contact-information region inserted before the existing content assertions, which keep their default (tight) budget — matches D1's rejection of simply widening the content assertion's timeout. `DESIGN.md` § Loading states and `ARCHITECTURE.md` § Key Decisions were both brought to target state in the planning commit (`ad48237`) ahead of the fix, and cover exactly this pattern. No notable concerns observed in the changed files.

One incidental, non-blocking observation: `openspec/changes/swhm-s-0006-multi-language-support/tasks.md` items 1.2 and 1.4 (owned by the planning ticket SWHM-T-0066, already DONE) are still unchecked, even though their content — the change's proposal/design/delta authoring and the `DESIGN.md`/`ARCHITECTURE.md` updates — is verifiably present on the branch. This is a checkbox-bookkeeping gap, not a functional one; `openspec/` is platform-managed and out of this ticket's ownership, so it is reported here rather than edited.

## Coverage Summary

No coverage tool is configured in this project (no `coverage` script in `package.json`, no coverage reporter in `vitest.config.ts`) — this is consistent with prior sprints in this repo. Verified by inspection of `package.json` and `vitest.config.ts`. Test-count evidence stands in: 51 test files / 250 tests pass, including the 4 tests SWHM-T-0059 added or extended (`RequireSignOn.test.tsx`'s 3 cases, `customer.test.tsx`'s PT-10), which directly exercise the new pending-state branches in both changed components.

## Issues Found

None. See `integration-defects-resolution.md` (empty summary table, `INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`). One transient `webServer` startup timeout occurred on one of three E2E runs in this container — logged in `integration-test-result.md` § Flake check as an environment/harness issue (no test executed during that attempt), not an application defect; it did not recur.

SCENARIO-VERDICT: Observable pending state on data-gated screens / A protected screen announces that it is loading — pass
SCENARIO-VERDICT: Observable pending state on data-gated screens / The customer profile announces that it is loading its account — pass
SCENARIO-VERDICT: Observable pending state on data-gated screens / The pending indicator is replaced by the screen's content — pass
SCENARIO-VERDICT: Observable pending state on data-gated screens / A denied visitor is redirected rather than left on the pending indicator — pass
SCENARIO-VERDICT: Observable pending state on data-gated screens / The cross-session profile check waits on the settled screen — pass

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** Every acceptance criterion on SWHM-T-0059 holds, every scenario in the `application-foundation` delta verifies pass, the real E2E run is green with zero failures and zero skips, and no defect was found to fix or escalate.
