---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0015
idea: Not Applicable
branch: vortex/sprint/swhm-s-0015-3040cbce
upstream: [artifacts/SWHM-S-0015/SPRINT-PLAN.md, artifacts/SWHM-S-0015/qa-test-report.md]
---

# Sprint summary — SWHM-S-0015

## Tickets

| Ticket      | Type   | Title                                                                           | Outcome                                                                                                                |
| ----------- | ------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0169 | TASK   | Bugfix plan — SWHM-S-0015                                                       | DONE — root-caused both defects to one already-fixed fault; authored change `swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01` |
| SWHM-T-0165 | DEFECT | enter-order-information.tsx doesn't pass { orderId, email } to /order-completed | DONE — no fault found, no production diff (`SWHM-T-0165/fix-note.md`)                                                  |
| SWHM-T-0166 | DEFECT | Accepted gate bypass on SWHM-T-0162: Order journey in a browser                 | DONE — closed as resolved-by-duplicate of SWHM-T-0165 (`SWHM-T-0166/fix-note.md`)                                      |
| SWHM-T-0170 | TASK   | Integration QA report — SWHM-S-0015                                             | DONE — verdict PASS, no defects found                                                                                  |
| SWHM-T-0171 | TASK   | Sprint close bundle — SWHM-S-0015                                               | DONE — this file and `release-notes.md`                                                                                |

## What shipped

**No production code changed this sprint, and none needed to.** Both committed defects reported one fault — the order form navigating to `/order-completed` without the `{ orderId, email }` router state the confirmation screen renders from — and that fault was already fixed on this branch before the sprint began.

The fix arrived in commit `5d0bb64`, the SWHM-S-0014 squash this branch forks from. Both defect reports snapshotted that sprint's branch at `d6a16aa` while it was still in flight; the wiring landed after that snapshot and before SWHM-S-0014 merged. `git log -L 360,368:src/pages/enter-order-information.tsx` returns `5d0bb64` alone, so those lines were created already carrying the state argument.

What the sprint did deliver:

- **The spec gap that allowed the fault, closed.** The `order-placement` requirement _Order confirmation screen displays order ID and email_ had three scenarios, and every one of them began _after_ the handoff — "WHEN the confirmation screen is displayed". A `navigate("/order-completed")` that discarded the placement result satisfied all three while losing the data, which is why the original defect passed review and its own sprint's unit tier and was caught only by a browser assertion at the end. Change `swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01` MODIFIES that requirement to bind the confirmation to the placement that reached it, and adds three regression scenarios — the handoff, a second order's own identifier, and a confirmation screen reached with no result showing no placeholder.
- **Independent confirmation that the behaviour holds**, at three tiers and from three agents that did not share a run: the screen tier (SWHM-T-0165), the browser tier (SWHM-T-0166), and a clean-checkout re-run of both at integration QA.

Sprint goal "Bugfix — SWHM-T-0165, SWHM-T-0166" is met: both defects are resolved and verified closed.

**Root docs: all four deliberately unchanged.** The close criteria call for root-doc updates if the sprint changed observable behaviour. It changed none — zero production code moved — so no capability, topology, data-model, integration-point or design-system trigger fired, and there is nothing for `PRODUCT.md`, `ARCHITECTURE.md` or `DESIGN.md` to record. `AGENTS.md` is human-authored and is never rewritten by an agent.

## Divergence from plan

None in substance. The plan (SWHM-T-0169) predicted that both tickets would confirm their criteria and close with no diff, and that is exactly what both did.

One bookkeeping discrepancy, recorded so it is not read later as unfinished work: the change's `tasks.md` shows 8 of 9 checkboxes ticked, with item 1.3 ("Author the change … and both defects' `PLAN.md`", tagged SWHM-T-0169) still open. That work is complete — `proposal.md`, `design.md`, `specs/order-placement/spec.md`, `tasks.md` and both `PLAN.md` files are all present on this branch and were the input to every ticket that followed. The platform ticks a checkbox when its tagged ticket _merges_, and SWHM-T-0169 was a sprint-artifact ticket that commits straight to the sprint branch with no merge step, so no stamp ever fired for it. The two defect tickets, which did merge via PR #107 and #108, were stamped normally (`901f435`, `a46f22f`). This file does not edit `openspec/` to correct it — that directory is platform-owned at sprint close.

## Verification

**PASS.** See `artifacts/SWHM-S-0015/qa-test-report.md` — 577/577 unit tests, 37/37 E2E in a real browser, all 6 delta-spec scenarios verified pass, no defects found (`artifacts/SWHM-S-0015/integration-defects-resolution.md`, empty summary table).

QA re-ran the full gate stack from a clean checkout rather than accepting the tickets' own claims, which is what makes the "already fixed" finding a verified result rather than three agents agreeing with each other.

## Defects Raised

None. No DEFECT ticket was created during the sprint window (`a2a_list_tickets(type="defect", created_since=2026-09-16T19:00:00Z)` returned an empty list).

