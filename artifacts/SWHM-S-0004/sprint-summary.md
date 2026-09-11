---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream:
  [
    artifacts/SWHM-S-0004/SPRINT-PLAN.md,
    openspec/changes/swhm-i-0004-product-catalog-search/design.md,
    openspec/changes/swhm-i-0004-product-catalog-search/tasks.md,
    artifacts/SWHM-S-0004/qa-test-report.md,
  ]
downstream: [artifacts/SWHM-S-0004/release-notes.md]
---

# Sprint summary — SWHM-S-0004

Sprint goal: **SWHM-I-0004: Product Catalog & Search**. Type: ENHANCEMENT. Spec-driven, change `swhm-i-0004-product-catalog-search`.

## Tickets

| Ticket      | Type  | Title                                                                         | Outcome                                                                                   |
| ----------- | ----- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| SWHM-T-0041 | TASK  | Sprint plan — SWHM-S-0004                                                     | DONE — merged as `4efe6e6`; change rewritten for this stack, 12 TASK plans, INTERFACES.md |
| SWHM-T-0042 | EPIC  | Product Catalog & Search                                                      | DONE — closed by rollup                                                                   |
| SWHM-T-0043 | STORY | Catalog foundation — entities, pagination, localization and query composition | DONE — closed by rollup                                                                   |
| SWHM-T-0044 | STORY | Catalog retrieval and search services                                         | DONE — closed by rollup                                                                   |
| SWHM-T-0045 | STORY | Catalog access, browsing experience and performance verification              | DONE — closed by rollup                                                                   |
| SWHM-T-0046 | TASK  | Catalog data model and entities                                               | DONE — merged as `dc0c589` (PR #25); `artifacts/SWHM-S-0004/SWHM-T-0046/summary.md`       |
| SWHM-T-0047 | TASK  | Pagination and navigation                                                     | DONE — merged as `0dd811b` (PR #26); `artifacts/SWHM-S-0004/SWHM-T-0047/summary.md`       |
| SWHM-T-0048 | TASK  | Catalog localization and demo seed                                            | DONE — merged as `eb0ab51` (PR #27); `artifacts/SWHM-S-0004/SWHM-T-0048/summary.md`       |
| SWHM-T-0049 | TASK  | Read-transaction consistency for catalog reads                                | DONE — merged as `ed9ed83` (PR #28); `artifacts/SWHM-S-0004/SWHM-T-0049/summary.md`       |
| SWHM-T-0050 | TASK  | Catalog query composition layer                                               | DONE — merged as `96eee38` (PR #29); `artifacts/SWHM-S-0004/SWHM-T-0050/summary.md`       |
| SWHM-T-0051 | TASK  | Category retrieval service                                                    | DONE — merged as `3186989` (PR #33); `artifacts/SWHM-S-0004/SWHM-T-0051/summary.md`       |
| SWHM-T-0052 | TASK  | Product retrieval service                                                     | DONE — merged as `d65aba1` (PR #30); `artifacts/SWHM-S-0004/SWHM-T-0052/summary.md`       |
| SWHM-T-0053 | TASK  | Item retrieval service                                                        | DONE — merged as `4198908` (PR #31); `artifacts/SWHM-S-0004/SWHM-T-0053/summary.md`       |
| SWHM-T-0054 | TASK  | Item search service                                                           | DONE — merged as `637b42b` (PR #32); `artifacts/SWHM-S-0004/SWHM-T-0054/summary.md`       |
| SWHM-T-0055 | TASK  | Catalog facade and public HTTP surface                                        | DONE — merged as `26ff948` (PR #34); `artifacts/SWHM-S-0004/SWHM-T-0055/summary.md`       |
| SWHM-T-0056 | TASK  | Catalog browsing screens and end-to-end coverage                              | DONE — merged as `2fab095` (PR #35); `artifacts/SWHM-S-0004/SWHM-T-0056/summary.md`       |
| SWHM-T-0057 | TASK  | Catalog performance verification                                              | DONE — merged as `0dfa511` (PR #36); `artifacts/SWHM-S-0004/SWHM-T-0057/summary.md`       |
| SWHM-T-0060 | TASK  | Integration QA report — SWHM-S-0004                                           | DONE — merged as `5967ce4` (PR #37); verdict PASS                                         |
| SWHM-T-0061 | TASK  | Sprint close bundle — SWHM-S-0004                                             | DONE — this file and `release-notes.md`                                                   |

## What shipped

The `catalog-browsing` capability, in three STORYs of twelve sequenced TASKs: six tables (`category`, `product`, `item` and their per-locale `_details` siblings) with five supporting indexes and migration `drizzle/0004_sloppy_ultimates.sql`; the `catalog/` capability module over them — entity types, `Page`/`hasNext` construction, locale resolution, a read transaction, one query-composition module, four retrieval and search services and a seven-operation facade; seven public `GET /api/catalog/**` routes; and four browsing screens under `src/pages/catalog/` with `e2e/catalog.spec.ts` covering the browse and search journeys in a real browser. A demo catalogue of five categories in three locales is seeded outside Vitest.

All four of idea SWHM-I-0004's acceptance criteria hold on the integrated branch, all 23 delta-spec scenarios returned a pass verdict, and all 74 `tasks.md` checkboxes are ticked. Sprint goal met.

The capability is deliberately public — no catalog route reads the sign-on cookie and `auth/protected-resources.ts` is unchanged (design.md D6) — and a signed-on customer's stored `preferred_language` now also selects the catalogue's language.

## Divergence from plan

- **Phase 3's four services merged out of plan order.** SWHM-T-0052/0053/0054 landed as PRs #30–#32 and SWHM-T-0051 last as PR #33, against the plan's 0051-first listing. All four depend only on SWHM-T-0050 and own disjoint files, so the order was free; SWHM-T-0052's summary records it coded straight against `catalog/query.ts` without `category.ts` present. No rework, no missing work.
- **`searchPredicate` takes a parameter INTERFACES.md did not name.** Its stub was `searchPredicate(keywords: string[])` with no return type or full parameter list; the shipped signature adds `fields: AnySQLiteColumn[]`, because "OR across fields" is not expressible without the columns and no other source said how they would reach the module. Additive, no fixed contract broken — recorded in SWHM-T-0050's summary § Notes.
- **`parsePagination` is duplicated across the four list routes rather than shared.** SWHM-T-0055 reasoned from file ownership: PLAN.md step 5 places validation in the routes, and a shared module inside `catalog/` would have exceeded that ticket's ownership map. Recorded in its summary; a candidate for consolidation the next time a catalog route is touched, not a defect.
- **Item lists label items by `description`, not by a name.** The `Item` type fixed in `catalog/types.ts` (SWHM-T-0046, per INTERFACES.md) exposes the parent `productName` but no item-specific name, so listing several items under one product by `productName` would have shown identical text. SWHM-T-0056 used `item.description` instead and recorded it. The behaviour is consistent with the legacy application's own pattern; the underlying type decision was made at planning, not in the ticket.
- **SWHM-T-0057 shipped as a test-only ticket.** `EXPLAIN QUERY PLAN` confirmed the five indexes added in SWHM-T-0046 are used at 1,000-category / 2,000-product / 2,000-item scale, so no new index and no source change was needed. The ticket was planned to allow for one.
- **No `SPEC-DISCREPANCIES.md` file this sprint**, unlike SWHM-S-0002 and SWHM-S-0003. The eight discrepancies between the Java EE extraction and this stack are recorded as `design.md` § Spec discrepancies (S1–S8) instead, which is where a spec-driven sprint's decisions belong. Observation about artifact shape; the content is complete and QA used it.
- **Root docs needed no change at close.** `PRODUCT.md` (capability map row for `catalog-browsing`, § Not yet decided on who administers the catalogue) and `ARCHITECTURE.md` (§ Directory structure, § Data model, § Cross-cutting constraints, and three § Key Decisions entries citing this change) were brought to target state during planning at SWHM-T-0041 (`4efe6e6`) and verified at close against what actually shipped. `DESIGN.md` was not touched in either place: the design system gained nothing — the four screens are built from existing patterns, and the idea carries no design blocks or mockup (design.md § S8). `AGENTS.md` is human-authored and never rewritten.

## Verification

**PASS.** See `qa-test-report.md`: 23/23 delta-spec scenarios and 4/4 idea acceptance criteria verified, `bun run test` green at 243/243 across 49 files, the Playwright suite executed for real at 12 passed / 0 failed / 0 skipped, and `bun run lint` and `bun run typecheck` both exiting 0 on the integrated branch. One defect was found and fixed in place — `integration-defects-resolution.md`, DEFECT-1 — in a SWHM-S-0003 test file rather than in this sprint's code.

No coverage figure is available: the repository configures no coverage tool, the same state as the two prior sprints. `qa-test-report.md` § Coverage Summary records this rather than estimating one.

## Defects Raised

One, and it remains open.

| Ticket      | What                                                              | Filed by         | Status  |
| ----------- | ----------------------------------------------------------------- | ---------------- | ------- |
| SWHM-T-0059 | Flaky E2E: `e2e/customer-profile.spec.ts` save-then-render timing | implementation-2 | BACKLOG |

**Derived conclusion, for triage, not a verified fact:** SWHM-T-0059 and integration QA's DEFECT-1 appear to be the same race in the same spec file, filed roughly fourteen minutes apart by two different agents. DEFECT-1 was fixed in place on this branch — one line, `await expect(page).toHaveURL(/\/signon-welcome$/);` after the sign-in click, mirroring `e2e/signon.spec.ts` — and the suite has been green since. SWHM-T-0059 carries no sprint and nothing dispatched it, so it is still BACKLOG. Triage should confirm the match against `integration-defects-resolution.md` and close it if it holds, rather than dispatching a second fix for an already-fixed race.

Two improvement-labelled TASKs are also open, unassigned, for triage:

| Ticket      | What                                                                                | Filed by | Status  |
| ----------- | ----------------------------------------------------------------------------------- | -------- | ------- |
| SWHM-T-0058 | Decide a money representation before order arithmetic depends on one (design.md D7) | planning | BACKLOG |
| SWHM-T-0062 | No entry point to `/catalog` from the home page or any navigation                   | planning | BACKLOG |

SWHM-T-0062 was found while writing this bundle: the four catalog screens are reachable only by typing the URL — `src/pages/index.tsx` is still the template landing page with `href="#"` placeholders, and no shared navigation component exists. Nothing in this sprint promised one, and `src/pages/index.tsx` is outside every ticket's ownership map, so it is a gap between capabilities rather than a defect in this one.

## Retrospective

**Went well**

- Pinning every table shape, type and signature in `INTERFACES.md` before any ticket started held across twelve tickets with disjoint file ownership. Four services merged out of the planned order with no rework, and the single deviation from a pinned shape was an additive parameter on a stub that carried no signature to begin with.
- Recording the eight Java-EE-versus-this-stack discrepancies in `design.md` rather than editing the extracted spec meant QA had a pre-agreed answer for every scenario naming a legacy artifact. All 23 scenarios returned a verdict with no adjudication round and no `SPEC-GAP`.
- Making performance a ticket that ships its own test at realistic scale caught a fixture defect (`PF-05`: a single-locale fixture makes the locale index non-selective, so SQLite correctly prefers a scan) instead of shipping a false green. A smaller fixture would have asserted nothing.
- Deciding at planning that the demo seed runs only outside Vitest (D9) meant no integration test asserts against shared seed data — 243 tests start from an empty catalogue and control their own fixtures.

**Could improve**

- The same E2E race was diagnosed twice: SWHM-T-0059 filed during execution, then DEFECT-1 investigated from scratch at integration QA. A defect filed mid-sprint is not visible to the next agent that hits the same symptom, so the sprint paid for the diagnosis twice and now closes with an open ticket for a fix that has already landed.
- Chromium is still absent from implementation containers — a third consecutive sprint, now across roughly eighteen tickets. Every catalog ticket fell back to `verify` and its browser assertions were first executed at CI and integration QA. `.vortex/agents-generated.md` already records this; it belongs in container provisioning, not in each agent's fallback reasoning.
- The capability ships complete and unreachable. Every acceptance criterion is behavioural and each one passes, yet no criterion asked whether a shopper can get to `/catalog` from the front door — so nothing failed and the gap surfaced only at close. An acceptance criterion about reachability, not just behaviour, would have caught it in planning.
- `Item` carrying no item-specific name field was settled at planning and then forced a display decision in the last UI ticket, where the cost of it was first visible. The type was right for the spec's 13 attributes; the screen's need for a distinguishing label was not considered alongside it.

## Compliance / Control Evidence

| Control                                | Evidence produced                                                        | Location                                                          | Status         | Exception                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| Change specified before build          | OpenSpec change: proposal, design, 23-scenario delta spec                | `openspec/changes/swhm-i-0004-product-catalog-search/`            | Satisfied      | —                                                                                |
| Work planned and traceable to the spec | Per-ticket PLAN.md; 74/74 `tasks.md` checkboxes ticket-tagged and ticked | `artifacts/SWHM-S-0004/SWHM-T-00{46..57}/PLAN.md`                 | Satisfied      | —                                                                                |
| Change reviewed before merge           | Ticket mini-PRs #25–#37 on the sprint branch                             | PR #25 … #37                                                      | Satisfied      | —                                                                                |
| Tests executed                         | `TDD-RESULT` markers per ticket; unit suite 243/243, E2E 12/12           | `artifacts/SWHM-S-0004/SWHM-T-00{46..57}/tdd-test-result.md`      | Satisfied      | Browser tier ran in CI and at QA, not in implementation containers (no Chromium) |
| Change verified before release         | QA report, PASS verdict; 23/23 scenarios, 4/4 idea criteria              | `artifacts/SWHM-S-0004/qa-test-report.md`                         | Satisfied      | —                                                                                |
| Defects dispositioned                  | DEFECT-1 fixed in place; SWHM-T-0059 open in BACKLOG, recorded above     | `artifacts/SWHM-S-0004/integration-defects-resolution.md`         | Satisfied      | SWHM-T-0059 closes after triage, not within this sprint                          |
| Deviations from specification recorded | 8 discrepancies (S1–S8) with resolutions, extracted spec left unedited   | `openspec/changes/swhm-i-0004-product-catalog-search/design.md`   | Satisfied      | —                                                                                |
| Test coverage measured                 | None — no coverage tool configured in the repository                     | `artifacts/SWHM-S-0004/qa-test-report.md` § Coverage Summary      | Not Applicable | Recorded as unmeasured rather than estimated; same state as SWHM-S-0002/0003     |
| Schema change controlled               | Migration generated and committed alongside the schema edit              | `drizzle/0004_sloppy_ultimates.sql`, `drizzle/meta/_journal.json` | Satisfied      | —                                                                                |
| Release contents recorded              | Release notes                                                            | `artifacts/SWHM-S-0004/release-notes.md`                          | Satisfied      | —                                                                                |
