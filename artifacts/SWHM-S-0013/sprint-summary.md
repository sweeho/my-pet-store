---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream: [artifacts/SWHM-S-0013/SPRINT-PLAN.md, artifacts/SWHM-S-0013/qa-test-report.md]
downstream: [artifacts/SWHM-S-0013/release-notes.md]
---

# Sprint summary — SWHM-S-0013

Goal: **SWHM-I-0007: Shopping Cart Management**. Change: `openspec/changes/swhm-i-0007-shopping-cart-management/`.

## Tickets

| Ticket      | Type  | Title                                                            | Outcome                                                                                                |
| ----------- | ----- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| SWHM-T-0128 | TASK  | Sprint plan — SWHM-S-0013                                        | DONE — plan, change artifacts, design export, 10-ticket decomposition                                  |
| SWHM-T-0129 | EPIC  | Shopping Cart Management                                         | DONE (rollup)                                                                                          |
| SWHM-T-0130 | STORY | Cart storage and operations                                      | DONE (rollup)                                                                                          |
| SWHM-T-0131 | STORY | Cart screen and form handling                                    | DONE (rollup)                                                                                          |
| SWHM-T-0132 | STORY | Cart lifecycle, checkout seam and browser coverage               | DONE (rollup)                                                                                          |
| SWHM-T-0133 | TASK  | Cart data model, types and module registration                   | DONE — `cart_items`, migration `0007`, `cart/types.ts`, `cart/repository.ts`, three registration edits |
| SWHM-T-0134 | TASK  | Add items to the cart                                            | DONE — `getCart`/`addItem`, `GET`+`POST /api/cart`, Add to Cart control on the item screen             |
| SWHM-T-0135 | TASK  | Remove items from the cart                                       | DONE — `removeItem`, `DELETE /api/cart/items/{itemId}`                                                 |
| SWHM-T-0136 | TASK  | Update cart quantities                                           | DONE — `updateItem`/`updateItems`, transactional `PUT /api/cart`                                       |
| SWHM-T-0137 | TASK  | Clear the cart                                                   | DONE — `clearCart`, no HTTP surface by design                                                          |
| SWHM-T-0138 | TASK  | Cart screen — populated and empty states                         | DONE — `src/pages/cart.tsx`, both states built to the mockups                                          |
| SWHM-T-0139 | TASK  | Cart form handling — Update Cart, remove and quantity validation | DONE — controls wired, one batched `PUT` per Update Cart                                               |
| SWHM-T-0140 | TASK  | Checkout seam — cart to order line items                         | DONE — `cart/checkout.ts`, seam only, no caller                                                        |
| SWHM-T-0141 | TASK  | Cart session lifecycle and clear on logout                       | DONE — explicit cart delete inside `invalidateSession`                                                 |
| SWHM-T-0142 | TASK  | Browser-tier cart journey                                        | DONE — `e2e/cart.spec.ts`, 6 tests                                                                     |
| SWHM-T-0145 | TASK  | Integration QA report — SWHM-S-0013                              | DONE — PASS verdict                                                                                    |
| SWHM-T-0146 | TASK  | Sprint close bundle — SWHM-S-0013                                | DONE — this file and `release-notes.md`                                                                |

Per-ticket detail is in each ticket's `artifacts/SWHM-S-0013/{TICKET-KEY}/summary.md`.

## What shipped

The `shopping-cart` capability, end to end: a session-scoped cart a shopper can add to, edit, and empty, priced and totalled on read. Storage is `cart_items` in `db/schema.ts`, keyed on (`session_id`, `itemid`) with quantity as its only stored column; the server capability module is the new top-level `cart/`; the API is four JSON routes under `routes/api/cart/`; the screen is `src/pages/cart.tsx` at `/cart`, built to the two supplied mockups. Signing out empties the cart through an explicit delete inside `auth/session.ts`'s `invalidateSession`. The cart→`order_line_item` mapping and the clear-on-order call are exported from `cart/checkout.ts` for `swhm-i-0008` to consume.