Three findings were recorded during planning that could **not** be filed as tickets — planning has no defect-creation authority by design. They live in the change's `proposal.md` under `## Follow-ups / out of scope`, which archives with the change at sprint close, so they are restated here in one line each to survive the move. None is a ticket; each needs triage to become one.

1. **The confirmation screen's state guard validates `orderId` but not `email`.** `src/pages/order-completed.tsx` checks `typeof value.orderId === "number"` and nothing else, so a state object carrying an identifier and no email renders the confirmation sentence with an empty address. Latent, not observed — the placement route always returns both fields — and it is the same shape of silent-omission failure this sprint's delta specifies against.
2. **`order-placement`'s spec of record still opens with a placeholder Purpose** ("TBD - created by archiving change swhm-i-0008-order-submission-checkout"). A delta cannot fix it: the text lives in `openspec/specs/`, which the platform owns at archive time. This is the fifth capability with the same placeholder, after the four recorded in SWHM-S-0010 and SWHM-S-0011.
3. **Conditional acceptance raised a duplicate of an already-refined defect.** SWHM-T-0166 was auto-raised for the same file and the same line as SWHM-T-0165, which was already filed and refined. The duplication was caught by a human note in the second report rather than by the mechanism that created it. This is a process finding, not a defect in this codebase.

## Retrospective

**What went well.**

- **Re-verifying the reports instead of trusting them is what made this sprint cheap.** Planning read the code first and found the fault already fixed; both implementation agents confirmed it independently; QA re-derived it from a clean checkout. Had any of them planned from the report alone, the likely outcome was an agent editing a correct `handleSubmit` to produce a diff — which is how a fixed defect becomes a new one.
- **SWHM-T-0165's agent proved its oracle rather than asserting it.** It temporarily reduced the navigation call to the defective `navigate("/order-completed")`, re-ran the caller-side assertion, watched it fail with the expected diff, then restored the file and confirmed `git diff` was empty. That is the difference between "the test passes" and "the test would have caught this" — the second is the only one that matters for a regression scenario, and it is rarely demonstrated.
- **The `depends_on` chain did its job.** SWHM-T-0166 closed as resolved-by-duplicate in a single step by reading SWHM-T-0165's outcome, instead of re-deriving the same finding at the same line.

**What could improve.**

- **This sprint should not have existed, and the cost was real:** five tickets and three agent dispatches to confirm that correct code is correct. The root cause is upstream of the codebase — both defects were filed against a mid-sprint branch snapshot (`d6a16aa`) of work that was completed before that sprint landed. A defect report that recorded the commit SHA it was observed at, and a triage step that checked whether that SHA is still reachable and current before committing the defect to a sprint, would have caught both at zero dispatch cost. The branch in question had already been deleted at land, which is itself the signal.
- **Duplicate detection at the point of raising, not the point of reading.** SWHM-T-0166 was machine-raised against a file and line that an open, already-refined defect named. Checking open defects against the file and line being raised against would have collapsed two dispatches into one.
- **A checkbox tagged to a sprint-artifact ticket can never be ticked.** The platform stamps `tasks.md` on ticket _merge_, and planning and close-bundle tickets commit straight to the sprint branch with no merge, so any work item tagged to one stays open regardless of whether it was done (see § Divergence from plan). The archived change will show item 1.3 outstanding forever. Either those items should not be tagged to a non-merging ticket, or the stamp needs a second trigger on direct-to-sprint commits.
- **The deeper lesson is about scenario shape, and it generalises past this sprint.** Every scenario for this requirement began after the handoff, so the seam between two correct components was specified by nobody and tested by nothing but an end-to-end assertion written late. When a behaviour spans a handoff, at least one scenario should start on the _upstream_ side of it.

## Compliance / Control Evidence

| Control / policy                      | Evidence produced                                                       | Location                                                                           | Status    | Exception                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| Change verified before release        | QA report, PASS verdict, independent clean-checkout re-run              | `artifacts/SWHM-S-0015/qa-test-report.md`                                          | Satisfied | —                                                                            |
| Tests executed                        | 577/577 unit, 37/37 E2E, per-spec table                                 | `artifacts/SWHM-S-0015/integration-test-result.md`                                 | Satisfied | —                                                                            |
| Defects dispositioned                 | 2 committed, both confirmed resolved with no diff; 0 found at QA        | `artifacts/SWHM-S-0015/integration-defects-resolution.md`                          | Satisfied | —                                                                            |
| Change reviewed before merge          | PR review records                                                       | PR #107 (SWHM-T-0165), #108 (SWHM-T-0166), #109 (SWHM-T-0170)                      | Satisfied | —                                                                            |
| Behaviour contract recorded           | MODIFIED requirement + 3 regression scenarios, all 6 scenarios verified | change `swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01`, `specs/order-placement/spec.md` | Satisfied | —                                                                            |
| Root docs reflect delivered behaviour | No observable behaviour changed; no trigger fired                       | this file, § What shipped                                                          | Satisfied | —                                                                            |
| Open findings carried forward         | 3 unfiled findings restated by hand                                     | this file, § Defects Raised                                                        | Satisfied | Planning cannot create DEFECT tickets; they require triage to become tickets |
