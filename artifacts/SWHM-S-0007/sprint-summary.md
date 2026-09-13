---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0007
idea: SWHM-I-0005
branch: vortex/sprint/swhm-s-0007-d3b37ac1
upstream:
  [
    artifacts/SWHM-S-0007/SPRINT-PLAN.md,
    artifacts/SWHM-S-0007/PLANNING-NOTES.md,
    artifacts/SWHM-S-0007/qa-test-report.md,
  ]
downstream: [artifacts/SWHM-S-0007/release-notes.md]
---

# Sprint summary — SWHM-S-0007

Enhancement sprint against idea SWHM-I-0005 (Multi-Language Support), change `swhm-i-0005-multi-language-support`. Five implementation tickets, one story, one epic, all DONE. QA verdict PASS with zero defects.

## Tickets

| Ticket      | Type  | Title                                                                                   | Outcome                                                                                                            |
| ----------- | ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| SWHM-T-0070 | EPIC  | Multi-language support for the catalogue                                                | DONE — closed by rollup                                                                                            |
| SWHM-T-0071 | STORY | A shopper reads the catalogue in their language, and is told when it is missing         | DONE — closed by rollup                                                                                            |
| SWHM-T-0069 | TASK  | Sprint plan — SWHM-S-0007                                                               | DONE — decomposition, five ticket plans, three root docs, `PLANNING-NOTES.md` (commit b4b6dc7)                     |
| SWHM-T-0072 | TASK  | Locale Support — resolve the active locale and let a customer change it                 | DONE — merged (commit ea78d19, PR #47). Detail: `SWHM-T-0072/summary.md`                                           |
| SWHM-T-0073 | TASK  | Database Schema — pin the per-locale detail coverage the catalogue relies on            | DONE — merged (commit bde42d2, PR #45). Test-only; no schema or migration change. Detail: `SWHM-T-0073/summary.md` |
| SWHM-T-0074 | TASK  | Data Access Layer — tell a missing translation apart from a missing entity              | DONE — merged (commit c6b264f, PR #46). Detail: `SWHM-T-0074/summary.md`                                           |
| SWHM-T-0075 | TASK  | Content Management — show localized content, and its absence, on every catalogue screen | DONE — merged (commit 5e7e987, PR #48). Detail: `SWHM-T-0075/summary.md`                                           |
| SWHM-T-0076 | TASK  | Testing — prove the three locales end to end in a browser                               | DONE — merged (commit 7dafd51, PR #49). Detail: `SWHM-T-0076/summary.md`                                           |
| SWHM-T-0077 | TASK  | Integration QA report — SWHM-S-0007                                                     | DONE — PASS, zero defects (commit 1c345c4, PR #50)                                                                 |
| SWHM-T-0078 | TASK  | Sprint close bundle — SWHM-S-0007                                                       | In progress — this file and `release-notes.md` are its deliverable                                                 |

## What shipped

The sprint goal was the visible half of multi-language support, and the visible half is what landed. Eleven of the change's eighteen work items were already satisfied before the sprint opened (`PLANNING-NOTES.md` § Codebase findings) — per-locale schema, locale-parameterised reads, the `?locale=` API surface and the stored profile preference all predate it. The seven that remained were a control, visitor-side persistence, an honest empty state, and the browser tier that proves the three locales.

A `LanguageSwitcher` control is mounted in the header of all four catalogue screens — home, category, product and item — showing the language currently displayed and offering English (US), 日本語 and 中文. It renders before any data arrives, so it is reachable on a screen that has nothing to show yet.

`useCatalogLocale()` became the single resolution site, in the fixed order `?locale=` → `petstore_locale` cookie → signed-on `profile.preferred_language` → `en_US` (D2). Switching writes the cookie, replaces the search parameter without a history entry, sets `document.documentElement.lang`, and — only when a session exists — fires `PUT /api/customer`. That is the whole of "it works for visitors too": the cookie carries a visitor's choice across a reload and a navigation, and the profile write carries a signed-on customer's choice to a different browser.

The three catalogue detail endpoints now answer a 404 with a `reason` of `not-found` or `missing-translation` (D1). This is the one decision that overrode the idea's own technical approach, which proposed solving the distinction client-side and stated "No server change" — under a non-default locale an unknown id and an untranslated entity produce an identical bare 404, so a client rule keyed on "the locale is not the default" reports every broken link as untranslated, which is the failure the criterion exists to prevent. Status codes and error text are unchanged, so the field is additive.

Where a category or product has no content in the chosen language, the four screens render `UnavailableInLanguage` (D3): a heading naming the language in its own script, a body saying nothing is broken, a primary **View in English (US)** and a secondary **Change language**. An unknown id still reaches the Not Found page. The four screens also stopped rendering `null` while their first fetch is in flight (D4), which closed finding F1 carried forward from SWHM-S-0006 — the spec added there already covered the catalogue screens, and the code now conforms.

`catalog/seed.test.ts` pins the locale coverage the empty state depends on: `en_US` and `ja_JP` for every product and item, and no `zh_CN` row for either (D5). The absence is product scope, not an oversight, and an assertion is what stops a well-meaning future edit from "fixing" it and deleting the screen state the mockup was drawn for.

Root docs were brought to target state on the planning ticket, ahead of implementation, and needed nothing further at close: `PRODUCT.md` gained the `internationalization` capability line plus two scope exclusions and a success measure, `ARCHITECTURE.md` gained the D2 cross-cutting constraint and the D1 decision under § Key Decisions (cited by change id), and `DESIGN.md` gained § Unavailable content states. `AGENTS.md` is human-authored and was not touched. See § Divergence for the Changelog-entry question this ticket's own criteria raise.

## Divergence from plan

Two, both recorded when taken.

**One ownership deviation, escalated rather than absorbed.** SWHM-T-0072's fixed interface changed `useCatalogLocale()`'s return from `Locale | null` to `{ locale, setLocale }`, which breaks the four catalogue page files — owned by SWHM-T-0075, not by it — with `TS2345`. The implementation agent proved the breakage with a typecheck, transitioned to `blocked`, escalated to planning with two proposed resolutions before committing anything, and was returned to `in_progress` with the plan and ownership table unchanged. The minimal fix shipped: a one-line destructure in each of the four files, no behaviour change. This is the ownership map working as intended — the collision was visible at the moment it happened rather than at merge.

**One plan gap absorbed inside a ticket.** SWHM-T-0075 needed the `reason` field on the item screen, but `useCatalogFetch` collapses a 404 to a boolean and discards the body, and `shared.ts` was SWHM-T-0072's. Rather than a second escalation it defined a local `useItemFetch` scoped to that one file. The plan should have anticipated this: it specified the `reason` discriminator in the data layer and the consuming screen without noticing that the shared hook between them throws the field away.

**This ticket's own acceptance criteria ask for a "dated Changelog entry" in the root docs; none was added, deliberately.** The planning role contract forbids a `## Changelog` section and any new changelog entry in a root doc — the commit message is already dated, attributed and diffable, and a second history inside the document only drifts from the first. No root doc in this repository carries such a section. The contract outranks a criterion that conflicts with it, and the divergence is recorded here rather than resolved silently. The substance of the criterion — root docs matching the observable behaviour the sprint shipped — is satisfied.

Nothing else moved. The five tickets landed on the files their ownership maps named, in the planned order, with no ticket added, dropped or re-sequenced. No harness or CI change was owed and none was made (`PLANNING-NOTES.md` § Test harness, § CI).

## Verification

PASS. See `artifacts/SWHM-S-0007/qa-test-report.md` — all 12 sprint acceptance criteria and all 5 delta-spec scenarios pass, unit suite 297/297 across 55 files, E2E 16/16 across 6 spec files on a real Chromium (`integration-test-result.md`), lint and typecheck green, zero defects (`integration-defects-resolution.md`).

Re-run on this close ticket against the landing branch: `bun run verify` — 55 files, 297 tests, 0 failed, lint and typecheck clean.

Two things about the verification are worth naming rather than leaving in the QA report:

- QA checked design fidelity against the two exported mockups at their authored 1440×900 viewport, not just against the acceptance criteria. That is how the one deviation below was found; a criterion-only pass would have reported nothing.
- The `de_DE` case in the delta spec's null scenario is an _unsupported_ locale, and it passes because `resolveLocale()` deliberately does not reject one (`PLANNING-NOTES.md` § S7). `isSupportedLocale()` is exported and used by nothing but its own test — a future change that starts gating on it breaks that scenario. Nothing in the code says so.

## Known Issues

None. The sprint was not conditionally approved: QA returned PASS with zero defects found, nothing was fixed in place, and no defect was left open at close.

One cosmetic design deviation was observed by QA and judged not a defect: the empty-state mockup shows a small globe icon centred above the "No products in 中文 yet" heading, and the built page omits it. Raised as SWHM-T-0079 (`improvement`) so it survives the sprint. It blocks nothing — the heading, body and both actions match the mockup verbatim.

## Defects Raised

None. No DEFECT ticket was created during the sprint window — verified via `a2a_list_tickets(created_since="2026-09-13T09:48:06.619Z")`, which returned only the sprint's own lifecycle tickets. One `improvement`-labelled TASK was filed at close (SWHM-T-0079, above).

Two findings carried forward from SWHM-S-0006 remain open and still carry no ticket key. They are restated once more so they do not expire with that sprint's summary:

| Ref | Finding                                                                                                                                                             | Status                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| F1  | Catalogue screens render blank while their client-side reads are in flight                                                                                          | **Closed this sprint** — D4, SWHM-T-0075. All four screens now render a `role="status"` pending element |
| F2  | `db/client.ts` opens SQLite with no `busy_timeout` and no WAL journal mode; a second process takes `SQLITE_BUSY` on the first concurrent write with no retry window | Still open. Verified present on the landing branch                                                      |
| F3  | An empty 0-byte `tailwind.config.ts` sits at the repository root, against `AGENTS.md` § Conventions ("There is no `tailwind.config.js` and adding one is a defect") | Still open, third consecutive sprint. Verified present on the landing branch                            |

F2 and F3 are defect-shaped and need tickets. Planning has no defect-creation authority, which is why they are prose in a third sprint summary rather than rows on a board.

## Retrospective

**Went well**

- Measuring the codebase before scoping changed what the sprint was. Eleven of eighteen work items were already built, and reading that off the code rather than off the idea's description is what kept the backlog at five tickets covering the visible half instead of eighteen covering work that existed.
- Overriding the idea's own technical approach, in writing, with the reason. The idea said "No server change" next to a criterion that cannot be met without one. D1 states the conflict, states why the client-side alternative fails precisely when the id is also wrong, and records the rejected double-fetch. The criterion passed at QA on the first attempt.
- The ownership map caught the one real collision and the agent escalated instead of reaching across it. Cost: one `blocked` transition and a plan confirmation. The alternative — editing four files it did not own and discovering the conflict at merge — is the failure that map exists to prevent.
- Every `tasks.md` checkbox is ticked. SWHM-S-0005 archived with three outstanding and SWHM-S-0006 with two, both because the platform stamps on merge and sprint-scoped tickets never merge. This sprint's work items all belonged to ticket-branch tickets, so all eighteen stamped. The mechanism is unchanged and will bite again on the next sprint whose work sits on a planning ticket.
- Pinning a deliberate data _absence_ as a test. The zh_CN empty state only exists because zh_CN product content does not, and an absence with no assertion is indistinguishable from an oversight to the next person who reads the seed.

**Could improve**

- The plan routed a new server field to a screen through a shared hook that discards response bodies, and did not notice. SWHM-T-0075 absorbed it with a local hook rather than escalating — the right call for one screen, but it leaves two fetch hooks with the same shape in the catalogue pages, one of which is the only one that can read a 404 body. A later ticket that needs the field on the category or product screen will find the same wall.
- The E2E tier still cannot run in an implementation container. SWHM-T-0076's specs were written and first executed in CI, where one failed on a 26-character username against a 25-character limit — a bug in the test's own helper, found and fixed within the ticket, but found a full CI round trip after it was written. This is the third consecutive sprint to record it; QA again had to `bunx playwright install chromium` by hand.
- Design fidelity was verified once, at QA, after everything had merged. The globe icon was missed by five ticket-level reviews and caught by the first agent to open the mockup and the built page side by side at the authored viewport. Nothing in a ticket's definition of done asks for that comparison.
- `document.documentElement.lang` is set to the raw locale token (`ja_JP`), not a BCP-47 tag (`ja-JP`). It is consistent with the convention the profile screen already established and QA correctly declined to call it a regression, but the criterion it satisfies says "matches the displayed language", and a screen reader parsing `ja_JP` gets nothing. Consistency preserved the wrong thing; no ticket exists to change it, and the constraint is now inherited by every later localized screen.

## Compliance / Control Evidence

| Control                                            | Evidence                                                                                    | Location                                                                                                                                                 | Status                   | Exception                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Change planned and specified before implementation | OpenSpec change (strict-validated at planning), planning record, five per-ticket plans      | `openspec/changes/swhm-i-0005-multi-language-support/`, `artifacts/SWHM-S-0007/PLANNING-NOTES.md`, `artifacts/SWHM-S-0007/SWHM-T-007{2,3,4,5,6}/PLAN.md` | Satisfied                | —                                                                                                                |
| Change reviewed before merge                       | PRs #45, #46, #47, #48, #49, #50                                                            | GitHub, `sweeho/my-pet-store`                                                                                                                            | Satisfied                | —                                                                                                                |
| Tests executed                                     | Unit 297/297 across 55 files; E2E 16/16 across 6 specs on real Chromium                     | `artifacts/SWHM-S-0007/qa-test-report.md`, `integration-test-result.md`                                                                                  | Satisfied                | —                                                                                                                |
| Regression cover added red-first                   | Recorded red runs for all four implementation tickets                                       | `artifacts/SWHM-S-0007/SWHM-T-007{2,3,4,5}/tdd-test-result.md`                                                                                           | Satisfied                | —                                                                                                                |
| Change verified before release                     | QA PASS verdict, 12/12 acceptance criteria, 5/5 delta-spec scenarios                        | `artifacts/SWHM-S-0007/qa-test-report.md`                                                                                                                | Satisfied                | —                                                                                                                |
| Defects dispositioned                              | 0 found at integration QA; 1 cosmetic deviation raised as SWHM-T-0079                       | `artifacts/SWHM-S-0007/integration-defects-resolution.md`, this file § Known Issues                                                                      | Satisfied                | —                                                                                                                |
| Work items tracked to completion                   | All 18 `tasks.md` checkboxes ticked by the platform at ticket merge                         | `openspec/changes/swhm-i-0005-multi-language-support/tasks.md`                                                                                           | Satisfied                | —                                                                                                                |
| Standing documentation matches delivered behaviour | `PRODUCT.md`, `ARCHITECTURE.md`, `DESIGN.md` updated on SWHM-T-0069 ahead of implementation | commit b4b6dc7                                                                                                                                           | Satisfied with exception | No dated Changelog entry — the planning role contract forbids one in a root doc; see § Divergence                |
| Out-of-scope findings recorded                     | F2, F3 carried forward from SWHM-S-0006 and re-verified present                             | this file § Defects Raised                                                                                                                               | Satisfied with exception | F2 and F3 carry no ticket key; planning cannot create a DEFECT, so they survive as prose until triage files them |
