---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0022
idea: swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02
branch: vortex/sprint/swhm-s-0022-75bc2a59
upstream: [artifacts/SWHM-S-0022/SPRINT-PLAN.md, artifacts/SWHM-S-0022/qa-test-report.md]
downstream: [artifacts/SWHM-S-0022/release-notes.md]
---

# Sprint summary — SWHM-S-0022

**Goal:** Bugfix — SWHM-T-0235, SWHM-T-0239 (change `swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02`). **Verdict: met for one of the two defects; the other was diagnosed and deferred because its fix site is outside this repository.**

## Tickets

| Ticket      | Type   | Title                                                                | Outcome                                                                                            |
| ----------- | ------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| SWHM-T-0242 | TASK   | Bugfix plan — SWHM-S-0022                                            | DONE — both defects root-caused, change authored and strict-validated, per-defect plans committed  |
| SWHM-T-0239 | DEFECT | `/NotFound` and `/RootErrorBoundary` are reachable as public screens | DONE — `SWHM-T-0239/fix-note.md`                                                                   |
| SWHM-T-0235 | DEFECT | Dispatch omits `VORTEX_A2A_CODEBASE_ID` from the run's A2A binding   | DEFERRED — diagnosed in full; no commit in this repository can fix it. See § Known Issues          |
| SWHM-T-0243 | TASK   | Integration QA report — SWHM-S-0022                                  | DONE — PASS, no defects found                                                                      |
| SWHM-T-0244 | TASK   | Sprint close bundle — SWHM-S-0022                                    | IN_PROGRESS at the time of writing — this file and `release-notes.md`; reaches DONE on their merge |

## What shipped

`NotFound.tsx` and `RootErrorBoundary.tsx` are excluded from `vite-plugin-pages`' route generation, so `/NotFound` and `/RootErrorBoundary` are no longer addresses. Both paths now fall through to the catch-all and render the not-found screen, which keeps its single address. The fix is a four-line addition to `Pages({ exclude })` in `vite.config.ts` plus a comment, following the `UnavailableInLanguage.tsx` precedent; neither page component was edited or moved, and `src/pages/[...all].tsx`'s re-export was left untouched as the ticket's fixed interface contract required.

The class of fault is closed by `src/page-routes.test.ts`, a checked-in inventory: every non-test `.tsx` under `src/pages/` must be recorded as an intended screen or named in the config's exclude list, and an unclassified one fails the unit suite naming the file. `ARCHITECTURE.md` § Routing changed with it — the frontend now does list its routes somewhere, deliberately — and the inventory is recorded as a Key Decision because every later screen and every later component placed in that directory inherits it.

All eight scenarios of the delta spec's modified requirement verify pass. Unit suite 902 passing across 133 files; E2E 47 passing; lint, typecheck and build green.

## Divergence from plan

- **D1 — only one of the two named defects was fixed.** SWHM-T-0235 was deferred during planning rather than dispatched: `/app/packages/core` is an unpacked runtime install with no git repository, remote or CI, and the call that actually drops the context (`wakeAssignedAgentsActivity`) is in the Temporal worker package, which is not in the image at all. An implementation run on it could only have ended blocked. The sprint goal names it, so the shortfall is recorded here rather than absorbed.
- **D2 — SWHM-T-0239's three planned steps landed exactly as specified**, in the files its ownership map named and no others. No interface contract moved, and the implementer raised no plan revision.
- **D3 — the fix reached DONE with its primary regression test unexecuted.** SWHM-T-0239's container had no Chromium, so the new Playwright assertions — the only tier that can observe file-based routing at all — were committed and recorded `Pending Verification` rather than run. Integration QA installed a browser and executed them; they pass. Recorded because the gap was real at the moment the ticket merged, not because the outcome changed.

## Verification

PASS, no defects found. See `artifacts/SWHM-S-0022/qa-test-report.md` for the scenario verdicts and the gate output, and `artifacts/SWHM-S-0022/integration-test-result.md` for the browser tier. `artifacts/SWHM-S-0022/integration-defects-resolution.md` records an empty defect list.

## Known Issues

Included although the sprint closed on a clean PASS rather than a conditional approval: one committed defect leaves this sprint unfixed, and the section exists so that fact survives the sprint's closure.

