---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0003
idea: SWHM-I-0003
branch: vortex/sprint/swhm-s-0003-849ec4ef
upstream:
  [
    openspec/changes/swhm-i-0003-customer-account-profile-man/proposal.md,
    openspec/changes/swhm-i-0003-customer-account-profile-man/tasks.md,
    artifacts/SWHM-S-0003/qa-test-report.md,
  ]
downstream: [artifacts/SWHM-S-0003/release-notes.md]
---

# Sprint summary — SWHM-S-0003

Sprint goal: **SWHM-I-0003: Customer Account & Profile Management**. Type: ENHANCEMENT. Spec-driven, change `swhm-i-0003-customer-account-profile-man`.

## Tickets

| Ticket      | Type  | Title                                               | Outcome                                                                         |
| ----------- | ----- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| SWHM-T-0031 | TASK  | Sprint plan — SWHM-S-0003                           | DONE — change rewritten for this stack, 3 TASK plans, INTERFACES, design export |
| SWHM-T-0032 | EPIC  | Customer Account & Profile Management               | DONE — closed by rollup                                                         |
| SWHM-T-0033 | STORY | Customer account profile — storage, API and screens | DONE — closed by rollup                                                         |
| SWHM-T-0034 | TASK  | Account data model and duplicate-account rejection  | DONE — merged as `5f483bc`; `artifacts/SWHM-S-0003/SWHM-T-0034/summary.md`      |
| SWHM-T-0035 | TASK  | Customer account API                                | DONE — merged as `8e2dfef`; `artifacts/SWHM-S-0003/SWHM-T-0035/summary.md`      |
| SWHM-T-0036 | TASK  | Customer profile screens and language preference    | DONE — merged as `5f97dc8`; `artifacts/SWHM-S-0003/SWHM-T-0036/summary.md`      |
| SWHM-T-0039 | TASK  | Integration QA report — SWHM-S-0003                 | DONE — merged as `f3f7fb5`; verdict PASS                                        |
| SWHM-T-0040 | TASK  | Sprint close bundle — SWHM-S-0003                   | DONE — this file and `release-notes.md`                                         |

## What shipped

The `account-management` capability, in one STORY of three sequenced TASKs: six 1:1 tables keyed on `user_name` (`customers`, `accounts`, `profiles`, `contact_info`, `addresses`, `card_metadata`) with the `account/` capability module over them, `GET`/`PUT /api/customer` scoped to the signed-on session, and `/customer` turned from the SWHM-S-0002 placeholder into the real profile screen — a read-only view built to the idea's wireframe plus an edit form over the same data.

All three of idea SWHM-I-0003's acceptance criteria hold on the integrated branch, and all 33 `tasks.md` checkboxes are ticked. The duplicate-account criterion was a live defect in the shipped code at sprint start — `auth/validation.ts` checked length and characters only, so a repeat registration surfaced a raw SQLite primary-key error — and is now a descriptive `CreateUserError` on the existing route. Sprint goal met.

## Divergence from plan

