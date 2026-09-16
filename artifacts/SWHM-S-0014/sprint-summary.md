---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
idea: SWHM-I-0008
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream: [artifacts/SWHM-S-0014/SPRINT-PLAN.md, artifacts/SWHM-S-0014/qa-test-report.md]
downstream: [artifacts/SWHM-S-0014/release-notes.md]
---

# Sprint summary — SWHM-S-0014

**Goal:** SWHM-I-0008 — Order Submission & Checkout. **Verdict:** PASS. **Change:** `openspec/changes/swhm-i-0008-order-submission-checkout/`.

## Tickets

| Ticket      | Type  | Title                                                      | Outcome                                                                                                                          |
| ----------- | ----- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0147 | TASK  | Sprint plan — SWHM-S-0014                                  | DONE — change authored, 10 TASKs planned, root docs updated (`f72850c`)                                                          |
| SWHM-T-0148 | EPIC  | Order Submission & Checkout                                | DONE — closed by rollup                                                                                                          |
| SWHM-T-0149 | STORY | Enter order information                                    | DONE — closed by rollup                                                                                                          |
| SWHM-T-0150 | STORY | Create the order                                           | DONE — closed by rollup                                                                                                          |
| SWHM-T-0151 | STORY | Confirm the order                                          | DONE — closed by rollup                                                                                                          |
| SWHM-T-0152 | STORY | Refuse an empty cart, and prove the journey                | DONE — closed by rollup                                                                                                          |
| SWHM-T-0153 | TASK  | Order information form, data model and module registration | DONE — PR #94, `bf84c20`                                                                                                         |
| SWHM-T-0154 | TASK  | Form routing and validation                                | DONE — PR #96, `594d092`                                                                                                         |
| SWHM-T-0155 | TASK  | Order id allocation seeded at 1001                         | DONE — PR #95, `5cf9acf`                                                                                                         |
| SWHM-T-0156 | TASK  | Order creation                                             | DONE — PR #97, `4200f75`                                                                                                         |
| SWHM-T-0157 | TASK  | Line item creation from cart contents                      | DONE — PR #99, `fcbcd32`                                                                                                         |
| SWHM-T-0158 | TASK  | Cart clearing after order placement                        | DONE — PR #101, `59a6ba5`                                                                                                        |
| SWHM-T-0159 | TASK  | Order confirmation screen                                  | DONE — PR #98, `1562ac6`; its AC-2 delivered by SWHM-T-0160 (see § Divergence, D1)                                               |
| SWHM-T-0160 | TASK  | Confirmation notification — the promise the screen makes   | DONE — PR #100, `7bab979`                                                                                                        |
| SWHM-T-0161 | TASK  | Empty cart refuses order placement                         | DONE — PR #102, `f145858`                                                                                                        |
| SWHM-T-0162 | TASK  | Order journey in a browser                                 | DONE **on an accepted gate bypass** — PR #103, `9699db6`; CI red on one assertion, tracked as SWHM-T-0166 (see § Divergence, D4) |
| SWHM-T-0167 | TASK  | Integration QA report — SWHM-S-0014                        | DONE — PR #105, `660beab`; PASS, one defect fixed in place                                                                       |
| SWHM-T-0168 | TASK  | Sprint close bundle — SWHM-S-0014                          | DONE — this file and `release-notes.md`                                                                                          |

## What shipped

A cart can now become an order. The sprint goal is met: every one of the 19 scenarios in the change's `specs/order-placement/spec.md` verifies on the integrated branch.

A new `order/` capability module (`types.ts`, `validation.ts`, `id.ts`, `order.ts`, `errors.ts`), one endpoint (`routes/api/order/index.post.ts`), two pages (`src/pages/enter-order-information.tsx`, `src/pages/order-completed.tsx`), and an additive migration extending the existing `orders` and `order_line_item` tables with billing/shipping addresses, contact details and the catalogue hierarchy each line sat under. Placement is one `db.transaction()` covering the order insert, the line items and the cart clear, with the empty-cart guard ahead of it. `order_id` comes from SQLite's own `AUTOINCREMENT` sequence, seeded at startup so the first order in an empty table is 1001 — no separate identifier service. Per-ticket detail is in each `artifacts/SWHM-S-0014/{TICKET-KEY}/summary.md`; the user-facing view is in `release-notes.md`.

