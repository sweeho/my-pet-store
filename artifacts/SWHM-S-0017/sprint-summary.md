---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0017
idea: SWHM-I-0010
branch: vortex/sprint/swhm-s-0017-0206b1e7
upstream: [artifacts/SWHM-S-0017/SPRINT-PLAN.md, artifacts/SWHM-S-0017/qa-test-report.md]
downstream: [artifacts/SWHM-S-0017/release-notes.md]
---

# Sprint summary — SWHM-S-0017

## Tickets

| Ticket      | Type  | Title                                                    | Outcome                               |
| ----------- | ----- | -------------------------------------------------------- | ------------------------------------- |
| SWHM-T-0183 | EPIC  | Order Fulfillment & Shipping                             | DONE (closed by rollup)               |
| SWHM-T-0184 | STORY | Fulfilment data model and per-concern modules            | DONE (closed by rollup)               |
| SWHM-T-0185 | STORY | The fulfilment pass and its entry point                  | DONE (closed by rollup)               |
| SWHM-T-0186 | STORY | Supplier screens and the integrated journey              | DONE (closed by rollup)               |
| SWHM-T-0182 | TASK  | Sprint plan — SWHM-S-0017                                | DONE (plan, change and root docs)     |
| SWHM-T-0187 | TASK  | Inventory table, fulfilment module and its registrations | DONE (#117)                           |
| SWHM-T-0188 | TASK  | Inventory verification and reduction                     | DONE (#119)                           |
| SWHM-T-0189 | TASK  | Invoice generation                                       | DONE (#121)                           |
| SWHM-T-0190 | TASK  | Order status tracking                                    | DONE (#120)                           |
| SWHM-T-0191 | TASK  | Line item shipment tracking                              | DONE (#118)                           |
| SWHM-T-0192 | TASK  | Order fulfilment processing                              | DONE (#122)                           |
| SWHM-T-0193 | TASK  | Fulfilment entry point and access rules                  | DONE (#123)                           |
| SWHM-T-0194 | TASK  | Supplier home page                                       | DONE (#124)                           |
| SWHM-T-0195 | TASK  | Inventory management screen                              | DONE (#125)                           |
| SWHM-T-0196 | TASK  | Integration, failure behaviour and the browser journey   | DONE (#126)                           |
| SWHM-T-0197 | TASK  | Integration QA report — SWHM-S-0017                      | DONE (#127), verdict PASS             |
| SWHM-T-0198 | TASK  | Sprint close bundle — SWHM-S-0017                        | DONE (this file + `release-notes.md`) |

Per-ticket detail is in each ticket's `artifacts/SWHM-S-0017/{TICKET-KEY}/summary.md` and `tdd-test-result.md`.

## What shipped

Sprint goal met: an order the store could previously only receive can now be filled, and the store now holds a stock figure it did not have before.

- **`inventory` table** (`db/schema.ts`, migration `drizzle/0009_steady_microchip.sql`) — `itemid` → `quantity`, no ledger and no reservation column. The only table the capability introduced; the shipped quantity and order status it also needed were already columns on `order_line_item` and `orders` (SWHM-T-0187, SWHM-T-0191).
- **`fulfillment/` capability module**, peer to `auth/`, `catalog/`, `order/` and `payment/` and registered in both Vitest projects and `tsconfig.node.json` — `inventory.ts` (check and reduce), `line-items.ts` (shipped-quantity tracking), `status.ts` (`PENDING` → `COMPLETED`), `invoice.ts` (hand-built XML, no new dependency), `fulfillment.ts` (the pass, one `db.transaction`), `receive.ts`, `errors.ts`, `types.ts`, `inventory-admin.ts`, `seed.ts`.
- **`POST /api/fulfillment/process`** — the entry point, taking `{ orderId }` and answering `{ orderId, invoice, status }`; 400 on an unparseable body, 404 on an unknown order, 500 with a fixed generic body on anything else (SWHM-T-0193, SWHM-T-0196).
- **Two administrator-only screens** — `/supplier` and `/supplier/inventory`, built from the sprint's mockups, with `GET`/`POST /api/supplier/inventory` behind them (SWHM-T-0194, SWHM-T-0195).
- **Access** — three new `PROTECTED_RESOURCES` entries (`/api/fulfillment`, `/supplier`, `/api/supplier`), all requiring `ADMIN_ROLE`, enforced by the existing signon middleware plus `RequireAdmin`/`requireAdmin`.

## Divergence from plan

The ticket tree, its sequencing and the change's `tasks.md` were delivered as planned; no ticket was added, dropped or re-scoped mid-sprint. Three departures from the **idea description** are worth recording, each settled during planning against the measured codebase rather than during implementation:

- **Access is role-gated, not merely signed-on.** The idea (written before `swhm-i-0006` landed) said `auth/` has no role model and directed the screens into `PROTECTED_RESOURCES` as signed-on-only until an administrator role existed. It exists now, so all three entries carry `requiresRole: ADMIN_ROLE` (design.md S9).
- **The supplier screens wear the product's `AdminShell` chrome**, not the mockups' simplified "My Pet Store / Supplier" tag bar. PLAN.md directed the reuse; QA recorded it as the only design deviation and judged it immaterial (`qa-test-report.md` § Code Review).
- **E2E ran at integration QA, not per ticket.** No implementation container ships a Chromium, so `bun run test:e2e` fails its preflight there — a documented environment gap (`.vortex/agents-generated.md`), not a defect. `e2e/fulfillment.spec.ts` was first executed on the integrated branch: 43 tests, all passing.

## Verification

PASS. See `artifacts/SWHM-S-0017/qa-test-report.md` — every acceptance criterion and all 23 delta-spec scenarios exercised against the integrated branch, `bun run test` at 722 passing and Playwright at 43 passing, no defect found. `artifacts/SWHM-S-0017/integration-defects-resolution.md` is `COMPLETE` with an empty table.

## Defects Raised

None. No DEFECT ticket was created during the sprint window (`a2a_list_tickets(type="defect", created_since=2026-09-16T22:00:00Z)` returned an empty list), and integration QA found none.

## Retrospective

- **Went well — one transaction boundary, decided once.** D2 fixed the `db.transaction` at the orchestrator and forbade it in the leaf modules, so five tickets written in parallel produced no nested-transaction conflict and the atomicity claim could be tested in one place (`fulfillment.test.ts` PT-07 forces a failure between the two writes and asserts both roll back).
- **Went well — the prefix-protected resource entries were sequenced, not concurrent.** Both screen tickets depended on SWHM-T-0193 rather than each adding their own entry, which is why `auth/protected-resources.ts` took three additions in one commit instead of three branches editing one array.
- **Went well — the mockups were exported to the branch.** Every UI ticket built from a file in its own worktree; QA compared the built screens to the same files. The only deviation found was the one PLAN.md had already directed.
- **Could improve — the idea's access section was stale on arrival.** It described a role model that had shipped two sprints earlier. Planning caught it in Stage 0, but an implementation agent reading the ticket description alone could have built a signed-on-only guard on an administrator screen. Ideas that name a not-yet-built dependency should be re-read against the code at planning, which is what happened here and is worth keeping deliberate.
- **Could improve — the E2E tier is only ever observed twice, late.** Six tickets in the previous sprint and every UI ticket in this one wrote or touched browser assertions they could not run locally. The specs were correct, but that is the third sprint in a row where the first execution of a new spec was on CI or at QA.

## Compliance / Control Evidence

| Control                                   | Evidence                                                                                     | Location                                                                                                    | Status    | Exception                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| Change planned and specified before build | Sprint plan index + OpenSpec change (proposal, design, delta specs, tasks)                   | `artifacts/SWHM-S-0017/SPRINT-PLAN.md`, `openspec/changes/swhm-i-0010-order-fulfillment-shipping/`          | Satisfied | —                                                                                                |
| Change verified before release            | QA report, PASS verdict, all 23 scenarios                                                    | `artifacts/SWHM-S-0017/qa-test-report.md`                                                                   | Satisfied | —                                                                                                |
| Tests executed                            | Per-ticket TDD results; integration run (722 unit, 43 E2E)                                   | `artifacts/SWHM-S-0017/{TICKET-KEY}/tdd-test-result.md`, `artifacts/SWHM-S-0017/integration-test-result.md` | Satisfied | E2E not executable in implementation containers; executed on CI per branch and at integration QA |
| Defects dispositioned                     | 0 found at QA, 0 raised during the sprint                                                    | `artifacts/SWHM-S-0017/integration-defects-resolution.md`                                                   | Satisfied | —                                                                                                |
| Change reviewed before merge              | Ticket mini-PRs #117–#127, each merged green                                                 | sprint branch history                                                                                       | Satisfied | —                                                                                                |
| Schema change controlled                  | Generated migration committed with its snapshot                                              | `drizzle/0009_steady_microchip.sql`, `drizzle/meta/0009_snapshot.json`                                      | Satisfied | —                                                                                                |
| Access control recorded                   | Three role-gated resource entries with tests                                                 | `auth/protected-resources.ts`, `auth/protected-resources.test.ts`                                           | Satisfied | —                                                                                                |
| Standing documentation current            | Capability map, data model, key decisions and the editable-table pattern updated at planning | root docs, commit `90af1a0`                                                                                 | Satisfied | —                                                                                                |
