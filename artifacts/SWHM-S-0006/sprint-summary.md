---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0006
idea: Not Applicable
branch: vortex/sprint/swhm-s-0006-e3b91808
upstream: [artifacts/SWHM-S-0006/SPRINT-PLAN.md, artifacts/SWHM-S-0006/qa-test-report.md]
downstream: [artifacts/SWHM-S-0006/release-notes.md]
---

# Sprint summary — SWHM-S-0006

Single-defect bugfix sprint. `idea` is `Not Applicable`: the sprint was raised from a defect, not an idea.

A note on the name, because it will confuse anyone reading this later. The sprint goal reads "Multi-Language Support" and the change id is `swhm-s-0006-multi-language-support`, but no multi-language work was planned or shipped. The sprint was raised against the next idea in the queue and then committed a single unrelated defect; the change id was assigned by the platform and used verbatim, as required. The delivered scope is the one ticket below. Multi-language support remains unbuilt — its own change, `swhm-i-0005-multi-language-support`, is still unstarted in `openspec/changes/`.

## Tickets

| Ticket      | Type   | Title                                                       | Outcome                                                                                    |
| ----------- | ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| SWHM-T-0066 | TASK   | Bugfix plan — SWHM-S-0006                                   | DONE — change authored and strict-validated, SWHM-T-0059 refined in place (commit ad48237) |
| SWHM-T-0059 | DEFECT | Flaky E2E: customer-profile.spec.ts save-then-render timing | DONE — fixed and merged (commit ebb41d4, PR #42). Detail: `SWHM-T-0059/fix-note.md`        |
| SWHM-T-0067 | TASK   | Integration QA report — SWHM-S-0006                         | DONE — PASS verdict, no defects (commit 670c47a, PR #43)                                   |
| SWHM-T-0068 | TASK   | Sprint close bundle — SWHM-S-0006                           | In progress — this file and `release-notes.md` are its deliverable                         |

## What shipped

`RequireSignOn` and `CustomerProfile` no longer render `null` while their client-side reads are in flight. The route guard renders a `role="status"` element reading "Checking access…"; the profile renders its `<h1>Customer Profile</h1>` shell plus a `role="status"` paragraph reading "Loading account…", inside the same container the loaded view uses. `/signon-welcome` inherits the guard's indicator without an edit of its own.

`e2e/customer-profile.spec.ts` now waits for the "Contact information" region — which exists only once `/api/customer` has answered — on an explicit 15000ms budget after the final `page.goto("/customer")`, then asserts the saved first name and the `lang` attribute on their unchanged default budget.

The behaviour is now specified rather than merely fixed. Nothing in `openspec/specs/` said what a screen presents while a read is in flight, which is why a blank page of unbounded duration was never anyone's bug. The change adds _Observable pending state on data-gated screens_ to `application-foundation` with five scenarios, written to cover any data-gated screen rather than just `/customer`.

Root docs were brought to target state on the planning ticket, ahead of the fix: `DESIGN.md` § Loading states carries the interaction pattern, and `ARCHITECTURE.md` § Key Decisions carries the one promoted decision, cited by change id. `PRODUCT.md` was deliberately left alone — no capability gained a line and the product's scope did not move. `AGENTS.md` is human-authored and is never rewritten by an agent.

## Divergence from plan

None in execution. Both `tasks.md` fix items landed on the five files the ownership map named and no others; the as-built code matches `design.md` D1–D4 and `DESIGN.md` § Loading states without interpretation.

One divergence in _planning_, decided before any code was written and recorded at the time. The defect report offered a second spec (`e2e/catalog.spec.ts:76`, flaking in the same CI run) as corroboration that the runner was under heavy load. Reading the run's own log showed that test failed deterministically on all three attempts in 47ms / 139ms / 81ms with `Error: test bug: username "catalog-locale-1789131510252" exceeds MAX_USERID_LENGTH (25)` — an assertion in the spec's own helper, not a timeout — and had already been fixed before that branch merged. The corroboration was withdrawn and the root cause rebuilt without it, with the correction written into the change's `proposal.md` rather than applied silently.

## Verification

PASS. See `artifacts/SWHM-S-0006/qa-test-report.md` — all five delta-spec scenarios pass, unit suite 250/250 across 51 files, 12/12 E2E specs, lint and typecheck green, zero defects (`integration-defects-resolution.md`).

Re-run on this close ticket against the landing branch: `bun run verify` — 51 files, 250 tests, 0 failed.

Two things about the verification are worth naming rather than leaving in the QA report:

- QA ran the target spec **three times**, not once. A flake fix observed green on a single run is not evidence, and this ticket exists precisely because one green run had previously been taken as such. Target spec: 2.3s, then (harness startup failure, no test ran), then 1.7s.
- The unit cover for the new branches was written red-first and the red output recorded — `Unable to find an accessible element with the role "status"` against an empty `<body><div /></body>`. A pending-state assertion that has never been seen to fail would pass just as happily against a page that renders a spinner forever.

## Known Issues

None. QA returned PASS with zero defects found and nothing fixed in place; no defect was left open at close. This sprint was not conditionally approved.

One non-blocking bookkeeping gap QA observed, carried here because the change directory archives at close: `tasks.md` items 1.2 and 1.4 are still unticked. They belong to SWHM-T-0066, whose work is verifiably present on the branch. See the retrospective — this is the same mechanism that left three boxes unticked in SWHM-S-0005, not a new problem and not a missed piece of work.

## Defects Raised

None. No DEFECT ticket was created during the sprint window — verified via `a2a_list_tickets(created_since="2026-09-13T03:29:13.525Z")`, which returned only the sprint's own four lifecycle tickets.

Three findings were surfaced during root-cause analysis and recorded as prose in the change's `proposal.md` § "Out of scope". **They carry no ticket key** — planning has no defect-creation authority — and the change directory archives at sprint close, so they are restated here to survive it:

| Ref | Finding                                                                                                                                                                                                                                                                            | Kind                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| F1  | The catalogue screens have the same blank-render shape this sprint fixed on `/customer`: `useCatalogLocale` (`src/pages/catalog/shared.ts`) must resolve before `useCatalogFetch` is given a URL, so `/catalog` is two serial reads deep with no pending state. Not flaking today. | Defect-shaped; needs a ticket |
| F2  | `db/client.ts:18` opens the SQLite connection with no `busy_timeout` and no WAL journal mode. Latent while the app is single-process; a second process takes `SQLITE_BUSY` on the first concurrent write with no retry window.                                                     | Defect-shaped; needs a ticket |
| F3  | An empty 0-byte `tailwind.config.ts` still sits at the repository root. Carried over unfixed from SWHM-S-0005's F3; `ARCHITECTURE.md` § Stack now documents it as inert, which is documentation standing in for deleting it.                                                       | Defect-shaped; needs a ticket |

F1 is the one to act on. The requirement this sprint added already specifies the catalogue's behaviour — the spec is ahead of the code there, which is a short-lived and easily-forgotten state.

## Retrospective

**Went well**

- Re-reading the CI log instead of trusting the defect report's transcription of it changed the diagnosis. The report's "two specs flaked, so the runner was loaded" reasoning was built on a test that had not flaked at all and was already fixed. The cost of checking was one `gh run view` call, and the root cause that survived it does not depend on an unverifiable claim about a runner's load.
- Separating what each half of the fix actually does, in writing, before either was built. `design.md` § D1 says plainly that the pending indicator does not make two round trips faster and that only the E2E wait anchor removes the flake. Both halves shipped. The failure mode that warning was aimed at — ship the visible half, declare the flake fixed — is the easy outcome here, and naming it in the plan is what made it not happen.
- Fixing the blank page rather than only the test. The ticket was filed as a flaky test; the code underneath it gave a real visitor an unbounded blank screen on two protected pages. Treating the test as the symptom produced a fix worth more than the ticket asked for, within the same five files.
- The E2E fix is anchored on a structural signal rather than a bigger timeout. The content assertions kept their 5000ms budget, so a page that renders with the wrong name still fails fast — the thing AC-2 was written to prevent.

**Could improve**

- The sprint's name describes work it did not do. "Multi-Language Support" is the goal on the sprint row, the change id, and the platform-generated index, while the delivered scope is one unrelated render-timing defect. Anyone reading `openspec/changes/archive/` in six months finds a change named for a capability that is still unbuilt. The naming came from the platform and was used verbatim as required; the mismatch is worth fixing upstream of planning, because no downstream artefact can undo it.
- `tasks.md` items 1.2 and 1.4 remain unticked, for the same reason SWHM-S-0005's 1.1–1.3 did: the platform stamps a checkbox when its ticket _merges_, and sprint-scoped planning tickets commit straight to the sprint branch, so no merge event ever fires. This is the second consecutive sprint to archive a change with permanently-outstanding boxes against work that was done. It is not editable from a close ticket — `openspec/` is off-limits here — and is worth fixing in the stamping mechanism rather than by hand, before a third sprint makes unticked boxes the normal state of the archive.
- The E2E browser tier still cannot run in an implementation container, so the fix for a flaky browser test was written, and its red run recorded, without the browser test ever executing locally. It was observed in CI on the branch and three times at QA, which is why the verdict holds — but the loop between changing an E2E spec and seeing it run is a full CI round trip for every agent on this project, and QA had to `bunx playwright install chromium` by hand to close it.
- F1 leaves the spec ahead of the code: the requirement added here covers the catalogue screens, which still render blank. That is a deliberate scoping call (no observed defect, and widening the fix would have put a second set of files in one ticket), but a requirement with a known non-conforming screen behind it and no ticket to close the gap is a short-lived state that depends on this paragraph to survive.

## Compliance / Control Evidence

| Control                                            | Evidence                                                    | Location                                                                                                  | Status                   | Exception                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| Change planned and specified before implementation | OpenSpec change, strict-validated; per-defect plan          | `openspec/changes/swhm-s-0006-multi-language-support/`, `artifacts/SWHM-S-0006/SWHM-T-0059/PLAN.md`       | Satisfied                | —                                                                                          |
| Change reviewed before merge                       | PR #42 (fix), PR #43 (QA report)                            | GitHub, `sweeho/my-pet-store`                                                                             | Satisfied                | —                                                                                          |
| Tests executed                                     | Unit 250/250 across 51 files; E2E 12/12, target spec run 3× | `artifacts/SWHM-S-0006/qa-test-report.md`, `integration-test-result.md`, `SWHM-T-0059/tdd-test-result.md` | Satisfied                | —                                                                                          |
| Regression cover added red-first                   | Recorded red output for both new pending-state assertions   | `artifacts/SWHM-S-0006/SWHM-T-0059/tdd-test-result.md` § Red run                                          | Satisfied                | —                                                                                          |
| Change verified before release                     | QA PASS verdict, all five scenarios                         | `artifacts/SWHM-S-0006/qa-test-report.md`                                                                 | Satisfied                | —                                                                                          |
| Defects dispositioned                              | 0 found at integration QA                                   | `artifacts/SWHM-S-0006/integration-defects-resolution.md`                                                 | Satisfied                | —                                                                                          |
| Out-of-scope findings recorded                     | F1–F3 above                                                 | this file, `…/proposal.md` § Out of scope                                                                 | Satisfied with exception | F1–F3 carry no ticket key; they survive as prose only until triage files them              |
| Work items tracked to completion                   | `tasks.md` checkboxes                                       | `openspec/changes/swhm-s-0006-multi-language-support/tasks.md`                                            | Satisfied with exception | Items 1.2 and 1.4 unticked — stamping fires on merge, which sprint-scoped tickets never do |