Two of the plan's findings did most of the work: the `orders`/`order_line_item` tables already existed (defined by the administrative capability and extended here rather than duplicated), and `cart/checkout.ts`'s `toOrderLineItems`/`clearCartAfterOrder` seam was built and tested in SWHM-S-0013 with no caller — this sprint is the caller it was built for. Both are recorded in the change's `design.md` § Codebase findings.

## Divergence from plan

- **D1 — SWHM-T-0159's AC-2 was delivered by SWHM-T-0160, not by SWHM-T-0159.** The plan wrote the confirmation-email line into the acceptance criteria of the screen ticket and into the implementation steps of the notification ticket that depends on it. SWHM-T-0159 declined to build it rather than collide with SWHM-T-0160's plan, and recorded why. Correct call by the agent; the planning error was writing one line of copy into two tickets.
- **D2 — SWHM-T-0158 edited `routes/api/order/index.post.ts`, outside its stated ownership map.** Adding `sessionId` to `placeOrder`'s signature made the route's call site unbuildable without the same-commit edit. No parallel ticket owned the file at that point, so nothing collided; the ticket recorded the deviation in its own `PLAN.md`.
- **D3 — `cart/checkout.ts` needed an additive change SWHM-T-0157's plan did not anticipate.** `toOrderLineItems` did not carry `catid`/`productid`, because `CartItem` stores a quantity and resolves everything else from the catalogue on read. SWHM-T-0157 extended the seam and re-resolved both through `catalog/item.ts`'s `getItem`, adding a second catalogue lookup per cart line.
- **D4 — SWHM-T-0162 landed with its gate unmet.** Its E2E spec did what it was written to do — it caught, in CI, that the confirmation screen never receives `{ orderId, email }` — and its own `PLAN.md` scope guard forbade touching the source file that would fix it. The agent raised the bypass rather than editing outside its ownership; the sprint accepted it and tracked the residue as SWHM-T-0166. Integration QA then fixed the underlying bug in place as DEFECT-1. See § Retrospective.
- **D5 — SWHM-T-0162 produced no `summary.md` or `tdd-test-result.md`.** `artifacts/SWHM-S-0014/SWHM-T-0162/` holds only `PLAN.md`. Its work log exists as a ticket comment and is thorough, but the two per-ticket artifacts every other ticket in this sprint committed are absent. Recorded as a gap, not excused.
- Two `order/` modules beyond the three the plan named — `order/id.ts` (the sequence seed) and `order/errors.ts` (`ShoppingCartEmptyOrderError`) — were created rather than folded into `order/order.ts` or `order/validation.ts`. Each ticket justified the split in its summary; neither changed any interface another ticket depended on.

## Verification

PASS. See `qa-test-report.md` — 19/19 scenarios, `bun run verify` green (lint, typecheck, 577 unit tests across 91 files), Playwright 37/37 on chromium. One defect found by the real E2E run and fixed in place; root cause and fix rounds in `integration-defects-resolution.md` (DEFECT-1), per-spec detail in `integration-test-result.md`.

## Defects Raised

Two DEFECT tickets were created during the sprint window. **Both describe the same bug, and both are REFINED and open in the backlog while the code they describe is already fixed** — the fix landed at integration QA as DEFECT-1 (`src/pages/enter-order-information.tsx:362-367` now parses the response and passes `{ orderId, email }` as router state, verified present on this branch in `660beab`). Derived conclusion, not a disposition: triage should verify against the current sprint branch and close both rather than schedule them.

