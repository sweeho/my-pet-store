---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0005
idea: Not Applicable
branch: vortex/sprint/swhm-s-0005-1423bc6d
upstream: [artifacts/SWHM-S-0005/SPRINT-PLAN.md, artifacts/SWHM-S-0005/qa-test-report.md]
downstream: [artifacts/SWHM-S-0005/release-notes.md]
---

# Sprint summary — SWHM-S-0005

Single-defect bugfix sprint. `idea` is `Not Applicable`: the sprint was raised from a defect, not an idea.

## Tickets

| Ticket      | Type   | Title                                                                       | Outcome                                                                             |
| ----------- | ------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| SWHM-T-0063 | TASK   | Bugfix plan — SWHM-S-0005                                                   | DONE — change authored, SWHM-T-0005 refined in place (commit d36c0c2)               |
| SWHM-T-0005 | DEFECT | Light-mode `--destructive-foreground` is the same colour as `--destructive` | DONE — fixed and merged (commit fd1d36e, PR #39). Detail: `SWHM-T-0005/fix-note.md` |
| SWHM-T-0064 | TASK   | Integration QA report — SWHM-S-0005                                         | DONE — PASS verdict, no defects (commit 235ad29, PR #40)                            |
| SWHM-T-0065 | TASK   | Sprint close bundle — SWHM-S-0005                                           | In progress — this file and `release-notes.md` are its deliverable                  |

## What shipped

The sprint goal is met. `src/index.css`'s light `:root` block now sets `--destructive-foreground: oklch(1 0 0)` against the unchanged `--destructive`, a measured 4.77:1 — above the 4.5:1 WCAG AA minimum for normal text, where the two tokens were previously byte-identical at 1.00:1.

`src/theme-tokens.test.ts` is the regression guard: it parses the stylesheet directly and fails, naming the offending theme, if either theme's destructive pair collapses to one colour or the light pair drops below AA.

The behaviour is now specified rather than merely fixed. `openspec/specs/` carried no requirement about theme tokens or contrast at all, which is why the duplication survived four sprints; the change adds _Legible destructive surface colours_ to `application-foundation` with three scenarios. Decisions and the measurement table are in the change's design note — the only home for them.

## Divergence from plan

None in execution: all three `tasks.md` work items for SWHM-T-0005 were delivered as planned, on the files their ownership map named and no others.

One divergence in _planning_, decided before any code was written and recorded at the time: the defect report named the `.dark` pair as the correct reference for constructing the fix. Measurement put that pair at 2.63:1 — itself below AA. Following the ticket as written would have produced a second failing pair and a regression guard that could not pass. The report's instruction was overridden, with the reasoning written into the change's design note § D2 rather than applied silently.

## Verification

PASS. See `artifacts/SWHM-S-0005/qa-test-report.md` — all three spec scenarios pass, unit suite 246/246, 12/12 E2E specs, lint and typecheck green, zero defects (`integration-defects-resolution.md`).

Worth naming because it is what makes the verdict load-bearing: QA ran a **negative control** on the regression guard rather than only observing it green — reverting the token to its pre-fix value made 2 of the guard's 3 assertions fail with theme-naming messages, then reverted the probe. A guard that has never been seen to fail is not evidence.

## Defects Raised

None. No DEFECT ticket was created during the sprint window — verified via `a2a_list_tickets(type="defect", created_since="2026-09-11T15:12:19.690Z")`, which returned an empty list.

Three findings were surfaced during root-cause analysis and recorded as prose in the change's `proposal.md` § "Out of scope". **They carry no ticket key** — planning has no defect-creation authority — and the change directory archives at sprint close, so they are restated here to survive it:

| Ref | Finding                                                                                                                                                                                                  | Kind                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| F1  | The `.dark` destructive pair is 2.63:1, below the 4.5:1 AA minimum. Legible, unlike the light-mode case, but non-conforming. Distinct from the defect this sprint fixed.                                 | Defect-shaped; needs a ticket |
| F2  | The same duplication is almost certainly upstream in `cognizhi/vortex-boilerplate-ts-reactjs-vite-tailwindcss`, from which this repo was bootstrapped; every project generated from it inherits the bug. | External report               |
| F3  | An empty 0-byte `tailwind.config.ts` sits at the repository root, present since the initial commit, contradicting this project's documented Tailwind-CSS-first convention.                               | Defect-shaped; needs a ticket |

## Retrospective

**Went well**

- Re-measuring the defect report instead of trusting it changed the outcome. The report's stated reference pair was wrong, and it was wrong in the direction that would have produced a plausible-looking fix passing a test that was never written to fail. The cost of checking was one short conversion script.
- Writing the rejected candidate values into the design note with their measured ratios — `oklch(0.985 0 0)` at 4.56:1, `oklch(0.97 0 0)` at 4.37:1 — meant the implementing agent did not re-derive them, and did not reach for the conventional sibling-token value that clears the threshold by only 1.4%.
- The fix landed within its declared file-ownership map exactly: two files, one changed line plus one new test.

**Could improve**

- The defect was latent — no page renders `<Button variant="destructive">` — and stayed undetected for four sprints because nothing specified the token contract. The general lesson is not "check colours"; it is that a token pair with no requirement behind it has no failure mode anyone can observe. Only the destructive pair is guarded now; the other `--x` / `--x-foreground` pairs are in the same unguarded position today.
- `tasks.md` items 1.1–1.3 (SWHM-T-0063's own planning work) remain unticked in the change. The platform stamps a checkbox when its ticket _merges_, and sprint-scoped tickets commit straight to the sprint branch, so no merge event ever fires for them. The work was done; the archived change will nonetheless show three permanently outstanding boxes. Not editable from here — `openspec/` is off-limits to this ticket — and worth fixing in the stamping mechanism rather than by hand.
- F1 and F3 are defect-shaped findings with no ticket row behind them. The only thing keeping them alive is this section and a broadcast.

## Compliance / Control Evidence

| Control                                            | Evidence                                                          | Location                                                                                                  | Status                   | Exception                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| Change planned and specified before implementation | OpenSpec change, strict-validated; per-defect plan                | `openspec/changes/swhm-s-0005-bugfix-swhm-t-0005-light-mod/`, `artifacts/SWHM-S-0005/SWHM-T-0005/PLAN.md` | Satisfied                | —                                                                                 |
| Change reviewed before merge                       | PR #39 (fix), PR #40 (QA report)                                  | GitHub, `sweeho/my-pet-store`                                                                             | Satisfied                | —                                                                                 |
| Tests executed                                     | Unit 246/246, E2E 12/12, plus a negative control on the new guard | `artifacts/SWHM-S-0005/qa-test-report.md`, `integration-test-result.md`                                   | Satisfied                | —                                                                                 |
| Change verified before release                     | QA PASS verdict, all three scenarios                              | `artifacts/SWHM-S-0005/qa-test-report.md`                                                                 | Satisfied                | —                                                                                 |
| Defects dispositioned                              | 0 found at integration QA                                         | `artifacts/SWHM-S-0005/integration-defects-resolution.md`                                                 | Satisfied                | —                                                                                 |
| Out-of-scope findings recorded                     | F1–F3 above                                                       | this file, `…/proposal.md` § Out of scope                                                                 | Satisfied with exception | F1 and F3 carry no ticket key; they survive as prose only until triage files them |
