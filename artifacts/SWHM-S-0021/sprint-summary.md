---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0021
idea: SWHM-I-0014
branch: vortex/sprint/swhm-s-0021-5e503761
upstream: [artifacts/SWHM-S-0021/SPRINT-PLAN.md, artifacts/SWHM-S-0021/qa-test-report.md]
downstream: [artifacts/SWHM-S-0021/release-notes.md]
---

# Sprint summary — SWHM-S-0021

**Goal:** Consistent look and site navigation across every screen (idea SWHM-I-0014, change `swhm-i-0014-consistent-look-and-site-nav`). **Verdict: met.**

## Tickets

| Ticket      | Type  | Title                                                              | Outcome                                                                                                                    |
| ----------- | ----- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0231 | TASK  | Sprint plan — SWHM-S-0021                                          | DONE — change authored, three implementation tickets decomposed, design blocks exported to `artifacts/SWHM-S-0021/design/` |
| SWHM-T-0232 | EPIC  | Consistent look and site navigation across every screen            | DONE (container, closed by rollup)                                                                                         |
| SWHM-T-0233 | STORY | Every screen carries the same header and the same design system    | DONE (container, closed by rollup)                                                                                         |
| SWHM-T-0236 | TASK  | Shared StoreHeader and the session role contract                   | DONE — `SWHM-T-0236/summary.md`                                                                                            |
| SWHM-T-0237 | TASK  | Header, tokens and shared width across the customer-facing screens | DONE — `SWHM-T-0237/summary.md`                                                                                            |
| SWHM-T-0238 | TASK  | AdminShell on the shared header, and the route guards' column      | DONE — `SWHM-T-0238/summary.md`                                                                                            |
| SWHM-T-0240 | TASK  | Integration QA report — SWHM-S-0021                                | DONE — PASS, one defect found and fixed in place                                                                           |
| SWHM-T-0241 | TASK  | Sprint close bundle — SWHM-S-0021                                  | IN_PROGRESS at the time of writing — this file and `release-notes.md`; reaches DONE on their merge                         |

## What shipped

`StoreHeader` (`src/components/StoreHeader.tsx`) now renders on every routable screen except the four sign-on cards, in two variants — the store variant on the twelve customer-facing screens, the administration variant inside `AdminShell` on the seven administration and supplier screens. It carries the store mark, Catalog, Cart with its line count, and an identity block that shows Sign in, or the username with My account and Sign out, or — for an identity holding the administrator role — an Admin link ahead of the username. It shows none of the three until `GET /api/signon/session` answers, so nobody sees the wrong one first. That endpoint gained a `role` field (SWHM-T-0236) rather than the header probing `GET /api/signon/check`, whose side effect would have moved where a visitor lands after signing in.

The home and About pages moved off the generated template's dark palette onto the project's own design tokens, and the home page's bespoke navigation bar and `@headlessui/react` mobile dialog were replaced by the shared header (SWHM-T-0237). Every screen's content now sits in one of two shared column widths declared once in `src/components/layout.ts`, replacing the six widths the proposal counted — including `/enter-order-information`'s 1160px, whose form re-flowed to two columns with a full-width order summary. Two repository-level conformance tests (`src/layout-width.test.ts`, `src/palette-classes.test.ts`) hold both of those properties for every screen added later.

All 38 scenarios across the change's two delta specs verify pass. Unit suite 901 passing across 132 files; E2E 45 passing; lint, typecheck and build green.

## Divergence from plan

- **D1 — two shared column widths shipped, not one.** The idea's criterion asks for one; the mockups specify 672px for the store and 832px for administration. Resolved in favour of the mockups at planning time and recorded in the change's `design.md` (D6, O4), but never written back onto the idea, so the shipped behaviour reads as a divergence from the acceptance-criterion text while matching the design of record.
- **D2 — one planning error, found and fixed at QA.** SWHM-T-0238's AC-8 and its `PLAN.md` step 4 moved _both_ route guards' pending states onto the administration width, though `RequireSignOn` guards only customer screens. The implementer flagged the tension against `design.md` F8/D6 rather than resolving it silently; QA confirmed it the other way and fixed it in place (DEFECT-1). No ticket re-opened.
- **D3 — phase 5 (CI) required no change.** The existing workflows already trigger on `vortex/**` pushes and pull requests; verified under SWHM-T-0236 (tasks.md 6.1) rather than creating a ticket.
- **D4 — minor, recorded by the implementer.** `signon-welcome.tsx`'s content component became a named export to match the pattern its four sibling guarded pages already use. No interface contract or ownership map changed.
- `@heroicons/react` is now a declared dependency with no consumer. Left installed deliberately — removing it is a decision nobody has taken; recorded in ARCHITECTURE.md § Stack.

