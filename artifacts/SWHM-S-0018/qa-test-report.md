---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0018
idea: SWHM-I-0011
branch: vortex/sprint/swhm-s-0018-12051c41
upstream: [artifacts/SWHM-S-0018/SPRINT-PLAN.md]
downstream: [artifacts/SWHM-S-0018/sprint-summary.md]
---

# QA test report — SWHM-S-0018

## Executive Summary

**Verdict: PASS.** All ten tickets (SWHM-T-0204 through SWHM-T-0213) for SWHM-I-0011 (Order Approval Workflow) are merged into the sprint branch. Every one of the four acceptance criteria on this ticket holds, and every one of the 23 scenarios in `openspec/changes/swhm-i-0011-order-approval-workflow/specs/order-approval/spec.md` was exercised and passed — see the `SCENARIO-VERDICT:` lines under `## Unit Test Results`. `bun run verify` (lint + typecheck + unit) passed clean at 818/818 tests, and the full Playwright E2E suite passed 44/44, including this sprint's own `e2e/order-approval.spec.ts` journey. No defect was found; `integration-defects-resolution.md` is empty and marked `COMPLETE`.

**Note on this report's section list:** this ticket's acceptance criteria and this role's dispatch both specify EXACTLY 7 sections for this file (`Executive Summary`, `E2E Test Status`, `Unit Test Results`, `Code Review`, `Coverage Summary`, `Issues Found`, `Recommendation`), omitting the `artifact-qa-test-report` skill's 8th section (`Design fidelity`). Per the layering rule that a role/ticket instruction never gets silently overridden by a skill, this report follows the 7-section list; the design-fidelity comparison (mandated separately as an advisory pass) is folded into `## Code Review` below instead of getting its own heading.

## E2E Test Status

44/44 Playwright tests passed on the integrated sprint branch, 0 failed, 0 skipped — including `e2e/order-approval.spec.ts`, the administrator's bulk approve-and-commit journey. Full per-spec table, commands and the run summary are in `artifacts/SWHM-S-0018/integration-test-result.md`.

`E2E-RESULT: chromium 44 passed, 0 failed, 0 skipped`

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  120 passed (120)
      Tests  818 passed (818)
   Duration  11.68s
