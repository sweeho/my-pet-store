---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0010
idea: Not Applicable
branch: vortex/sprint/swhm-s-0010-171cf530
upstream: [artifacts/SWHM-S-0010/SPRINT-PLAN.md, artifacts/SWHM-S-0010/qa-test-report.md]
---

# Sprint summary — SWHM-S-0010

Goal: **Bugfix — SWHM-T-0098: product detail page shows generic "Not Found" instead of the language-unavailable panel.** A single-defect sprint, carried by one OpenSpec change, `swhm-s-0010-bugfix-swhm-t-0098-product-d`.

## Tickets

| Ticket      | Type   | Title                                                                                   | Outcome                                                                                                            |
| ----------- | ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| SWHM-T-0102 | TASK   | Bugfix plan — SWHM-S-0010                                                               | DONE (`0cb4b17`) — authored the change (proposal, design, one delta spec, tagged tasks) and the defect's `PLAN.md` |
| SWHM-T-0098 | DEFECT | Product detail page shows generic "Not Found" instead of the language-unavailable panel | DONE (`2fc2e9a`, PR #64)                                                                                           |
| SWHM-T-0103 | TASK   | Integration QA report — SWHM-S-0010                                                     | DONE (`608f978`, PR #65) — PASS                                                                                    |
| SWHM-T-0104 | TASK   | Sprint close bundle — SWHM-S-0010                                                       | DONE — this file and `release-notes.md`                                                                            |

## What shipped

The committed defect is closed and the sprint goal is met.

- **A product that exists but is not translated now offers a way out instead of a dead end.** The product screen distinguishes the two causes of a 404 and renders the language-unavailable panel — heading naming the language, a body saying nothing is broken, "View in English (US)" and a language switcher — where it previously rendered the generic Not Found page. An id that names no product still reaches Not Found, unchanged. (SWHM-T-0098)
- **The fix went into the shared hook, not the one screen.** `useCatalogFetch` now reads the 404 body and returns the server's `reason` in place of the boolean that discarded it, parsing defensively so a missing or unparseable body still yields `not-found`. The item screen's page-local duplicate, `useItemFetch`, is deleted and that screen reads the shared hook — its rendered output and its entire test file are unchanged, which is the evidence the swap was behaviour-preserving.
- **The category screen's latent instance of the same fault closed with it.** It branched on the same discarded boolean. Removing `notFound` from the hook's return type made the type checker require that site to be revisited, which is why a latent fault nobody would have gone looking for did not survive the sprint that fixed its sibling.

Net effect is less code than before: one fetch hook instead of two, and one browser-side `MissingReason` declaration instead of two. The suite grew from 311 to 318 unit tests and from 22 to 23 browser tests.

`ARCHITECTURE.md` gained one line in § Cross-cutting constraints on the planning ticket — one hook reads the catalogue and it surfaces why a read failed, shaped as the sibling of the locale-resolution rule already there. Deliberately **no** § Key Decisions entry: that section already records the server-side decision this defect violated (authored in `swhm-i-0005-multi-language-support`), and the decision did not change — it was half-consumed. `PRODUCT.md` is unchanged: no capability gained or lost a line. `DESIGN.md` is unchanged: § Unavailable content states already described the exact three-part pattern the product screen now implements, so the design system was never what was wrong. `AGENTS.md` is human-authored and was read, not written.

## Divergence from plan

None. The fix landed as `PLAN.md` specified, step for step, within its declared file ownership.

One addition the implementation made beyond the plan, and it was right to: the product screen's pagination controls are now suppressed on the missing-translation branch. The plan did not mention them, and without that guard the Previous/Next buttons would have rendered underneath the panel.

## Verification

Integration QA on the integrated sprint branch returned **PASS** with no defects found and no fix-in-place work required — see `artifacts/SWHM-S-0010/qa-test-report.md`. 5 of 5 delta-spec scenarios pass, 318 unit tests in 56 files, and 23 Playwright tests, with `bun run verify` (lint + typecheck + unit) green.

## Defects Raised

None during the sprint. Integration QA found none, and no defect was raised mid-sprint.

**One found at close, by this ticket, verifying the shipped code rather than the fix notes' account of it: SWHM-T-0105** — see below. It was not caught by QA because every scenario in the delta spec passes; the defect is in text the spec does not constrain.

## Defect found at close — wrong noun on the category screen

`/catalog/category/BIRDS?locale=de_DE` now renders the language-unavailable panel reading **"This item has nothing translated into de_DE"** on a category page.

The mechanism: the panel derives its body noun from `entity`, which this sprint added with values `"product" | "item"` defaulting to `"item"`. The product screen passes `entity="product"`; the category screen's new missing-translation branch passes nothing and so falls back to `"item"`. It is reachable — not through the language switcher, which offers only the three supported languages, but through the `locale` search parameter, which ARCHITECTURE.md's resolution order leads with precisely so a screen in a language can be shared or bookmarked. `catalog/locale.ts` deliberately does not reject an unsupported locale; the category row exists, no `de_DE` detail row does, so the endpoint correctly answers `missing-translation`.

This is a planning error, not an implementation one. `design.md` D3 defined the prop as `"product" | "item"` while D1 explicitly brought the category screen into scope, and the implementation followed the plan exactly. Severity is low — cosmetic copy on an edge path, and still an improvement on the generic Not Found page that stood there before this sprint — but it is real, it is user-visible, and it is in code this sprint wrote.

**Filed as SWHM-T-0105** (DEFECT, P3, BACKLOG), with the mechanism, the reachability path and the fix. The fix is one word in the type and one prop on one line: widen `entity` to include `"category"` and pass it from the category screen.

## Follow-ups carried forward

- **Four of the five capability specs still open with a placeholder Purpose** — `internationalization`, `account-management`, `catalog-browsing` and `user-authentication` each begin "TBD - created by archiving change …. Update Purpose after archive." Only `application-foundation` has a real one. A change delta cannot fix this; the text lives in `openspec/specs/`, which the platform owns, so it needs a deliberate pass by someone who can edit the spec of record. Recorded in this sprint's `proposal.md`.
- **`MissingReason` is still mirrored rather than shared** between `catalog/availability.ts` and `src/pages/catalog/shared.ts`. Two browser-side copies became one this sprint; `catalog/types.ts` (pure types, no imports, already imported by every catalogue screen) is the right home for the last one, but moving it touches the `catalog/catalog.ts` barrel.
- **SWHM-T-0090** (BACKLOG) — "Ship real product photography for the 20 seeded catalog item images". Still stale after SWHM-S-0009 shipped illustrations at all 20 locations; what remains is a content decision, and the ticket needs narrowing or closing.
- **SWHM-T-0091** (BACKLOG) — the stale README route tree and the unused `API_BASE_URL` placeholder. Unchanged since SWHM-S-0008.
- The 0-byte `tailwind.config.ts` and `middleware/auth.ts`'s hardcoded `{ name: "Yeasin" }`, both carried unfixed from SWHM-S-0008 and SWHM-S-0009.

## Retrospective

**What went well**

- Fixing the shared hook rather than the reported screen was the whole sprint. It closed the reported defect, deleted the page-local duplicate that caused it, and closed a latent instance on a third screen — for less code than the narrow fix would have added. Removing `notFound` from the return type is what made it safe: the type checker, not a reviewer's diligence, is what guaranteed no call site was missed.
- The item screen's test file is byte-identical across a change that replaced its entire data-fetching layer. That is the cleanest available evidence that a refactor preserved behaviour, and it was designed in as a plan step rather than noticed afterwards.
- Root-causing found the category screen's latent fault, which the Inspector's report did not mention and which no test would have caught. The three-screen comparison table in `design.md` is what surfaced it — reading the two screens the defect did _not_ name.

**What could improve**

- **The defect found at close is a planning error of exactly the kind this sprint was fixing.** The sprint's own thesis is that handling one screen and leaving its siblings is what creates this class of bug. `design.md` D1 brought all three screens into scope and then D3, four paragraphs later, defined the noun prop for two of them. The lesson is narrow and actionable: when a decision enumerates a set, check it against the set the neighbouring decision just widened.
- **QA passed it, correctly, and that is worth understanding rather than criticising.** Every delta-spec scenario holds; the wrong noun sits in text no scenario constrains, because the scenario I wrote for it — "its text refers to the product, and does not describe it as an item" — was written about the product screen only. A scenario derived from one screen verifies one screen.
- Three sprints running, the "Follow-ups / out of scope" list has grown and nothing has been drawn from it. Recording a follow-up is not the same as tracking one: several of the items above have now been restated in four consecutive sprint documents without becoming work anyone can pick up. Filing SWHM-T-0105 at close rather than adding a fifth restatement is the difference, and the standing follow-ups deserve the same treatment — a document nobody is assigned to read is not a backlog.

## Compliance / Control Evidence

| Control                                | Evidence                                                         | Location                                                     | Status    | Exception                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| Change specified before implementation | OpenSpec change — proposal, design, one delta spec, tagged tasks | `openspec/changes/swhm-s-0010-bugfix-swhm-t-0098-product-d/` | Satisfied | —                                                                                                    |
| Change verified before release         | QA report, PASS verdict, 5/5 scenarios                           | `artifacts/SWHM-S-0010/qa-test-report.md`                    | Satisfied | —                                                                                                    |
| Defects dispositioned                  | 0 at integration QA; 1 found at close, filed as SWHM-T-0105      | this file § Defect found at close                            | Satisfied | —                                                                                                    |
| Tests executed                         | 318 unit + 23 E2E green on the integrated branch                 | `artifacts/SWHM-S-0010/integration-test-result.md`           | Satisfied | Browser tier not runnable in implementation containers; executed in CI and at integration QA instead |
| Per-ticket fix recorded                | `fix-note.md` + `tdd-test-result.md` for the defect              | `artifacts/SWHM-S-0010/SWHM-T-0098/`                         | Satisfied | —                                                                                                    |
| Change reviewed before merge           | PRs #64–#65, squash-merged to the sprint branch                  | Repository PR history                                        | Satisfied | —                                                                                                    |
| Release contents recorded              | release notes                                                    | `artifacts/SWHM-S-0010/release-notes.md`                     | Satisfied | —                                                                                                    |
