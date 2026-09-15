---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0011
idea: Not Applicable
branch: vortex/sprint/swhm-s-0011-71ab47fb
upstream: [artifacts/SWHM-S-0011/SPRINT-PLAN.md, artifacts/SWHM-S-0011/qa-test-report.md]
downstream: [artifacts/SWHM-S-0011/release-notes.md]
---

# Sprint summary — SWHM-S-0011

A single-defect BUGFIX sprint. `idea` is `Not Applicable`: the sprint was raised from a defect found during SWHM-S-0010's own integration QA, not from an Ideas Canvas.

## Tickets

| Ticket      | Type   | Title                                                           | Outcome                                                                                                                                      |
| ----------- | ------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0106 | TASK   | Bugfix plan — SWHM-S-0011                                       | DONE — change `swhm-s-0011-bugfix-swhm-t-0105-category` authored and strict-validated; `artifacts/SWHM-S-0011/SWHM-T-0105/PLAN.md` committed |
| SWHM-T-0105 | DEFECT | Category page's untranslated panel calls the category an "item" | DONE — fixed in `421b20e`; `artifacts/SWHM-S-0011/SWHM-T-0105/fix-note.md`                                                                   |
| SWHM-T-0107 | TASK   | Integration QA report — SWHM-S-0011                             | DONE — PASS verdict, no defects found; `artifacts/SWHM-S-0011/qa-test-report.md`                                                             |
| SWHM-T-0108 | TASK   | Sprint close bundle — SWHM-S-0011                               | DONE — this file and `release-notes.md`                                                                                                      |

## What shipped

The sprint goal was the one defect, and it is fixed: the category screen's language-unavailable panel now reads "This **category** has nothing translated into …" where it previously read "This **item** …".

The fix went further than the reported symptom, by decision D1. `UnavailableInLanguage`'s `entity` prop was optional with a `"item"` default; it is now required and widened to `"category" | "product" | "item"`, with the default removed. A default supplies prose for whichever caller omits the prop, and that prose is correct for at most one of the three catalogue levels the shared panel serves — which is why the identical wrong noun shipped for the product screen one sprint earlier (SWHM-T-0098). Requiring the prop turns the next omission into a compile error rather than a silently wrong word. The now-redundant `CONTAINER_NOUN` lookup table was deleted with it (D2), so the component is shorter than before the fix.

All five call sites across the category, product and item screens now name their subject explicitly. Four of them were given the exact word they already rendered, so only the category screen's missing-translation branch changed its output — confirmed in the diff at `421b20e` and by the product and item screens' existing tests passing unchanged.

Coverage was added at all three tiers (D3), because each missed this defect for a different reason: the panel tests had no value that could express a category, the category screen's own test asserted only the heading (which does not depend on the subject, so it passed on the broken output), and no browser-tier assertion visited the screen.

`ARCHITECTURE.md` § Key Decisions gained one bullet during planning — a shared component never defaults a word the visitor reads — since that constraint binds later components beyond this change.

## Divergence from plan

None in scope or approach. All six code work items in the change's `tasks.md` shipped as specified, the fix touched exactly the files the ticket's ownership map named, and no fixed contract moved.

Two process observations, neither affecting delivery:

- Two of the three planning checkboxes tagged SWHM-T-0106 in `tasks.md` (1.2, 1.3) remain unticked although that work shipped in `fe1950d`. The platform ticks a checkbox on ticket merge, and the planning commit went straight to the sprint branch rather than through a ticket merge; checkbox 1.1 was ticked. Recorded as an observation, not a defect — the work is on the branch and verifiable.
- The validation container had no Chromium preinstalled, but `bunx playwright install chromium` succeeded and the browser tier ran for real (24/24). See § Retrospective.

## Verification

**PASS.** See `artifacts/SWHM-S-0011/qa-test-report.md` for the verdict and the scenario-by-scenario ledger; `artifacts/SWHM-S-0011/integration-test-result.md` for the executed commands and per-spec results. No defects were found at integration QA, so `artifacts/SWHM-S-0011/integration-defects-resolution.md` is an empty ledger by design rather than an omission.

All 7 scenarios of the `internationalization` requirement _Language recovery from an untranslated screen_ verified pass, including the two regression scenarios this change added. No `SPEC-GAP` findings.

## Defects Raised

None. `a2a_list_tickets(type="defect", created_since=2026-09-15T20:00:00Z)` returns an empty list for the sprint window.