| Ticket      | Filed by                                    | Status       | What it is                                                                                                                                                                                                        |
| ----------- | ------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0165 | implementation-2, while working SWHM-T-0159 | REFINED (P1) | `enter-order-information.tsx`'s success path navigated to `/order-completed` with no router state, so the confirmation screen never received `{ orderId, email }`. Same bug as DEFECT-1; fixed at integration QA. |
| SWHM-T-0166 | raised by the gate bypass on SWHM-T-0162    | REFINED (P2) | The accepted-bypass record for the same failure, filed so the red CI assertion was not lost when SWHM-T-0162 merged. Superseded by DEFECT-1's fix; the assertion now passes (37/37).                              |

Two `improvement`-labelled TASKs were raised during planning and remain in BACKLOG. Nothing dispatches them, and they belong to no sprint:

| Ticket      | Raised by              | Status  | What it is                                                                                                                                                                                     |
| ----------- | ---------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0163 | planning (SWHM-T-0147) | BACKLOG | The confirmation screen promises an email nothing sends. The copy is specified and was built deliberately; delivery belongs to change `swhm-i-0012-customer-notifications-commu`.              |
| SWHM-T-0164 | planning (SWHM-T-0147) | BACKLOG | Whether checkout should prefill from, or write back to, the customer's saved address. A product decision — today the form starts empty and writes nothing back (PRODUCT.md § Not yet decided). |

## Root docs

All four were settled at planning (`f72850c`) and needed no further change at close, so none was edited on this ticket. `PRODUCT.md` gained the `order-placement` capability line and moved checkout off § Not yet decided; `ARCHITECTURE.md` gained `order/`, the extended data model, the autoincrement-seeded `order_id`, and two Key Decisions (an order records what was agreed rather than a view of what is current; a cart is cleared only after the order it became is committed); `DESIGN.md` gained § Form validation states for the per-field invalid pattern the order form introduced. `AGENTS.md` is human-authored and was not touched. Verified by inspection: what shipped matches what those docs state, including the transaction boundary and the id seed.

The close ticket's AC-3 asks for a dated Changelog entry in any updated root doc. No entry was added, and none of the three docs carries a `## Changelog` section — the planning contract states the commit message carries the change narrative and forbids a second history inside the doc. Recorded as a deliberate exception, not an omission; this is the same conflict noted at SWHM-S-0007.

## Retrospective

**Went well**

- **The E2E ticket earned its place by failing.** `e2e/order.spec.ts` (SWHM-T-0162) caught a bug nine merged tickets and 577 unit tests did not: the unit test at `enter-order-information.test.tsx:229` had encoded the broken call — `navigate("/order-completed")` with no state — as the expected behaviour, so the unit tier could never have found it. Only the round trip through a real route did.
- **Extending the existing `orders` tables instead of defining new ones held up.** The administrative capability defined them two sprints earlier; this sprint added columns and a generated migration and nothing had to be reconciled. The same held for the `cart/checkout.ts` seam, which was written a sprint ahead of its caller and needed one additive change (D3) rather than a rewrite.
- **The ownership maps did their job under pressure.** The one place a ticket had to write outside its map (D2) was recorded rather than done silently, and the one place a ticket refused to write outside it (D4) was the right refusal even though it cost a bypass.

**Could improve**