Sprint goal met: all four idea acceptance criteria and all 18 scenarios in the `shopping-cart` delta spec verified. All 55 checkboxes in the change's `tasks.md` are ticked.

Root docs: `PRODUCT.md` (capability-map row for `shopping-cart`, the standing "what a visit holds" scope paragraph, and three new § Not yet decided entries) and `ARCHITECTURE.md` (the `cart/` module, the `cart_items` entity, the foreign-key-enforcement constraint, and two § Key Decisions promotions) were brought to target state at planning time on SWHM-T-0128 and are already on this branch — no further edit was owed at close. `DESIGN.md` was deliberately left alone: the cart screen is built from the existing `Table`/`Button` components and this repository's existing tokens (design.md F13), which is a new screen rather than a design-system change. `AGENTS.md` is human-authored and is never rewritten by an agent.

## Divergence from plan

None material. All eleven phases in `openspec/changes/swhm-i-0007-shopping-cart-management/design.md` § Phases landed as planned, in the ticket each phase names, with no ticket added, dropped or re-scoped mid-sprint.

Two scope boundaries were set in the plan and held rather than discovered in flight, and are recorded here so they are not misread later as omissions: the checkout seam ships with no caller (design.md S8 — order creation belongs to `swhm-i-0008`), and the "clear on session timeout" half of the legacy requirement is not built because sessions do not expire in this product (design.md S6, and `PRODUCT.md` § Not yet decided).

## Verification

**PASS.** See `artifacts/SWHM-S-0013/qa-test-report.md` for the scenario-by-scenario verdicts and `artifacts/SWHM-S-0013/integration-test-result.md` for the executed evidence: `bun run verify` (lint, typecheck, 497 unit tests across 83 files) and the full Playwright suite (34/34) both passed on the integrated sprint branch on first run. No defects were found at integration QA, so no fix-in-place cycle ran — `integration-defects-resolution.md` records the empty list.

## Defects Raised

None. No DEFECT ticket was created during the sprint window (`a2a_list_tickets(type="defect", created_since=2026-09-16T01:00:00Z)` returned an empty list), and integration QA found none.

Two `improvement`-labelled TASKs were raised during planning and remain in BACKLOG for triage — recorded here because, like a defect, nothing dispatches them and they are not part of any sprint's scope:

| Ticket      | Raised by              | Status  | What it is                                                                                                                                                                                                                                                                                      |
| ----------- | ---------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SWHM-T-0143 | planning (SWHM-T-0128) | BACKLOG | Which price a shopper is charged — the catalogue displays `item.list_price` while the cart totals `item.unit_cost`. A product decision, not a code defect; both figures come from the extracted specification (design.md S1/D2) and it must be settled before anything takes a shopper's money. |
| SWHM-T-0144 | planning (SWHM-T-0128) | BACKLOG | Foreign-key enforcement is off, so every `ON DELETE CASCADE` in `db/schema.ts` is inert. Turning `PRAGMA foreign_keys` on changes delete semantics for every table at once, so it needs its own change with tests (design.md F4/D4).                                                            |

## Retrospective

**Went well**

- **Writing `cart/types.ts` whole in the first ticket (D8) removed the collision class it was designed for.** SWHM-S-0012 had three tickets appending to one shared type file with no dependency edge between them, and only the merge order saved it; here the seven downstream tickets imported a fixed shape and none reopened the file. Cost: one slightly larger first ticket.
- **Deriving `count`, `lineTotal` and `subtotal` on read (D6) turned a body of spec work into nothing to build.** The extracted specification describes recalculating and reassigning totals after every operation; because nothing is stored there was no recalculation step to implement, test, or get wrong, and QA confirmed there is no state that can drift (`cart/cart.ts:32-42`).
- **Ten small tickets on an explicit dependency chain produced zero integration defects.** The sprint branch was green on QA's first run of both tiers — the first sprint in this project where integration QA needed no fix cycle at all.
- **Citing the `design.md` decision id next to each non-obvious rule in the code paid off at QA.** Validation singled this out: each of the three rules a reader would otherwise question (count is distinct lines, zero-or-less removes, the clear is a seam with no caller) was verifiable against its source in one step.

