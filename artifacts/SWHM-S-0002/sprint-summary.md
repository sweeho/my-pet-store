---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0002
idea: SWHM-I-0002
branch: vortex/sprint/swhm-s-0002-728cef7d
upstream:
  [
    artifacts/SWHM-S-0002/SPRINT-PLAN.md,
    artifacts/SWHM-S-0002/qa-test-report.md,
    artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md,
  ]
downstream: [artifacts/SWHM-S-0002/release-notes.md]
---

# Sprint summary — SWHM-S-0002

**Goal:** SWHM-I-0002 — User Authentication & Sign-On. **Verdict:** met, verified, no defects at integration QA.

## Tickets

| Ticket      | Type  | Title                                                         | Outcome                                                                                                                           |
| ----------- | ----- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0010 | TASK  | Sprint plan — SWHM-S-0002                                     | DONE — change `swhm-i-0002-user-authentication-sign-on`, `SPEC-DISCREPANCIES.md`, `INTERFACES.md`, ten `PLAN.md` files, root docs |
| SWHM-T-0011 | EPIC  | User Authentication & Sign-On                                 | DONE — closed by rollup                                                                                                           |
| SWHM-T-0012 | STORY | Credentials: user entity, validation and authentication       | DONE — closed by rollup                                                                                                           |
| SWHM-T-0013 | STORY | Session state, resource interception and username persistence | DONE — closed by rollup                                                                                                           |
| SWHM-T-0014 | STORY | Sign-on workflows, user interfaces and integration coverage   | DONE — closed by rollup                                                                                                           |
| SWHM-T-0015 | TASK  | User entity                                                   | DONE — `40b9aee` (#8) · `SWHM-T-0015/summary.md`                                                                                  |
| SWHM-T-0016 | TASK  | User creation validation                                      | DONE — `a44bcd2` (#9) · `SWHM-T-0016/summary.md`                                                                                  |
| SWHM-T-0017 | TASK  | Authentication service                                        | DONE — `633bbbf` (#10) · `SWHM-T-0017/summary.md`                                                                                 |
| SWHM-T-0018 | TASK  | Session management                                            | DONE — `98779db` (#11) · `SWHM-T-0018/summary.md`                                                                                 |
| SWHM-T-0019 | TASK  | SignOn filter                                                 | DONE — `081216a` (#12) · `SWHM-T-0019/summary.md`                                                                                 |
| SWHM-T-0020 | TASK  | Cookie persistence                                            | DONE — `8fefb19` (#13) · `SWHM-T-0020/summary.md`                                                                                 |
| SWHM-T-0021 | TASK  | Sign-in workflow                                              | DONE — `2776e58` (#14) · `SWHM-T-0021/summary.md`                                                                                 |
| SWHM-T-0022 | TASK  | Account creation workflow                                     | DONE — `a6439d3` (#15) · `SWHM-T-0022/summary.md`                                                                                 |
| SWHM-T-0023 | TASK  | User interfaces                                               | DONE — `006c5fe` (#16) · `SWHM-T-0023/summary.md`                                                                                 |
| SWHM-T-0024 | TASK  | Integration testing                                           | DONE — `8f24a11` (#17) · `SWHM-T-0024/summary.md`                                                                                 |
| SWHM-T-0029 | TASK  | Integration QA report — SWHM-S-0002                           | DONE — `d4f4ee6` (#18) · `qa-test-report.md` (PASS)                                                                               |
| SWHM-T-0030 | TASK  | Sprint close bundle — SWHM-S-0002                             | IN_PROGRESS — this file and `release-notes.md`; transitions to DONE on their commit                                               |

Every committed ticket reached DONE. Nothing was deferred, cancelled or carried forward.

## What shipped

The `user-authentication` capability, complete against the fourteen requirements and twenty-four scenarios of the delta spec: account creation with the legacy username and password constraints, credential verification, server-side session state, protected-resource interception with return to the originally-requested URL, remembered usernames, and the five screens that expose all of it. Structure and decisions are in `openspec/changes/swhm-i-0002-user-authentication-sign-on/` (`proposal.md`, `design.md`, `specs/user-authentication/spec.md`); per-ticket detail is in each ticket's `summary.md`, linked from the table above.

The capability is reachable end to end in a browser: an unauthenticated visit to `/customer` is intercepted, sign-on returns the visitor to `/customer`, and a remembered username pre-fills on a later visit — all three asserted in `e2e/signon.spec.ts` and executed at integration QA.

## Divergence from plan

Four deviations, all minor, all recorded by the ticket that made them. None changed a fixed interface contract or a spec scenario.

- **D1 — SWHM-T-0017.** `PLAN.md` step 2 named an explicit `validateNewUser` call before `insertUser`; SWHM-T-0016 had already moved that call inside `auth/user.ts`'s `insertUser`, so `createUser` delegates rather than validating twice. `CreateUserError` propagates unchanged. (`SWHM-T-0017/summary.md` § Notes.)
- **D2 — SWHM-T-0018.** `tsconfig.node.json`'s `include` never listed `auth/`. The ticket's endpoint was the first file under `routes/` to import from `auth/`, which surfaced the pre-existing gap as a `tsc --build` project-reference error; fixed additively in one line, outside the ticket's ownership map. (`SWHM-T-0018/summary.md` § Notes.)
- **D3 — SWHM-T-0021.** `PLAN.md` step 3 wanted `original_url` cleared once consumed as the redirect destination. `setOriginalUrl(session, url: string)` is a fixed contract owned by SWHM-T-0018 and accepts only `string`, so the clear is not implemented. The gap can only surface on a redundant repeat sign-in against an already-signed-on session, which no scenario exercises. Raised as SWHM-T-0028. (`SWHM-T-0021/summary.md` § Notes.)
- **D4 — the E2E tier did not run in any implementation container.** Every ticket from SWHM-T-0016 onward reported the same `scripts/ensure-playwright-browser.mjs` preflight failure: Chromium is genuinely not installed there. Each fell back to `bun run verify` and did not retry or install, per guidance. The browser tier was executed by CI on each ticket branch and by validation at integration QA — 8/8 passing — so no assertion went unexecuted; the cost was in repeated re-derivation, not in coverage.

One factual note, not a deviation: the `bp_signon` cookie's max-age is **2,678,400 seconds (31 days)**, the value the delta spec states verbatim. The idea's acceptance criterion rounds this to "30 days". The implementation follows the spec's explicit number.

## Verification

PASS. See `qa-test-report.md` — 24/24 spec scenarios pass, `bun run verify` green (lint, typecheck, 74 unit tests across 21 files), 8/8 Playwright tests green on the built, deployed integration. No defects found, so nothing was fixed in place and nothing was escalated: `integration-defects-resolution.md` carries an empty defect log and `INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`.

The sprint was approved unconditionally. There is no `## Known Issues` section because there are no defects the sprint accepted in order to close; the open items it _discovered_ are below.

## Defects Raised

One DEFECT and three improvement-labelled TASKs were raised during the sprint window. None is dispatched by anything; each awaits triage. The improvements are listed alongside the defect deliberately — they are equally perishable, and the three raised at planning time are the recorded dispositions of `SPEC-DISCREPANCIES.md` §§ S9–S11.

| Ticket      | Type                 | Description                                                                                                                                                                 | Filed by                                               | Status  |
| ----------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------- |
| SWHM-T-0025 | DEFECT               | Light-mode `--destructive-foreground` duplicates `--destructive`, so `text-destructive-foreground` on `bg-destructive` renders invisible error text (`src/index.css:22-23`) | planning, during SWHM-T-0010 (§ S11)                   | BACKLOG |
| SWHM-T-0026 | TASK (`improvement`) | Sessions never expire — no scenario specifies expiry, so none was implemented (§ S9)                                                                                        | planning, during SWHM-T-0010                           | BACKLOG |
| SWHM-T-0027 | TASK (`improvement`) | Remove the boilerplate `middleware/auth.ts` stub and its hardcoded user (§ S10)                                                                                             | planning, during SWHM-T-0010                           | BACKLOG |
| SWHM-T-0028 | TASK (`improvement`) | Allow clearing session `original_url` after redirect consumption — the D3 contract gap                                                                                      | planning, from implementation's finding on SWHM-T-0021 | BACKLOG |

SWHM-T-0025 does not affect any screen this sprint shipped: per § S11 the two error pages use `text-destructive` on the page background and avoid the broken pair entirely.

## Retrospective

**Went well.**

- The fixed interface contracts in `INTERFACES.md` and each `PLAN.md` carried ten sequentially-dependent tickets to integration with zero rework and zero defects — 24/24 scenarios and the full E2E tier passed on their _first_ execution against the merged branch. Where a ticket found a contract wrong (D3), it recorded the gap and stayed inside its ownership map rather than widening someone else's module mid-sprint, which is why the chain never had to be re-integrated.
- Settling the eleven legacy-spec discrepancies up front gave every deviation a home before it was needed. S3 (hash passwords rather than the spec's plaintext `String.equals()`) and S7 (answer with `{ redirectTo }` rather than a 302 a `fetch` would swallow) are both decisions a ticket would otherwise have taken alone, inconsistently, at 2am.
- S6's "one pure decision function, two enforcement points" held under test: `evaluateAccess()` is consumed identically by `middleware/signon.ts` and `GET /api/signon/check`, and the browser tier proved the client-side path that a server-only filter would have left open in dev.

**Could improve.**

- **The dependency chain was strictly linear where the ownership maps were not.** SWHM-T-0015 → … → SWHM-T-0024 serialised ten tickets, but several pairs share no files — SWHM-T-0020's cookie helpers (`auth/remember-cookie.ts`, `src/utils/cookies.ts`) do not depend on SWHM-T-0019's filter in any way. Sequencing by actual file overlap rather than by narrative order would have let independent tickets run in parallel at no integration risk. This is a planning miss, and the cheapest of the three to fix next sprint.
- **D3 was a contract-design miss at planning time.** `setOriginalUrl(session, url: string)` was frozen in SWHM-T-0018's interface before SWHM-T-0021 needed to clear the value. A fixed contract for a mutable field should be reviewed against every consumer's _full_ lifecycle — set, read, and clear — before it is frozen.
- **`AGENTS.md` overstates Chromium availability** ("every environment this template targets — Vortex agent workspace containers, CI, local dev — ships a Chromium"). Six tickets hit the same preflight failure and each spent a turn re-deriving the same correct fallback. Corrected in `.vortex/agents-generated.md` this sprint, since `AGENTS.md` is human-authored and is not rewritten by an agent.
- SWHM-T-0024 had no genuine red phase: every endpoint under test was already built and individually proved, so its tests passed on first write. The ticket recorded that honestly and sanity-mutated an assertion to prove the file could fail. A separate end-of-chain integration ticket buys less than folding the cross-endpoint flows into the ticket that lands the last endpoint.

## Compliance / Control Evidence

| Control / policy                       | Evidence produced                                                                         | Location                                                                          | Status            | Exception                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| Change specified before build          | OpenSpec change: proposal, design, delta spec, tagged task list                           | `openspec/changes/swhm-i-0002-user-authentication-sign-on/`                       | Satisfied         | —                                                                                               |
| Change reviewed before merge           | 11 ticket mini-PRs (#8–#18), each squash-merged to the sprint branch after its CI verdict | `git log dev..vortex/sprint/swhm-s-0002-728cef7d`                                 | Satisfied         | —                                                                                               |
| Tests executed                         | `TDD-RESULT` markers, one per implementation ticket                                       | `artifacts/SWHM-S-0002/SWHM-T-00{15..24}/tdd-test-result.md`                      | Satisfied         | E2E tier not executable in implementation containers (D4); executed in CI and at integration QA |
| Change verified before release         | QA report, PASS verdict, 24/24 scenarios                                                  | `artifacts/SWHM-S-0002/qa-test-report.md`                                         | Satisfied         | —                                                                                               |
| Defects dispositioned                  | 0 found at integration QA; 4 findings raised as backlog tickets                           | `artifacts/SWHM-S-0002/integration-defects-resolution.md`, § Defects Raised above | Satisfied         | —                                                                                               |
| Spec deviations recorded and justified | 11 discrepancies with resolutions (S1–S11)                                                | `artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md`                                     | Satisfied         | —                                                                                               |
| Credentials protected at rest          | scrypt hash + per-user salt, `timingSafeEqual` comparison                                 | `auth/user.ts`; decision in ARCHITECTURE.md § Key Decisions                       | Satisfied         | Deviates from the extracted legacy spec's plaintext comparison, deliberately — § S3             |
| Test coverage measured                 | No coverage tool configured in this project; test counts stand in its place               | `qa-test-report.md` § Coverage Summary                                            | Evidence Required | No `coverage` script and no `@vitest/coverage-v8` in `devDependencies`                          |
