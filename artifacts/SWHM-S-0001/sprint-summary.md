---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0001
idea: SWHM-I-0001
branch: vortex/sprint/swhm-s-0001-64017bed
upstream: [artifacts/SWHM-S-0001/SPRINT-PLAN.md, artifacts/SWHM-S-0001/qa-test-report.md]
downstream: [artifacts/SWHM-S-0001/release-notes.md]
---

# Sprint summary — SWHM-S-0001

Sprint goal: **Bootstrap My Pet Store**. Type: BOOTSTRAP. Verdict: PASS, no defects found at integration QA.

## Tickets

| Ticket      | Type  | Title                                                             | Outcome                                                                              |
| ----------- | ----- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| SWHM-T-0002 | EPIC  | Bootstrap My Pet Store                                            | DONE (container, closed by rollup)                                                   |
| SWHM-T-0003 | STORY | My Pet Store runs, is branded, and verifies from a clean checkout | DONE (container, closed by rollup)                                                   |
| SWHM-T-0001 | TASK  | Bootstrap plan — SWHM-S-0001                                      | DONE — plan, root docs and the OpenSpec change (`4cc2e8e`)                           |
| SWHM-T-0004 | TASK  | Bootstrap the application from the boilerplate                    | DONE — merged as `cbfe9a5`; detail in `artifacts/SWHM-S-0001/SWHM-T-0004/summary.md` |
| SWHM-T-0008 | TASK  | Integration QA report — SWHM-S-0001                               | DONE — merged as `f40fc47`; verdict in `artifacts/SWHM-S-0001/qa-test-report.md`     |
| SWHM-T-0009 | TASK  | Sprint close bundle — SWHM-S-0001                                 | DONE — this file and `release-notes.md`                                              |

## What shipped

The application runs, names itself My Pet Store, and proves its own pipeline. Identity is sourced from the single `STORE_NAME` constant and carried through `package.json`, `index.html`, `public/manifest.webmanifest` and the home page hero/nav copy; the unit and E2E assertions that pin those strings were updated in the same ticket. No tooling, dependency or framework change was made — the template's harness, Playwright config and CI workflow were adopted as-is, and the only CI edit was a stale header comment. The `application-foundation` capability and its three requirements are now the spec of record (`openspec/changes/swhm-i-0001-bootstrap-my-pet-store/`), and PRODUCT.md / ARCHITECTURE.md were brought to target state at planning.

Sprint goal met: every acceptance criterion on SWHM-T-0004 and every scenario in the delta spec verified pass on the integrated branch.

## Divergence from plan

Two, both minor and both recorded at the time.

- D1 — `tasks.md` 4.1 expected a clean-checkout build to emit `dist/` **and** `.output/`. This repository's Vite/Nitro integration emits `.output/public` (client bundle) and `.output/server` only; there is no top-level `dist/`. Pre-existing `vite.config.ts` behaviour, outside SWHM-T-0004's ownership map, so the build was accepted as correct and the checkbox ticked against the real output (`artifacts/SWHM-S-0001/SWHM-T-0004/summary.md`, AC-3).
- D2 — the browser tier could not be executed in the implementation container: Chromium was genuinely absent and the preflight said so, so it was not retried and no browser was installed, per the stack rule. The tier was proven instead by CI on the sprint branch and by Validation at integration QA (6/6 passed).

Backlog shape was the fixed BOOTSTRAP output — one EPIC, one STORY, one implementation TASK. No ticket was added, dropped or split during execution.

## Verification

PASS. See `artifacts/SWHM-S-0001/qa-test-report.md` for the verdict and per-scenario evidence, and `artifacts/SWHM-S-0001/integration-test-result.md` for the executed E2E run. No defects found at integration QA — `artifacts/SWHM-S-0001/integration-defects-resolution.md` records an empty summary table.

## Defects Raised

One DEFECT was filed during the sprint window. It is out of this sprint's scope, carries no sprint, and awaits triage.

| Ticket      | Description                                                                                                                                                                                                                            | Filed by                         | Current status |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------- |
| SWHM-T-0005 | Light-mode `--destructive-foreground` is the same colour as `--destructive`, so destructive-button text renders invisible in light mode; dark mode is correct. Inherited from the template and already recorded in DESIGN.md § Tokens. | planning (Stage-0 investigation) | BACKLOG        |

Two `improvement`-labelled TASKs were also raised and are likewise unscheduled: SWHM-T-0006 (empty `tailwind.config.ts` contradicts the CSS-first Tailwind v4 setup) and SWHM-T-0007 (replace the boilerplate demo data layer, auth stub and leftover scaffolding).

## Retrospective

**Went well**

- Fixing product identity in one constant (`STORE_NAME`, design.md D2) meant the rebrand had a single source and no stray duplicates — Validation's grep for boilerplate copy returned zero matches without any rework.
- Adopting the template's harness rather than re-scaffolding meant the unit suite and CI workflow were green on the first push; the sprint's whole verification cost was running gates that already existed.
- Stage-0 investigation produced the three backlog tickets above from real files, so the template's known flaws are recorded rather than rediscovered next sprint.

**Could improve**

- The container's pre-baked Chromium (chromium-1223) does not match the pinned `@playwright/test ~1.50.0` (needs chromium-1155), so Validation spent an install to run the browser tier and the implementation agent could not run it at all. Pinning the browser build to the Playwright version in the workspace image would move the E2E signal left to the ticket that writes the assertions.
- `tasks.md` 4.1 asserted a build output (`dist/`) that this stack does not produce. The checkbox was written from the template's README rather than from an observed build; planning should verify a claimed artefact path before writing it into a work item.

## Compliance / Control Evidence

| Control / policy                                | Evidence produced                                      | Location                                                                                       | Status    | Exception                                                                               |
| ----------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------- |
| Change planned and specified before build       | plan, change proposal, delta spec                      | `artifacts/SWHM-S-0001/SPRINT-PLAN.md`, `openspec/changes/swhm-i-0001-bootstrap-my-pet-store/` | Satisfied | —                                                                                       |
| Change reviewed before merge                    | ticket mini-PRs #5 (SWHM-T-0004), #6 (SWHM-T-0008)     | commits `cbfe9a5`, `f40fc47`                                                                   | Satisfied | —                                                                                       |
| Tests executed before release                   | `verify` (7 files / 20 tests) + Playwright 6/6         | `artifacts/SWHM-S-0001/integration-test-result.md`, `…/qa-test-report.md`                      | Satisfied | E2E not executable in the implementation container; executed at QA and in CI (D2 above) |
| Change verified against its acceptance criteria | per-scenario verdicts, all pass                        | `artifacts/SWHM-S-0001/qa-test-report.md`                                                      | Satisfied | —                                                                                       |
| Defects dispositioned                           | 0 found at QA; 1 pre-existing defect raised to backlog | `…/integration-defects-resolution.md`, SWHM-T-0005                                             | Satisfied | —                                                                                       |
| Continuous verification on branch pushes        | CI "CI" workflow `success` on `13ea709`                | `.github/workflows/ci.yml`                                                                     | Satisfied | —                                                                                       |
| Release contents recorded                       | release notes                                          | `artifacts/SWHM-S-0001/release-notes.md`                                                       | Satisfied | —                                                                                       |