- **SWHM-T-0235** — a run dispatched by a Control-initiated `a2a_assign_ticket` carries no codebase context, so every project-scoped `vortex_a2a` tool in that run refuses and `a2a_send_message` fails with a raw Postgres uuid error. Verified line by line against `@vortex/core@7.2.0`; the fix belongs to the platform repository, not this one. The finished diagnosis, the three-part fix shape and the mitigation available today (dispatch FSM roles through the scheduler's own sweep rather than a manual assign) are in `artifacts/SWHM-S-0022/SWHM-T-0235/PLAN.md`. Status: DEFERRED, re-openable.

## Defects Raised

None. No DEFECT ticket was created during this sprint's window.

Two findings were recorded as open questions in the change rather than filed, because planning holds no defect-creation authority: `RootErrorBoundary.tsx` is dead code that nothing renders (O1), and `src/App.md` documents an `errorElement` wiring the application has never used (O2).

## Retrospective

**Went well**

- The defect was reproduced by measurement rather than inference. With no browser in the planning container, building the app and reading the generated route table out of the client bundle produced the literal route list — `NotFound` and `RootErrorBoundary` present, `UnavailableInLanguage` absent — which both confirmed the fault and demonstrated the fix shape in one step. The implementer re-ran the same check rather than taking the finding on trust.
- Deferring SWHM-T-0235 at planning instead of dispatching it saved a run that could only have ended blocked, and the sprint still closed clean on the half that was fixable. The cost of the decision was one planning investigation; the cost of the alternative would have been that plus a stranded implementation run.
- The fix followed an existing in-repo precedent instead of inventing a mechanism, which is why it is four lines and a comment. The part that took judgement was not the fix but the guard.

**Could improve**

- A platform defect was committed to a product sprint because triage had no other route for it. The sprint goal then named a defect this repository structurally cannot fix, and the only available outcome was a deferral. Somewhere to file a defect against the platform, separate from a product sprint's backlog, would have kept this sprint's goal honest.
- Third consecutive sprint in which the implementation container has no Chromium. It mattered more here than usual: for this defect the browser tier was not a supplementary check but the only tier that could assert the reported bug, so the fix merged with its primary regression test written and unrun. The gap closed at QA, but it closed after the merge rather than before it.
- The route inventory is maintained by hand and nothing yet measures whether it drifts. It is the right guard for a fault class that has now bitten twice — the template's `/users` screens, and these two — but a line per new screen is a standing tax, and the first sign it is not being paid will be a stale inventory rather than a failing test.

## Compliance / Control Evidence

| Control                                          | Evidence produced                                                   | Location                                                                               | Status    | Exception                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Defect root-caused before fix                    | Verified findings and decisions, both defects                       | `openspec/changes/swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02/`                           | Satisfied | —                                                                                                                                 |
| Change verified before release                   | QA report, PASS, 8/8 scenarios of the modified requirement          | `artifacts/SWHM-S-0022/qa-test-report.md`                                              | Satisfied | —                                                                                                                                 |
| Tests executed, not merely configured            | `TDD-RESULT: 902 passed, 0 failed`; `E2E-RESULT` 47 passed          | `artifacts/SWHM-S-0022/SWHM-T-0239/tdd-test-result.md`, `…/integration-test-result.md` | Satisfied | The browser assertions were `Pending Verification` at ticket merge and executed at integration QA — see § Divergence from plan D3 |
| Defects dispositioned                            | 1 fixed, 1 deferred with a recorded reason, 0 found at QA           | `artifacts/SWHM-S-0022/integration-defects-resolution.md`, § Known Issues              | Satisfied | SWHM-T-0235 closes the sprint unfixed, by decision, recorded in § Known Issues                                                    |
| Regression pinned against recurrence             | New browser-tier assertions plus a repository-level inventory guard | `e2e/legacy-routes.spec.ts`, `src/page-routes.test.ts`                                 | Satisfied | —                                                                                                                                 |
| Standing documentation matches shipped behaviour | ARCHITECTURE.md § Routing and § Key Decisions                       | repository root                                                                        | Satisfied | —                                                                                                                                 |
| Every merged ticket traceable to a work item     | `tasks.md` checkboxes tagged with their owning ticket key           | `openspec/changes/swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02/tasks.md`                   | Satisfied | 3.1 stays unticked — SWHM-T-0235 was deferred and never merged                                                                    |
