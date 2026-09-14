---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0008
idea: Not Applicable
branch: vortex/sprint/swhm-s-0008-6b835023
upstream: [artifacts/SWHM-S-0008/SPRINT-PLAN.md, artifacts/SWHM-S-0008/qa-test-report.md]
---

# Sprint summary — SWHM-S-0008

Goal: **Bugfix found by Inspector.** An idea-less defect batch — five defects the Inspector raised against `dev` at `7a82318`, carried by one OpenSpec change, `swhm-s-0008-bugfix-found-by-inspector`.

## Tickets

| Ticket      | Type   | Title                                                                                  | Outcome                                                                                                |
| ----------- | ------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| SWHM-T-0085 | TASK   | Bugfix plan — SWHM-S-0008                                                              | DONE — authored the change (proposal, design, three delta specs, tasks) and five per-ticket `PLAN.md`s |
| SWHM-T-0080 | DEFECT | Landing header/mobile-menu logo hotlinks a tailwindcss.com demo asset                  | DONE (`6f79df7`, PR #53)                                                                               |
| SWHM-T-0081 | DEFECT | Landing nav/hero links are all dead placeholders                                       | DONE (`ae63a3a`, PR #56)                                                                               |
| SWHM-T-0082 | DEFECT | Bootstrap scaffold routes under `/users` still live in the production build            | DONE (`3313f36`, PR #54)                                                                               |
| SWHM-T-0083 | DEFECT | Every catalog item image 404s — no `/images` asset directory shipped                   | DONE (`b8fa68e`, PR #52)                                                                               |
| SWHM-T-0084 | DEFECT | Panel's "Change language" button stops working after the switcher has been opened once | DONE (`3dbbfa4`, PR #55)                                                                               |
| SWHM-T-0088 | TASK   | Integration QA report — SWHM-S-0008                                                    | DONE (`be7acda`, PR #57) — PASS                                                                        |
| SWHM-T-0089 | TASK   | Sprint close bundle — SWHM-S-0008                                                      | DONE — this file and `release-notes.md`                                                                |

## What shipped

All five committed defects closed, and the sprint goal is met. Four of the five were the same underlying condition — the application still shipping pieces of the Tailwind Plus template it was generated from — and the fifth was a real interaction bug with a precise mechanism.

- `/` no longer makes a third-party request. Both hotlinked logos are now `src/components/StoreMark.tsx`, an in-repo inline SVG mark. (SWHM-T-0080)
- `/` now routes. The nav is `Catalog` → `/catalog` and `My account` → `/customer`; both "Log in" controls and the hero CTA reach `/signon` and `/catalog`. The two controls naming destinations this product does not have were removed rather than pointed somewhere plausible. (SWHM-T-0081)
- `/users`, `/users/:id` and `/users/profile` no longer serve hardcoded demo people; the three page files are deleted and the paths fall through to the catch-all. The database-backed `routes/api/users/**` and the `users` table are untouched by design — `e2e/legacy-routes.spec.ts` asserts both halves of that split. (SWHM-T-0082)
- An item image that fails to load falls back once to a committed placeholder with `alt` preserved. (SWHM-T-0083)
- The missing-translation panel owns its own language menu instead of reaching across the DOM to click the header's, so the recovery control works every time rather than once per page load. (SWHM-T-0084)

Two standing records came out of the work: ARCHITECTURE.md gained the Key Decision behind SWHM-T-0084 (a component never drives another component's state by synthesizing DOM events) and the § Routing note that a page file nothing links to is still a public screen — the condition that let SWHM-T-0082's scaffolds survive seven sprints. DESIGN.md was brought to target state on this ticket for the two patterns the sprint added to the system: § Brand mark and § Image states, plus a cross-reference from § Unavailable content states to the Key Decision above. PRODUCT.md is deliberately unchanged — no capability was added or removed and the product's scope and non-goals did not move; AGENTS.md is human-authored and was read, not written.

## Divergence from plan

None on scope: the five committed defects are the five that shipped, each within the file-ownership map its `PLAN.md` set, with no plan-revision escalation from any implementation agent.

One divergence in coverage, found at QA rather than at planning: the landing page's two **logo** anchors still carried the template's `href="#"`. Neither SWHM-T-0080 (whose scope was the `<img>` → `StoreMark` swap) nor SWHM-T-0081 (whose scope was the nav/hero `href`s) claimed that element, and `design.md` § D-2's destination table did not name it, so both ownership maps carved it out and it survived both. Validation found it against the `No control leads nowhere` scenario and fixed it in place (`8bffebd`).

The E2E tier could not be executed in the implementation containers — `scripts/ensure-playwright-browser.mjs` reports Chromium genuinely absent, the established limitation recorded in AGENTS.md § Notes from previous agents. SWHM-T-0082's regression spec was therefore first executed in CI and again at integration QA rather than on the implementing agent's branch. This is the documented fallback, not a gap, but it is the reason a browser-tier defect could not be caught at the ticket tier.

## Verification

**PASS.** See `qa-test-report.md` — 11 of 11 delta-spec scenarios verified on the integrated branch, 302 unit tests and 20 Playwright tests green. The one defect found during AC verification was fixed in place and re-verified; full record in `integration-defects-resolution.md` (DEFECT-1, minor, FIXED-IN-PLACE).

## Defects Raised

Two DEFECT tickets were created inside the sprint window. Both are process artifacts rather than product findings, and both were cancelled:

| Ticket      | Description                                       | Filed by | Status    |
| ----------- | ------------------------------------------------- | -------- | --------- |
| SWHM-T-0086 | Accepted gate bypass recorded against SWHM-T-0081 | ideation | CANCELLED |
| SWHM-T-0087 | Accepted gate bypass recorded against SWHM-T-0084 | ideation | CANCELLED |

DEFECT-1 (the logo `href="#"`) was found and resolved inside integration QA and never became a ticket, per the fix-in-place budget.

Three follow-ups were recorded in the change proposal while root-causing and could not be absorbed by any committed defect. They are now backlog tickets, so they outlive the change's archival at sprint close:

| Ticket      | Description                                                                                                                                         | Status                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| SWHM-T-0090 | The 20 seeded item image paths still 404 — SWHM-T-0083 stopped the broken image, not the missing assets. Needs a content decision                   | BACKLOG (improvement)                  |
| SWHM-T-0091 | Remaining template remnants — README's route tree still documents the pages SWHM-T-0082 deleted, and `API_BASE_URL` is an unused placeholder domain | BACKLOG (improvement)                  |
| SWHM-T-0027 | `middleware/auth.ts` attaches a hardcoded user to every request. Pre-existing from SWHM-S-0002; the same class of remnant as SWHM-T-0082            | BACKLOG (already raised, not re-filed) |

SWHM-T-0062 ("No entry point to /catalog from the home page or any navigation", raised at SWHM-S-0004 close) is superseded by SWHM-T-0081's delivery. It was commented rather than closed — its disposition belongs to Triage.

## Retrospective

**What went well**

- The pre-authored `PLAN.md` ownership maps held. Five defects landed in parallel across overlapping files — `src/pages/index.tsx` was touched by two tickets, `src/pages/catalog/item/[itemId].tsx` by two — with no collision and no revision request, because each map named the specific elements a ticket owned rather than the file.
- Root-causing before decomposing paid for itself on SWHM-T-0084. The mechanism (`@headlessui/react`'s unreset `pointerType` ref) explains the reported asymmetry exactly, including why a fresh `?locale=zh_CN` load still worked; a fix aimed at the symptom would have dispatched a richer synthetic event sequence and produced a bug that reappears on the next dependency bump.
- Treating four defects as one scenario gap rather than four independent bugs produced a `MODIFIED` requirement carrying regression scenarios, so the spec of record now forbids the class — template remnants — not just the five instances.

**What could improve**

- An ownership map that carves an element out of a file needs an owner for the carved-out part, or it needs to say explicitly that nothing owns it. DEFECT-1 is precisely the residue of two maps each excluding the same element; the planning-side fix is to check that the union of a file's ownership rows covers every element the delta spec's scenarios can observe.
- The scenario `No control leads nowhere` was verifiable at the ticket tier and was not verified there: SWHM-T-0081's own regression test explicitly excluded the logo links with a scope comment. A test that excludes something because another ticket owns it should name that ticket, so the exclusion expires when that ticket lands.
- These were five defects an Inspector found on `dev` after seven sprints, four of them visible on the first screen of the application. The cheaper place to catch a template remnant is the sprint that builds on top of it.

## Compliance / Control Evidence

| Control                                | Evidence                                                            | Location                                                  | Status    | Exception                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| Change specified before implementation | OpenSpec change — proposal, design, three delta specs, tagged tasks | `openspec/changes/swhm-s-0008-bugfix-found-by-inspector/` | Satisfied | —                                                                                                    |
| Change verified before release         | QA report, PASS verdict, 11/11 scenarios                            | `artifacts/SWHM-S-0008/qa-test-report.md`                 | Satisfied | —                                                                                                    |
| Defects dispositioned                  | 1 found at integration QA, 1 fixed in place and re-verified         | `artifacts/SWHM-S-0008/integration-defects-resolution.md` | Satisfied | —                                                                                                    |
| Tests executed                         | 302 unit + 20 E2E green on the integrated branch                    | `artifacts/SWHM-S-0008/integration-test-result.md`        | Satisfied | Browser tier not runnable in implementation containers; executed in CI and at integration QA instead |
| Per-ticket fix recorded                | `fix-note.md` + `tdd-test-result.md` for each of the five defects   | `artifacts/SWHM-S-0008/SWHM-T-008{0,1,2,3,4}/`            | Satisfied | —                                                                                                    |
| Change reviewed before merge           | PRs #52–#57, squash-merged to the sprint branch                     | Repository PR history                                     | Satisfied | —                                                                                                    |
| Release contents recorded              | release notes                                                       | `artifacts/SWHM-S-0008/release-notes.md`                  | Satisfied | —                                                                                                    |
