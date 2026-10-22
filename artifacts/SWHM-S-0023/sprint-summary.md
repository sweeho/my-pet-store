---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0023
idea: swhm-s-0023-bugfix-swhm-t-0096-inspector
branch: vortex/sprint/swhm-s-0023-8ac9cbb9
upstream: [artifacts/SWHM-S-0023/SPRINT-PLAN.md, artifacts/SWHM-S-0023/qa-test-report.md]
downstream: [artifacts/SWHM-S-0023/release-notes.md]
---

# Sprint summary — SWHM-S-0023

**Goal:** Bugfix — SWHM-T-0096: Inspector teardown left staging data behind on scope whole-app with no ledger entries (change `swhm-s-0023-bugfix-swhm-t-0096-inspector`). **Verdict: not met by a fix. The defect was diagnosed and deferred, because its fix site is the Vortex inspection platform and not this repository.**

## Tickets

| Ticket      | Type   | Title                                                                        | Outcome                                                                                                   |
| ----------- | ------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| SWHM-T-0245 | TASK   | Bugfix plan — SWHM-S-0023                                                    | DONE. Root cause verified against the platform's inspection records; change authored and strict-validated |
| SWHM-T-0096 | DEFECT | Inspector teardown left staging data behind on scope whole-app, empty ledger | DEFERRED. Diagnosed in full; no commit here can fix it. See § Known Issues                                |
| SWHM-T-0246 | TASK   | Integration QA report — SWHM-S-0023                                          | DONE. PASS, no defects found                                                                              |
| SWHM-T-0247 | TASK   | Sprint close bundle — SWHM-S-0023                                            | IN_PROGRESS at the time of writing (this file and `release-notes.md`)                                     |

## What shipped

No product change. The sprint branch adds only planning and QA artifacts, plus an OpenSpec change that declares no spec delta (`skip_specs: true`). Nothing the store does is different.

What the sprint did produce is a corrected diagnosis, recorded in the change's `design.md` (F1 to F5):

- The staging ledger was not lost on a failure path. It has never held a row for this project, across all four `teardown_failed` runs. The report's claim that run `6b614cd3` lists entries was false.
- The leftover data came from the inspector submitting the storefront's sign-up and profile forms in the browser. Those writes go through no staging tool, so the ledger could not record them. They landed in a Projector preview database that is now unreachable and superseded.
- None of the four runs filed a finding caused by leftover data, so the expected harm (wrong defects in the backlog) did not happen.

The platform-side fix shape is design.md D4: do not report `teardown_failed` when the ledger is empty; record browser-observed writes or isolate each run's data store; write ledger entries ahead of the staged item.

## Divergence from plan

None. The plan was to diagnose and defer, and that is what happened. No implementation dispatch was spent.

## Verification

PASS, no defects found. This was a regression run of the unchanged product: lint, typecheck and 902 unit tests in 133 files, plus 47 Playwright tests. See `artifacts/SWHM-S-0023/qa-test-report.md` and `artifacts/SWHM-S-0023/integration-test-result.md`. The change has no scenarios, so QA recorded a single not-testable placeholder verdict.

## Known Issues

The sprint did not close on a conditional approval. This section is included because the committed defect leaves the sprint unfixed.

- **SWHM-T-0096**: the inspector reports `teardown_failed` with an empty staging ledger, and records nothing for data it creates through the product's UI. As a result, a later inspection can find accounts it did not create. The owner is the Vortex inspection platform. The diagnosis is in `artifacts/SWHM-S-0023/SWHM-T-0096/PLAN.md` and the fix shape is in the change's design D4. Status: DEFERRED, re-openable against the platform repository.

## Defects Raised

None. No DEFECT ticket was created during this sprint's window.

The change records one open question rather than a ticket: whether the inspector should sign in with a pre-provisioned test account (its `test_credential_ref`) instead of creating one each run (O1). It is an operator configuration decision.

## Retrospective

**Went well**

- Every claim in the report was checked against the platform's own records before anything was planned. That showed two of the report's premises to be false, and it turned "fix the ledger write on the failure path" into a different and more accurate problem statement.
- Deferring at planning, following the SWHM-T-0235 precedent, cost one planning run and no implementation run.
- The strict-validation requirement for a delta was met honestly with the CLI's own `skip_specs` marker. The alternative was inventing a product requirement to pass the gate.

**Could improve**

- This is the second sprint in a row (after SWHM-S-0022) whose goal named a defect that this repository structurally cannot fix. With no route for filing a defect against the platform, triage puts these into product bugfix sprints, and those sprints can only end with a deferral.
- The defect waited five weeks (filed 2026-09-15) before anyone checked it. By then the preview it described was gone, so the leftovers can no longer be inspected first-hand. Checking out-of-repo defects at triage time would keep their evidence alive.
- The report relayed the Scheduler's claim about the `6b614cd3` ledger without checking it. Relayed diagnostics should be marked as unverified until they are checked.

## Compliance / Control Evidence

| Control                                          | Evidence produced                                         | Location                                                                  | Status    | Exception                                                            |
| ------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------- |
| Defect root-caused before disposition            | Verified findings F1 to F5, decisions D1 to D4            | `openspec/changes/swhm-s-0023-bugfix-swhm-t-0096-inspector/`              | Satisfied | —                                                                    |
| Change verified before release                   | QA report, PASS                                           | `artifacts/SWHM-S-0023/qa-test-report.md`                                 | Satisfied | No scenarios exist to verify (`skip_specs`)                          |
| Tests executed, not merely configured            | 902 unit and 47 E2E passing on the sprint branch          | `artifacts/SWHM-S-0023/integration-test-result.md`                        | Satisfied | —                                                                    |
| Defects dispositioned                            | 0 fixed, 1 deferred with a recorded reason, 0 found at QA | `artifacts/SWHM-S-0023/integration-defects-resolution.md`, § Known Issues | Satisfied | SWHM-T-0096 closes the sprint unfixed, by decision                   |
| Standing documentation matches shipped behaviour | No behaviour changed; root docs left unchanged            | repository root                                                           | Satisfied | —                                                                    |
| Every ticket traceable to a work item            | `tasks.md` checkboxes tagged with their owning ticket key | `openspec/changes/swhm-s-0023-bugfix-swhm-t-0096-inspector/tasks.md`      | Satisfied | 2.1 stays unticked because SWHM-T-0096 was deferred and never merged |