## Verification

PASS. See `artifacts/SWHM-S-0021/qa-test-report.md` for the scenario-by-scenario verdicts and the gate output, and `artifacts/SWHM-S-0021/integration-test-result.md` for the browser tier. One defect was found during AC verification and fixed in place — `artifacts/SWHM-S-0021/integration-defects-resolution.md`, DEFECT-1. None escalated, none deferred to a future sprint.

## Defects Raised

| Ticket      | Description                                                                                                                                                                                  | Filed by               | Status now         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------ |
| SWHM-T-0235 | Control-initiated `a2a_assign_ticket` dispatch omits `VORTEX_A2A_CODEBASE_ID` from the run's A2A binding — platform defect, not product code. P1                                             | planning (SWHM-T-0231) | REFINED, no sprint |
| SWHM-T-0239 | `/NotFound` and `/RootErrorBoundary` are reachable as public screens; typing `/RootErrorBoundary` renders a bare "An error occurred" page. P3, out of this change's scope (design.md O2/F13) | planning (SWHM-T-0231) | REFINED, no sprint |

DEFECT-1 is not listed here — it was found and resolved inside integration QA and never became a ticket.

## Retrospective

**Went well**

- The fixed interface contract for `StoreHeader` (`variant` plus a trailing `children` slot), settled in `design.md` before any ticket was dispatched, was consumed verbatim by both downstream tickets across roughly twenty page files with no rework and no renegotiation.
- The two conformance tests from `design.md` D11 turn "one column width" and "no raw palette classes" from a review judgement into a standing repository guard. A screen added in a later sprint that declares its own width now fails the unit suite rather than being noticed by eye.
- SWHM-T-0238's implementer flagged the route-guard width tension in `summary.md` instead of quietly picking one reading. That is the only reason DEFECT-1 took one QA round rather than surviving the sprint.

**Could improve**

- DEFECT-1 originated in planning, not implementation: a ticket AC contradicted the change's own design note, and nothing between the plan checklist and dispatch compares the two. An AC that restates a design decision is where a transcription error lands.
- The idea's "one shared column width" criterion was reconciled to two widths inside `design.md` and left unreconciled on the idea itself. Deciding against an acceptance criterion is legitimate; leaving the criterion standing means QA has to re-derive the decision from a design note to judge the sprint.
- All three implementation containers again hit the documented missing-Chromium preflight, so the 375px header assertion written under SWHM-T-0237 (AC-7) was first executed at integration QA. The assertion passed, but the tier that observes CSS overlap ran once, at the end, rather than beside the work that needed it.

## Compliance / Control Evidence

| Control                                          | Evidence produced                                                                                                | Location                                                                                     | Status    | Exception                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| Change specified before implementation           | OpenSpec change — proposal, design, two delta specs, tagged task list                                            | `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/`                                 | Satisfied | —                                                                                                                 |
| Change verified before release                   | QA report, PASS, 38/38 scenarios                                                                                 | `artifacts/SWHM-S-0021/qa-test-report.md`                                                    | Satisfied | —                                                                                                                 |
| Tests executed, not merely configured            | `TDD-RESULT` markers per ticket; `E2E-RESULT: chromium 45 passed, 0 failed, 0 skipped`                           | `artifacts/SWHM-S-0021/SWHM-T-023{6,7,8}/tdd-test-result.md`, `…/integration-test-result.md` | Satisfied | Browser tier ran in CI and at QA, not in the implementation containers — `AGENTS.md` § Notes from previous agents |
| Defects dispositioned                            | 1 found at QA, 1 fixed in place, 0 open                                                                          | `artifacts/SWHM-S-0021/integration-defects-resolution.md`                                    | Satisfied | —                                                                                                                 |
| Out-of-scope findings recorded, not dropped      | 2 DEFECT tickets raised during the sprint window                                                                 | § Defects Raised above                                                                       | Satisfied | Both carry no sprint; disposition is Triage's after close                                                         |
| Standing documentation matches shipped behaviour | ARCHITECTURE.md § Cross-cutting constraints + § Key Decisions, DESIGN.md § Page frame, PRODUCT.md capability map | repository root                                                                              | Satisfied | —                                                                                                                 |
| Every merged ticket traceable to a work item     | `tasks.md` checkboxes tagged with their owning ticket key, stamped on merge                                      | `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/tasks.md`                         | Satisfied | —                                                                                                                 |