- No `artifacts/SWHM-S-0003/SPRINT-PLAN.md` was generated for this sprint, unlike SWHM-S-0002's. The plan of record is therefore the change itself (`proposal.md`, `design.md`, `tasks.md`) plus `INTERFACES.md` and `SPEC-DISCREPANCIES.md`, which is where this sprint's decisions were authored in any case. Observation, not a delivery gap — no planned work is missing.
- Planning's artifacts were first pushed to `origin/vortex/ticket/swhm-t-0031` rather than to the sprint branch. SWHM-T-0034 found the commit was a direct child of its fork point and fast-forwarded it in unchanged (`fd1c86f`, same hash), so nothing was re-authored. Recorded in that ticket's summary § Notes.
- Three minor, additive ticket-level deviations, each recorded by the ticket that made it: `tsconfig.node.json` gained `"account"` (SWHM-T-0034, same shape as SWHM-T-0018's `"auth"`); the API's 400/401 bodies use `setResponseStatus` rather than `createError`, because `createError`'s serialization would not match the fixed `{ error: string }` contract (SWHM-T-0035); the nullable category and card-type selects carry a placeholder option beyond the vocabulary values (SWHM-T-0036).
- Scope was held to the delta spec against two pulls from the idea text: one address, not several (§ S10), and "language applied" scoped to the stored preference and the document `lang` attribute, not translated content (§ S9). Both are raised or already owned elsewhere — see `## Defects Raised`.

## Verification

**PASS.** See `qa-test-report.md`: `bun run verify` clean (lint, typecheck, 119/119 tests) and the Playwright suite executed for real at 9 passed / 0 failed, with all 16 delta-spec scenarios and the idea's 3 acceptance criteria verified. `integration-defects-resolution.md` records an empty defect set — nothing was fixed in place and nothing was escalated. The one E2E anomaly seen (a QA-container Playwright browser-build mismatch) was environment provisioning, not sprint code, and did not recur.

## Defects Raised

None. `a2a_list_tickets(type="defect", created_since=2026-09-11T09:55:00Z)` returns an empty set; no agent filed a defect during the sprint window and integration QA found none.

Two improvement-labelled TASKs were raised during planning and remain in BACKLOG, unassigned, for triage:

| Ticket      | What                                                                      | Filed by | Status  |
| ----------- | ------------------------------------------------------------------------- | -------- | ------- |
| SWHM-T-0037 | Separate billing and shipping addresses on a customer account (see § S10) | planning | BACKLOG |
| SWHM-T-0038 | Idea SWHM-I-0003's wireframe covers only a read-only profile (see § S6)   | planning | BACKLOG |

## Retrospective

**Went well**

- Pinning every shared table shape, type and signature in `INTERFACES.md` before any ticket started let three sequenced tickets code against one surface with no rework: SWHM-T-0035 and SWHM-T-0036 each changed zero files owned by the ticket before them.
- Recording the eleven spec contradictions in `SPEC-DISCREPANCIES.md` rather than editing the extracted spec meant integration QA had a pre-agreed answer for every scenario whose literal wording names a Java EE artifact — it returned a verdict on all 16 with no adjudication round and no SPEC-GAPs.
- Refusing to store the card number, against a spec that asks for it, was decided once at planning and cost nothing the spec actually observes: card type and expiry round-trip exactly, and the expiry-parsing scenario is untouched.

**Could improve**

- The planning artifacts landing on the ticket branch instead of the sprint branch cost SWHM-T-0034 a diagnosis before it could start. It self-corrected, but a plan that is not on the branch the next agent forks from is invisible to it by default.
- Chromium is still absent from implementation containers, so all three tickets fell back to `verify` and the E2E assertions were first executed at CI and integration QA. `.vortex/agents-generated.md` already records this from SWHM-S-0002; it is now a six-plus-ticket pattern across two sprints rather than an anomaly, and it belongs in container provisioning rather than in each agent's fallback.
- The wireframe covered roughly half the screen the idea's own user stories describe. Resolving that at planning worked, but the cheaper fix is upstream — SWHM-T-0038 exists for it.

## Compliance / Control Evidence

| Control                                | Evidence produced                                              | Location                                                               | Status    | Exception                                                                        |
| -------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------- |
| Change specified before build          | OpenSpec change: proposal, design, 16-scenario delta spec      | `openspec/changes/swhm-i-0003-customer-account-profile-man/`           | Satisfied | —                                                                                |
| Work planned and traceable to the spec | Per-ticket PLAN.md; every `tasks.md` checkbox ticket-tagged    | `artifacts/SWHM-S-0003/SWHM-T-003{4,5,6}/PLAN.md`                      | Satisfied | —                                                                                |
| Change reviewed before merge           | Ticket mini-PRs #20, #21, #22, #23 on the sprint branch        | PR #20 / #21 / #22 / #23                                               | Satisfied | —                                                                                |
| Tests executed                         | `TDD-RESULT` markers, 102 → 110 → 119 passing                  | `artifacts/SWHM-S-0003/SWHM-T-003{4,5,6}/tdd-test-result.md`           | Satisfied | Browser tier ran in CI and at QA, not in implementation containers (no Chromium) |
| Change verified before release         | QA report, PASS verdict; 16/16 scenarios, 3/3 idea criteria    | `artifacts/SWHM-S-0003/qa-test-report.md`                              | Satisfied | —                                                                                |
| Defects dispositioned                  | Empty defect set, recorded explicitly                          | `artifacts/SWHM-S-0003/integration-defects-resolution.md`              | Satisfied | —                                                                                |
| Deviations from specification recorded | 11 discrepancies with resolutions, spec left unedited          | `artifacts/SWHM-S-0003/SPEC-DISCREPANCIES.md`                          | Satisfied | —                                                                                |
| Cardholder data not retained           | No card-number column; number reduced to last four pre-storage | `db/schema.ts`, `account/customer.ts`, ARCHITECTURE.md § Key Decisions | Satisfied | —                                                                                |
| Release contents recorded              | Release notes                                                  | `artifacts/SWHM-S-0003/release-notes.md`                               | Satisfied | —                                                                                |
