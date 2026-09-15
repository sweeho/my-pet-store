---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0009
idea: Not Applicable
branch: vortex/sprint/swhm-s-0009-bd3fbd00
upstream: [artifacts/SWHM-S-0009/SPRINT-PLAN.md, artifacts/SWHM-S-0009/qa-test-report.md]
---

# Sprint summary — SWHM-S-0009

Goal: **Bugfix — SWHM-T-0094, SWHM-T-0095, SWHM-T-0097.** An idea-less defect batch — three defects the Inspector raised against `dev` at `81f55c7`, carried by one OpenSpec change, `swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00`.

## Tickets

| Ticket      | Type   | Title                                                                                            | Outcome                                                                                                                    |
| ----------- | ------ | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0099 | TASK   | Bugfix plan — SWHM-S-0009                                                                        | DONE (`dcb05f6`) — authored the change (proposal, design, three delta specs, tagged tasks) and three per-ticket `PLAN.md`s |
| SWHM-T-0094 | DEFECT | Every page hotlinks Google Fonts, contradicting DESIGN.md's own third-party-host rule            | DONE (`2faaf2b`, PR #59)                                                                                                   |
| SWHM-T-0097 | DEFECT | Merely browsing the catalog anonymously corrupts the post-sign-in redirect to a raw JSON API URL | DONE (`641ac11`, PR #60)                                                                                                   |
| SWHM-T-0095 | DEFECT | No catalog item ships a real product image — every image 404s to the placeholder                 | DONE (`e3d8d18`, PR #61)                                                                                                   |
| SWHM-T-0100 | TASK   | Integration QA report — SWHM-S-0009                                                              | DONE (`7e48742`, PR #62) — PASS                                                                                            |
| SWHM-T-0101 | TASK   | Sprint close bundle — SWHM-S-0009                                                                | DONE — this file and `release-notes.md`                                                                                    |

## What shipped

All three committed defects closed, and the sprint goal is met.

- **No page fetches anything from a third-party host.** `vite.config.ts` no longer registers `unplugin-fonts`, so the `preconnect` to `fonts.gstatic.com` and the `fonts.googleapis.com/css2` stylesheet link are gone from every page's `<head>`. The `configs/` directory, its `tsconfig.node.json` include entry and the `unplugin-fonts` dependency went with it. Nothing a visitor sees moved: the registered face, Space Grotesk, was declared by no stylesheet in the repository, so it was being fetched and applied to nothing. (SWHM-T-0094)
- **Every catalogue item shows its own picture.** Twenty committed flat-vector illustrations now sit at the locations `catalog/seed.ts` names — one per breed across birds, cats, dogs, fish and reptiles — and the seed's 40 `image` values point at them. The placeholder is still there for an asset that genuinely might not exist; it is no longer what every item detail page renders. (SWHM-T-0095)
- **Browsing the catalogue before signing on no longer changes where you land.** `middleware/signon.ts` records a post-sign-on return address only for a navigation, classified by a new pure `isNavigationRequest` predicate in `auth/signon-filter.ts`. A denied background request is answered `401` rather than redirected to an HTML page it cannot parse. `evaluateAccess`, `AccessVerdict` and `PROTECTED_RESOURCES` are unchanged, so what is protected and who may reach it did not move. (SWHM-T-0097)

Each fix shipped with the guard whose absence let the defect through, not just the fix: a browser-tier network assertion in `e2e/home.spec.ts` that records every request and every `<head>` link the home page issues; `catalog/seed-images.test.ts`, which walks `CATALOG_SEED` and asserts each distinct location resolves to a file under `public/`; and `auth/signon-filter.test.ts` SF-04..SF-10 pinning the predicate's header precedence.

The one standing record this sprint produced is in `ARCHITECTURE.md`, brought to target state on the planning ticket: § Stack and § Directory structure no longer name `unplugin-fonts` or `configs/`, § Request flow describes the navigation/401 split the middleware now implements, § Cross-cutting constraints gained an asset-origin rule and the denial-versus-return-address distinction, and § Key Decisions gained one entry — a protected path may be denied to anyone, but only a navigation sets the return address — which binds every later capability that adds a protected resource. `PRODUCT.md` is deliberately unchanged: no capability was added or removed and the product's scope and non-goals did not move. `DESIGN.md` is deliberately unchanged: no token, type scale, grid, interaction pattern or accessibility standard moved, and the two rules these defects violated (§ Brand mark, § Image states) already said exactly the right thing — the gap was enforcement, which is why the remedies are tests. `AGENTS.md` is human-authored and was read, not written.

## Divergence from plan

None. All three tickets landed exactly as `PLAN.md` specified, the ownership maps stayed disjoint as `design.md`'s Sequencing section predicted, and no plan-revision request was raised.

One correction to the planning artifacts: `proposal.md` and `design.md` both say "41 item-detail rows". There are 40 — the 41st match was the `image: string` line in the seed's own type declaration. The count does not change any decision, and `catalog/seed-images.test.ts` IT-02 now pins the set of 20 distinct locations so the number cannot drift unnoticed again. The committed change is not edited to fix this; `openspec/` belongs to the platform at close.

## Verification

Integration QA on the integrated sprint branch returned **PASS** with no defects found and no fix-in-place work required — see `artifacts/SWHM-S-0009/qa-test-report.md`. 13 of 13 delta-spec scenarios pass across the three capabilities, 311 unit tests in 56 files, and 22 Playwright tests across all 7 spec files, with `bun run lint`, `bun run typecheck` and `bun run build` green.

## Defects Raised

None. Integration QA found no defects (`artifacts/SWHM-S-0009/integration-defects-resolution.md` records the empty set), and no defect was raised mid-sprint.

## Follow-ups carried forward

Not defects and not left open by this sprint's work, but they outlive it and belong somewhere a reader will find them.

- **SWHM-T-0090** (BACKLOG) — "Ship real product photography for the 20 seeded catalog item images". Its premise has moved: the 404s are gone and every item now ships an illustration, so what remains is a content decision about whether photography is wanted instead. The ticket's title and scope are now stale and someone should either narrow it or close it.
- **SWHM-T-0091** (BACKLOG) — the stale README route tree and the unused `API_BASE_URL` placeholder. Unchanged since SWHM-S-0008.
- Four items recorded under `## Follow-ups / out of scope` in the change's `proposal.md`, found while root-causing and covered by no committed defect: the 0-byte `tailwind.config.ts`; `middleware/auth.ts` still attaching `{ name: "Yeasin" }` to every request; the `API_BASE_URL` placeholder above; and `GET /api/signon/check` accepting any same-origin path its caller names as a return address.

## Retrospective

**What went well**

- Root-causing against the working tree before planning overturned the reported fix on two of the three defects. SWHM-T-0094's report asked for the font to be self-hosted; reading the code showed the face is declared by no stylesheet anywhere, so self-hosting would have committed four `.woff2` weights to serve a typeface no element selects. SWHM-T-0097's report pointed at the protected-resources list, which is correct and did not move. Both checks took minutes and changed what shipped.
- Three tickets ran in parallel with genuinely disjoint ownership maps — down to owning a different browser-tier spec file each — and integration QA found nothing to fix. The previous sprint's five overlapping maps needed one fix-in-place round; this sprint's three needed none.
- Every fix carried its own regression guard chosen for the tier that can actually observe the failure, which is what the previous sprint got wrong (below).

**What could improve**

- **SWHM-T-0094 is SWHM-T-0080 a second time, and the spec already forbade it.** SWHM-S-0008 replaced a hotlinked logo and wrote the scenario _Home page requests no third-party asset_ — "every asset the page requests is served from the application's own origin" — then enforced it with a jsdom test that inspected two `<img>` elements. The Google Fonts link was in the same document at the same time and survived, because the enforcement tier could not see a `<head>` link Vite injects at build time. A scenario that quantifies over _every request a page issues_ has to be verified where every request is observable; anything narrower makes the scenario read as covered when it is not.
- **SWHM-T-0095 is the second visit to the same 404s.** SWHM-S-0008 shipped the placeholder fallback, recorded the real fix as a follow-up (SWHM-T-0090), and wrote in its own release notes that the placeholder "is a degradation, not the picture". That follow-up then sat in BACKLOG until the Inspector re-raised the same condition as a defect and it consumed a sprint slot. A fix that is knowingly partial needs its remainder committed to a sprint, not recorded in a document, or it returns as a defect.
- Two of this sprint's three defects were therefore re-treads of work the previous sprint had already touched. The pattern worth watching is not "the Inspector finds things" but "the Inspector finds the part we knowingly left".

## Compliance / Control Evidence

| Control                                | Evidence                                                            | Location                                                     | Status    | Exception                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| Change specified before implementation | OpenSpec change — proposal, design, three delta specs, tagged tasks | `openspec/changes/swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00/` | Satisfied | —                                                                                                    |
| Change verified before release         | QA report, PASS verdict, 13/13 scenarios                            | `artifacts/SWHM-S-0009/qa-test-report.md`                    | Satisfied | —                                                                                                    |
| Defects dispositioned                  | 0 found at integration QA; empty set recorded and marked COMPLETE   | `artifacts/SWHM-S-0009/integration-defects-resolution.md`    | Satisfied | —                                                                                                    |
| Tests executed                         | 311 unit + 22 E2E green on the integrated branch                    | `artifacts/SWHM-S-0009/integration-test-result.md`           | Satisfied | Browser tier not runnable in implementation containers; executed in CI and at integration QA instead |
| Per-ticket fix recorded                | `fix-note.md` + `tdd-test-result.md` for each of the three defects  | `artifacts/SWHM-S-0009/SWHM-T-00{94,95,97}/`                 | Satisfied | —                                                                                                    |
| Change reviewed before merge           | PRs #59–#62, squash-merged to the sprint branch                     | Repository PR history                                        | Satisfied | —                                                                                                    |
| Release contents recorded              | release notes                                                       | `artifacts/SWHM-S-0009/release-notes.md`                     | Satisfied | —                                                                                                    |
