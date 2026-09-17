---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0019
idea: Not Applicable
branch: vortex/sprint/swhm-s-0019-7bf1d6c1
upstream: [artifacts/SWHM-S-0019/SPRINT-PLAN.md, artifacts/SWHM-S-0019/qa-test-report.md]
downstream: [artifacts/SWHM-S-0019/release-notes.md]
---

# Sprint summary — SWHM-S-0019

Idea is `Not Applicable`: this sprint was raised from a triaged defect, not from an idea, so it carries one change for the batch rather than one per idea.

## Tickets

| Ticket      | Type   | Title                                                    | Outcome                                                                                        |
| ----------- | ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| SWHM-T-0218 | TASK   | Bugfix plan — SWHM-S-0019                                | DONE — change `swhm-s-0019-bugfix-swhm-t-0214-fulfilmen` and `SWHM-T-0214/PLAN.md` (`f8c8a9f`) |
| SWHM-T-0214 | DEFECT | Fulfilment completes an order without requiring APPROVED | DONE — fixed and merged (`00a1a10`, PR #141); see `SWHM-T-0214/fix-note.md`                    |
| SWHM-T-0219 | TASK   | Integration QA report — SWHM-S-0019                      | DONE — PASS on first verification (`9e7eaf9`, PR #142)                                         |
| SWHM-T-0220 | TASK   | Sprint close bundle — SWHM-S-0019                        | DONE — this file and `release-notes.md`                                                        |

## What shipped

Sprint goal met. Fulfilment now acts only on an APPROVED order: `fulfillment/status.ts` exports `isFulfillable`, the one place the rule is written, and both `markOrderCompleted` and `processOrder` decide through it. A PENDING or DENIED order leaves a fulfilment run with its status, its line items' shipped quantities and its inventory exactly as they went in, and with no invoice. An unknown order id is still reported as not found rather than as not approved, so the endpoint still answers 404.

The spec of record gained what was missing rather than only the code being corrected: `fulfillment-management` has a new requirement stating the approval gate — never specified, because when the capability was written every order that existed could be fulfilled — and its completion requirement now names APPROVED as the status COMPLETED is reached from. Three tiers of regression coverage were added or corrected (`fulfillment/status.test.ts`, `fulfillment/fulfillment.test.ts`, `routes/api/fulfillment/process.post.test.ts`, `e2e/fulfillment.spec.ts`).

## Divergence from plan

Two, both decided during planning and neither costing a dispatch.

The fix is larger than the defect report scoped it. The report was about the status write. Executing the code showed a DENIED order is **fulfilled** — line shipped, inventory 100 → 95, invoice returned — so gating only `markOrderCompleted` would have left a state strictly worse than the bug: goods gone, order reading DENIED. The gate was therefore placed at the top of the fulfilment pass as well (change `design.md` D2).

`ARCHITECTURE.md` was updated, which a bugfix sprint usually does not do. The invariant this change establishes binds work beyond it, so it earned one `## Key Decisions` bullet. Two `## Integration points` sentences were corrected at the same time: they described the supplier purchase order as a row the fulfilment capability reads, and fulfilment reads `orders` and `order_line_item` directly — it does not read that table at all.

## Verification

PASS, on first verification of the integrated sprint branch, with no fix-in-place rounds. Unit 826/826, E2E 45/45 with zero skips, build clean, and all seven delta scenarios carrying a `SCENARIO-VERDICT: … — pass`. Detail in `artifacts/SWHM-S-0019/qa-test-report.md`; defect disposition in `artifacts/SWHM-S-0019/integration-defects-resolution.md` (none found).

## Defects Raised

None. No DEFECT was created during the sprint window (started 2026-09-17T07:00Z), confirmed by `a2a_list_tickets(type="defect", created_since=…)` — the only defect it returns is SWHM-T-0214 itself, filed at 04:17Z before the sprint existed and delivered as its scope.

Three findings were recorded instead of filed, under `## Follow-ups / out of scope` in the change's `proposal.md`, because planning has no defect-creation authority: an auto-approved order never gets a supplier PO row; the seeded `jps_admin` account has no profile row, so every order it places is PENDING regardless of amount; and `fulfillment-management` and `order-approval` still open with `TBD` Purpose placeholders a delta cannot reach.

## Retrospective

**Went well — reproducing the defect rather than reading it changed the fix.** The triage report was accurate and incomplete. Running the real functions surfaced the inventory deduction, which is what moved the guard from the last step of the pass to its first. A fix scoped to the report would have shipped a coherent-looking change that still shipped denied orders' goods.

**Went well — the plan predicted the one failure no local tier could report.** `e2e/fulfillment.spec.ts` places its order as `jps_admin`, which has no `profiles` row, so the locale is null and auto-approval never fires: that order is PENDING, and after the fix the journey correctly fulfils nothing. Planning traced that through `order/order.ts`, `db/client.ts` and `account/customer.ts` and carried it as AC-8, so implementation added the approval step in the same commit. Found at integration QA instead, it would have read as a regression in a green sprint, in the one tier the engineer container cannot run.

**Went well — a positive test instead of a longer exclusion list.** The bug existed because `status === null || status === "COMPLETED"` was complete on the day it was written and was never re-read when the workflow gained two statuses. `isFulfillable` is correct for statuses that do not exist yet, which is why the same class of defect cannot recur here.

**Could improve — the Playwright browser cache in the validation container was stale.** The preflight found `chromium-1223` where `@playwright/test@1.50.1` expects `chromium-1155`, costing an install mid-run (`integration-test-result.md` § Environment). Correctly judged an image/version mismatch rather than a sprint defect and not filed, but it is environment drift that will recur on every sprint until the image and the pinned Playwright version are reconciled.

**Could improve — the spec gap was structural and nothing was watching for it.** `swhm-i-0011` added an approval gate in front of fulfilment and correctly changed nothing under `fulfillment/`, because no requirement in its delta governed that transition. Both capabilities' specs were individually correct and the product was wrong between them. Nothing in the pipeline asks "which existing capability's assumptions did this change invalidate", and a sprint that adds a state to an entity another capability already reads is exactly where to ask it.

## Compliance / Control Evidence

| Control                                | Evidence                                                                                                      | Location                                                                                                   | Status         | Exception                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Change specified before implementation | Change with proposal, design, delta specs and tagged task list; `validate --strict` passing                   | `openspec/changes/swhm-s-0019-bugfix-swhm-t-0214-fulfilmen/`                                               | Satisfied      | —                                                                                                                 |
| Change reviewed before merge           | Ticket PRs merged to the sprint branch                                                                        | PR #141 (SWHM-T-0214), PR #142 (SWHM-T-0219)                                                               | Satisfied      | —                                                                                                                 |
| Tests executed                         | `bun run verify` 826/826, `bun run test:e2e` 45/45, build exit 0, with real output recorded                   | `artifacts/SWHM-S-0019/integration-test-result.md`, `artifacts/SWHM-S-0019/SWHM-T-0214/tdd-test-result.md` | Satisfied      | —                                                                                                                 |
| Change verified before release         | QA report, PASS verdict, seven scenario verdicts                                                              | `artifacts/SWHM-S-0019/qa-test-report.md`                                                                  | Satisfied      | —                                                                                                                 |
| Defects dispositioned                  | None found at integration QA; none raised during the sprint window                                            | `artifacts/SWHM-S-0019/integration-defects-resolution.md`                                                  | Satisfied      | —                                                                                                                 |
| Requirement traceability               | AC-1…AC-8 on SWHM-T-0214 derived one-for-one from the delta's scenarios; regression tests named per criterion | `artifacts/SWHM-S-0019/SWHM-T-0214/PLAN.md`, `artifacts/SWHM-S-0019/SWHM-T-0214/fix-note.md`               | Satisfied      | —                                                                                                                 |
| Test coverage measured                 | No coverage tool is declared in this project                                                                  | —                                                                                                          | Not Applicable | No `test:coverage` script and no `coverage` block in `vitest.config.ts`; stating a percentage would be fabricated |