Five findings were surfaced during planning that are out of this defect's scope. Planning has no DEFECT-creation authority, so they were recorded under `## Follow-ups / out of scope` in `openspec/changes/swhm-s-0011-bugfix-swhm-t-0105-category/proposal.md` and are not tickets. Two are new from this sprint's root-causing — the category screen's untranslated branch being unreachable with any supported language against the seeded catalogue, and the panel naming an unsupported locale as its raw code (`"Not available in de_DE yet"`), which contradicts DESIGN.md § Unavailable content states. Three were carried forward from earlier sprints and re-verified as still open: `tailwind.config.ts` is 0 bytes, `middleware/auth.ts:5` attaches `{ name: "Yeasin" }` to every request, and `src/constants/index.ts:9` exports an unused `API_BASE_URL` placeholder (SWHM-T-0091 tracks the last). Note that the change directory archives at sprint close, so these travel to `openspec/changes/archive/`.

## Retrospective

**What went well**

- Fixing the mechanism rather than the instance was the right call and cost less code than the alternative. The triage report proposed widening the union and keeping the default; requiring the prop instead removed a default and a lookup table, and made the compiler enumerate all five call sites so none had to be found by reading. Two sprints have now lost a ticket to this one default.
- Three-tier coverage caught what single-tier coverage had not. The browser-tier assertion is the only one that exercised the shipped string end-to-end, and it is the tier the previous sprint's equivalent fix never extended to this screen.
- The plan's reachability finding — that every seeded category carries a `zh_CN` row, so only an unsupported locale reaches the branch — went into the design note before implementation started. Without it the browser-tier assertion would have been written against `zh_CN` and would have rendered the category instead of the panel.

**What could improve**

- The change files this sprint's planning authored (`proposal.md`, `design.md`, the delta spec) and `SWHM-T-0105/PLAN.md` are hard-wrapped at roughly 100 columns. `artifact-conventions` §5 forbids this explicitly and says it governs OpenSpec change files too: a line break inside a paragraph survives into every view of the file and makes a one-word edit diff the whole paragraph. The files are correct in content and wrong in form; the two close-bundle files here are unwrapped.
- `.vortex/agents-generated.md` records, from SWHM-S-0002, that agent workspace containers do not ship a Chromium and tells agents not to install one. That held for the implementation container again this sprint, but the validation container installed one successfully with `bunx playwright install chromium` and ran the full browser tier. The note reads as a blanket statement and is only true of implementation containers; left as-is, a future validation run could skip the tier on its authority. It is human-adjacent guidance, so it is flagged here rather than edited from this ticket.
- Nothing scans for the other defaulted user-visible strings this defect class implies. One was found during planning by reading — `LANGUAGE_NAMES[locale] ?? locale`, which renders a raw locale code — and it is recorded only as a proposal follow-up that archives with the change. The general constraint is now in `ARCHITECTURE.md`, but a constraint is not a search.

## Compliance / Control Evidence

| Control / policy                          | Evidence produced                                                          | Location                                                                                                              | Status         | Exception                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| Change verified before release            | QA report, PASS verdict, 7/7 scenarios                                     | `artifacts/SWHM-S-0011/qa-test-report.md`                                                                             | Satisfied      | —                                                                  |
| Defects dispositioned                     | Integration ledger — none found                                            | `artifacts/SWHM-S-0011/integration-defects-resolution.md`                                                             | Satisfied      | —                                                                  |
| Tests executed                            | `bun run test` 319/319; `bun run test:e2e` 24/24 with `E2E-RESULT:` marker | `artifacts/SWHM-S-0011/integration-test-result.md`                                                                    | Satisfied      | —                                                                  |
| Behaviour specified before implementation | Delta spec, 7 scenarios, strict-validated                                  | `openspec/changes/swhm-s-0011-bugfix-swhm-t-0105-category/specs/internationalization/spec.md`                         | Satisfied      | Archives to `openspec/changes/archive/` at sprint close            |
| Change reviewed before merge              | PR #67 (fix), PR #68 (QA report)                                           | GitHub `sweeho/my-pet-store`                                                                                          | Satisfied      | —                                                                  |
| Root-cause recorded for a defect          | RC section and fix note                                                    | `openspec/changes/swhm-s-0011-bugfix-swhm-t-0105-category/design.md`, `artifacts/SWHM-S-0011/SWHM-T-0105/fix-note.md` | Satisfied      | —                                                                  |
| Architectural decisions recorded          | One § Key Decisions bullet, cited by change id                             | `ARCHITECTURE.md`                                                                                                     | Satisfied      | —                                                                  |
| Open items survive sprint closure         | 5 follow-ups recorded; 0 accepted defects                                  | `openspec/changes/swhm-s-0011-bugfix-swhm-t-0105-category/proposal.md` § Follow-ups                                   | Satisfied      | None are tickets — planning cannot file a DEFECT by design         |
| Code coverage measured                    | No coverage tool declared in this project                                  | `Not Applicable`                                                                                                      | Not Applicable | Correctness established by 319 unit + 24 E2E + 7 scenario verdicts |