- **A defect raised mid-sprint has no route into the sprint it was found in, and this sprint paid for that three times over.** SWHM-T-0165 was filed as P1 during SWHM-T-0159, at 16:49 — with five tickets still to merge. Nothing dispatched it, because a defect deliberately carries no sprint. So SWHM-T-0162 hit the same bug in CI at 17:39, could not fix it inside its scope guard, and burned a gate bypass; integration QA then fixed it at 18:00 as DEFECT-1. One known, located, one-line bug took two extra hops and a bypass to reach a fix. The mechanism is working as designed; the design is what cost the time.
- **The confirmation-email line was written into two tickets' plans at once (D1).** One line of copy, one file, two owners — the dependent ticket's steps and the depended-on ticket's acceptance criteria. It resolved correctly only because SWHM-T-0159's agent read the other ticket's plan and chose to under-deliver its own AC, which is more judgement than a plan should require.
- **Eighth consecutive sprint where an E2E spec was first executed by CI rather than its author.** Implementation containers ship no Chromium, so SWHM-T-0162 needed three CI round trips, two of which found genuine bugs in the spec itself (a username over `MAX_USERID_LENGTH`, and an invalid-email fixture that native `type="email"` validation blocked before the app's own handler ran). Each round trip is a push-and-wait. This is an environment fix; no ticket can plan around it.
- **Per-ticket artifacts are not enforced (D5).** SWHM-T-0162 merged with neither `summary.md` nor `tdd-test-result.md`, and nothing caught it until this close.

## Compliance / Control Evidence

| Control                              | Evidence produced                                                                     | Location                                                                                | Status                            | Exception                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Change specified before build        | OpenSpec change — proposal, design, 19-scenario delta spec, ticket-tagged task list   | `openspec/changes/swhm-i-0008-order-submission-checkout/`                               | Satisfied                         | —                                                                                                                     |
| Change reviewed before merge         | 11 ticket PRs (#94–#103, #105) squash-merged to the sprint branch, each CI-gated      | git history on `vortex/sprint/swhm-s-0014-61fcd4b6`                                     | Satisfied                         | SWHM-T-0162 (#103) merged on an accepted gate bypass — see next row                                                   |
| Gate exceptions recorded and tracked | Bypass recorded on the ticket with the accepted blocker and a tracking key            | SWHM-T-0162 ticket thread; residue ticket SWHM-T-0166                                   | Satisfied                         | One bypass this sprint; underlying cause fixed at QA as DEFECT-1                                                      |
| Tests executed                       | `TDD-RESULT` markers per ticket; `E2E-RESULT` at integration                          | `artifacts/SWHM-S-0014/{TICKET-KEY}/tdd-test-result.md`, `…/integration-test-result.md` | Satisfied                         | Missing for SWHM-T-0162 — no `tdd-test-result.md` committed (D5); its CI runs are linked in the ticket thread         |
| Change verified before release       | QA report, PASS verdict, 19/19 scenarios                                              | `artifacts/SWHM-S-0014/qa-test-report.md`                                               | Satisfied                         | —                                                                                                                     |
| Defects dispositioned                | 1 found at integration QA, 1 fixed in place; 2 backlog DEFECTs recorded above         | `artifacts/SWHM-S-0014/integration-defects-resolution.md`, § Defects Raised             | Satisfied                         | SWHM-T-0165 and SWHM-T-0166 remain open pending triage, though the code is fixed                                      |
| Schema change migrated               | Generated migration committed with the schema edit                                    | `drizzle/0008_sour_thanos.sql`, `drizzle/meta/_journal.json`                            | Satisfied                         | —                                                                                                                     |
| Known limitations recorded           | Unsent confirmation email and the checkout/address product question raised as tickets | SWHM-T-0163, SWHM-T-0164 (BACKLOG)                                                      | Satisfied                         | Both open, awaiting triage                                                                                            |
| Standing documentation current       | Root docs updated on their own triggers at planning                                   | `PRODUCT.md`, `ARCHITECTURE.md`, `DESIGN.md` (`f72850c`)                                | Satisfied                         | No dated Changelog entry — see § Root docs                                                                            |
| Release contents recorded            | Close bundle                                                                          | `artifacts/SWHM-S-0014/sprint-summary.md`, `…/release-notes.md`                         | Satisfied                         | —                                                                                                                     |
| Browser-tier verification by author  | Blocked — implementation containers ship no Chromium                                  | SWHM-T-0162 ticket thread (CI runs 35128535228, 35128886409, 35129261140)               | Satisfied by compensating control | Author could not execute `e2e/order.spec.ts`; executed by CI on the ticket branch and again at integration QA (37/37) |