**Could improve**

- **`e2e/cart.spec.ts` was first executed by CI, not by its author.** Implementation containers ship no Chromium, so SWHM-T-0142 pushed a spec it had never run; CI then found two genuine bugs in the spec in succession — a `toFixed(2)` expectation that did not match the page's `Intl.NumberFormat` output, and a strict-mode ambiguity between a line-total cell and the subtotal in a single-item cart. Both were test bugs rather than product bugs, and each cost a push-and-wait cycle. This is now the seventh sprint hitting the same container limitation; it is an environment fix, not something a ticket can plan around.
- **The list-price/unit-cost contradiction was carried, correctly, but it is still carried.** The store now advertises `$599.99` on the item page and prices the same item at `$350.00` in the cart. Implementing the spec verbatim and flagging it (S1, SWHM-T-0143) was the right call for this sprint, but the subtotal is not a figure anyone should act on until SWHM-T-0143 is settled, and checkout is the next capability in line.
- **Splitting the cart screen across two tickets (SWHM-T-0138 renders inert controls, SWHM-T-0139 wires them) cost more than it bought.** Both touch only `src/pages/cart.tsx` and `src/pages/cart.test.tsx`, so the ownership map forced them to be sequential anyway; a reviewer of 0138 alone sees a page whose buttons do nothing. One ticket would have been the smaller backlog.

## Compliance / Control Evidence

| Control                             | Evidence produced                                                                 | Location                                                                                | Status                            | Exception                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Change specified before build       | OpenSpec change — proposal, design, 18-scenario delta spec, tagged task list      | `openspec/changes/swhm-i-0007-shopping-cart-management/`                                | Satisfied                         | —                                                                                                                    |
| Change reviewed before merge        | 10 ticket PRs (#82–#91) squash-merged to the sprint branch, each CI-gated         | git history on `vortex/sprint/swhm-s-0013-b8e5db3c`                                     | Satisfied                         | —                                                                                                                    |
| Tests executed                      | `TDD-RESULT` markers per ticket; `E2E-RESULT` at integration                      | `artifacts/SWHM-S-0013/{TICKET-KEY}/tdd-test-result.md`, `…/integration-test-result.md` | Satisfied                         | —                                                                                                                    |
| Change verified before release      | QA report, PASS verdict, 18/18 scenarios                                          | `artifacts/SWHM-S-0013/qa-test-report.md`                                               | Satisfied                         | —                                                                                                                    |
| Defects dispositioned               | 0 found at integration QA; empty list recorded with marker                        | `artifacts/SWHM-S-0013/integration-defects-resolution.md`                               | Satisfied                         | —                                                                                                                    |
| Schema change migrated              | Generated migration committed with the schema edit                                | `drizzle/0007_ancient_iron_lad.sql`, `drizzle/meta/_journal.json`                       | Satisfied                         | —                                                                                                                    |
| Known limitations recorded          | Product decision and enforcement gap raised as tickets, not left in code comments | SWHM-T-0143, SWHM-T-0144 (BACKLOG)                                                      | Satisfied                         | Both open, awaiting triage                                                                                           |
| Release contents recorded           | Close bundle                                                                      | `artifacts/SWHM-S-0013/sprint-summary.md`, `…/release-notes.md`                         | Satisfied                         | —                                                                                                                    |
| Browser-tier verification by author | Blocked — implementation containers ship no Chromium                              | `artifacts/SWHM-S-0013/SWHM-T-0142/tdd-test-result.md`                                  | Satisfied by compensating control | Author could not execute `e2e/cart.spec.ts`; executed by CI on the ticket branch and again at integration QA (34/34) |