```

Ran clean on the first attempt — lint, typecheck and the full Vitest suite (`client` + `server` projects). This sprint's own coverage: `order/*.test.ts` (9 files — `approval`, `status`, `decision`, `supplier-po`, `notification`, `errors`, `id`, `order`, `validation`), `admin/order-status.test.ts`, `src/pages/admin/orders-approval.test.tsx`, and `src/components/ui/status-select.test.tsx`, plus the extended `src/theme-tokens.test.ts` (`status pairs (pending, approved, denied)` describe block, F18/D9).

### Scenario verdicts (openspec delta spec)

Every scenario in `openspec/changes/swhm-i-0011-order-approval-workflow/specs/order-approval/spec.md`, verified against the executed unit-test evidence above and/or the E2E run:

```
SCENARIO-VERDICT: Auto-approve small orders based on locale and amount / US order under $500 is automatically approved — pass (order/approval.test.ts AC-1; order/order.test.ts AP-01, integration through placeOrder)
SCENARIO-VERDICT: Auto-approve small orders based on locale and amount / US order over $500 remains pending — pass (order/approval.test.ts AC-2; order/order.test.ts AP-02)
SCENARIO-VERDICT: Auto-approve small orders based on locale and amount / Japan order under ¥50,000 is automatically approved — pass (order/approval.test.ts AC-3; order/order.test.ts AP-03)
SCENARIO-VERDICT: Auto-approve small orders based on locale and amount / Japan order over ¥50,000 remains pending — pass (order/approval.test.ts AC-4; order/order.test.ts AP-04)
SCENARIO-VERDICT: Accept only pending orders for approval or denial / Pending orders are eligible for approval — pass (order/status.test.ts OS-03; order/decision.test.ts AC-1/DA-01)
SCENARIO-VERDICT: Accept only pending orders for approval or denial / Approved orders are skipped — pass (order/decision.test.ts DA-05; admin/order-status.test.ts OD-02)
SCENARIO-VERDICT: Accept only pending orders for approval or denial / Denied orders are skipped — pass (order/decision.test.ts DA-06)
SCENARIO-VERDICT: Accept only pending orders for approval or denial / Completed orders are skipped — pass (order/decision.test.ts DA-07)
SCENARIO-VERDICT: Generate supplier purchase orders for approved orders / Supplier PO is generated on order approval — pass (order/supplier-po.test.ts AC-1; order/decision.test.ts DA-09)
SCENARIO-VERDICT: Generate supplier purchase orders for approved orders / Supplier PO includes all line items — pass (order/supplier-po.test.ts AC-2)
SCENARIO-VERDICT: Generate supplier purchase orders for approved orders / Supplier PO is sent to supplier queue — pass (order/supplier-po.test.ts AC-3; satisfied per design.md § Spec discrepancies S2 by the PO row existing where fulfilment reads it — no queue or XML exists in this product, and none is introduced)
SCENARIO-VERDICT: Transition order status through approval workflow / Order status transitions to APPROVED — pass (order/decision.test.ts AC-1/DA-01, DA-02; e2e/order-approval.spec.ts)
SCENARIO-VERDICT: Transition order status through approval workflow / Order status transitions to DENIED — pass (order/decision.test.ts AC-2/DA-03, DA-04)
SCENARIO-VERDICT: Send notifications on order approval and denial / Notification is queued on approval — pass (order/notification.test.ts AC-1/NT-01; order/decision.test.ts DA-11)
SCENARIO-VERDICT: Send notifications on order approval and denial / Notification is queued on denial — pass (order/notification.test.ts AC-2/NT-02; order/decision.test.ts DA-12)
SCENARIO-VERDICT: Orders Approval screen displays pending orders with editable status / Approval screen displays all pending orders — pass (src/pages/admin/orders-approval.test.tsx AC-1/OA-03, OA-04; e2e/order-approval.spec.ts)
SCENARIO-VERDICT: Orders Approval screen displays pending orders with editable status / Status column is editable via dropdown — pass (src/pages/admin/orders-approval.test.tsx AC-2/OA-05; src/components/ui/status-select.test.tsx AC-2/SS-03)
SCENARIO-VERDICT: Orders Approval screen displays pending orders with editable status / Approve button sets selected rows to APPROVED — pass (src/pages/admin/orders-approval.test.tsx OA-08; e2e/order-approval.spec.ts)
SCENARIO-VERDICT: Orders Approval screen displays pending orders with editable status / Deny button sets selected rows to DENIED — pass (src/pages/admin/orders-approval.test.tsx OA-09)
SCENARIO-VERDICT: Orders Approval screen displays pending orders with editable status / Commit button sends changes to server — pass (src/pages/admin/orders-approval.test.tsx AC-3/AC-4/OA-10; e2e/order-approval.spec.ts)
SCENARIO-VERDICT: Orders Approval screen displays pending orders with editable status / Multiple orders can be bulk-approved — pass (e2e/order-approval.spec.ts — three orders selected, approved and committed together)
SCENARIO-VERDICT: Orders Approval screen status column displays color-coded status / Status cells display correct background colors — pass (src/components/ui/status-select.test.tsx AC-1/AC-2 — each status renders its own `status-select-{status}` class, bound to `--status-{status}-bg/fg/border` tokens in src/index.css; jsdom cannot resolve computed colour, so the class is the stable assertion point per the test's own comment)
SCENARIO-VERDICT: Orders Approval screen status column displays color-coded status / Color coding aids visual status identification — pass (src/components/ui/status-select.test.tsx distinct-class assertions plus src/theme-tokens.test.ts "status pairs" AA-contrast checks in the light theme; status text always renders alongside the colour per D9, so identification does not depend on colour alone)
```

No `SPEC-GAP:` findings — every behaviour this ticket's acceptance criteria and the delta spec promised is covered by an existing scenario.

## Code Review

No notable concerns observed in the implementation. `order/`, `admin/order-status.ts` and the two new route handlers follow the design document's decisions precisely: the auto-approval decision is a pure function (D1), the guard is a predicate with a reported skip rather than a raised error (D3), the batch applier wraps guard + status write + supplier PO + notification in one `db.transaction` (D6), and re-deciding an already-terminal order writes nothing a second time (D7). `admin/order-status.ts` correctly keeps `applyOrderDecisions` (guarded) separate from the pre-existing `updateOrderStatus` (unguarded, owned by `admin-operations`) rather than merging them, matching § Spec discrepancies S11's reasoning.

**Design fidelity (advisory only — informs this review, does not affect the verdict or `## Recommendation`).** Reference: `artifacts/SWHM-S-0018/design/mockup-orders-approval.html` (mockup, 1440×900). Method: read the mockup's HTML/CSS and compared it against `src/pages/admin/orders-approval.tsx` and `src/components/ui/status-select.tsx`.

| Element                                        | Mockup                                                                                                                                                 | Built                                                                                    | Deviation                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Title                                          | "Orders Approval"                                                                                                                                      | "Orders Approval"                                                                        | none                                              |
| Subheading                                     | "Orders above the auto-approval threshold for their locale. 8 awaiting review."                                                                        | "Orders above the auto-approval threshold for their locale." (no count)                  | minor — the awaiting-review count is not rendered |
| "Pending orders" section label above the table | present                                                                                                                                                | absent                                                                                   | minor                                             |
| Columns, in order                              | select · Order ID · User ID · Order Date · Order Amount · Status                                                                                       | same six, same order                                                                     | none                                              |
| Status control                                 | dropdown with coloured trigger + dotted options                                                                                                        | `StatusSelect` (Headless UI `Listbox`) with the same three token-driven classes and dots | none                                              |
| Selection summary                              | "3 selected · 3 uncommitted changes"                                                                                                                   | `${selectedCount} selected · ${uncommittedCount} uncommitted changes`                    | none                                              |
| Actions                                        | Approve (outline) · Deny (destructive) · Commit (default), in that order, outside the table                                                            | same three, same order, same variants, outside the table                                 | none                                              |
| Footnote                                       | "Commit sends every changed status to the server. Approved orders generate a supplier purchase order; both approvals and denials notify the customer." | identical text                                                                           | none                                              |

2 minor deviations (missing awaiting-review count, missing "Pending orders" label), both cosmetic. Reported for a human decision; not filed as a defect, not a reason to withhold the verdict.

## Coverage Summary

No coverage-reporting tool is declared in `package.json` (`test` is `bun --bun vitest run` with no `--coverage` flag, and no coverage script is listed in the project's declared commands). No coverage percentage is reported here rather than manufacturing one. What was run instead: the full Vitest suite (818/818 passing across 120 files) and the full Playwright suite (44/44 passing), both against the integrated sprint branch — see `## Unit Test Results` and `## E2E Test Status` above.

## Issues Found

None. `artifacts/SWHM-S-0018/integration-defects-resolution.md` is empty (marked `INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`) — no defect was found during integration QA.

One out-of-scope item is already recorded, not raised fresh here: design.md § Spec discrepancies S10 notes that `fulfillment/status.ts` completes any non-`COMPLETED` order without requiring `APPROVED` first, which the "Completed orders are skipped" scenario's state diagram implies should not happen. That gap belongs to `fulfillment-management`, not this change's delta, and design.md records it as already raised as a defect against that capability during planning (SWHM-T-0199) — not a new finding from this QA pass.

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** All four of this ticket's acceptance criteria hold (PENDING → APPROVED/DENIED → COMPLETED transitions work; only PENDING orders are mutable and terminal states are immutable; approved orders generate supplier POs with shipping address and line items; both outcomes queue a notification), all 23 delta-spec scenarios pass, the full unit and E2E suites are green, and no defect was found.
