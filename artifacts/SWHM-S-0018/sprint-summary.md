---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0018
idea: SWHM-I-0011
branch: vortex/sprint/swhm-s-0018-12051c41
upstream: [artifacts/SWHM-S-0018/SPRINT-PLAN.md, artifacts/SWHM-S-0018/qa-test-report.md]
downstream: [artifacts/SWHM-S-0018/release-notes.md]
---

# Sprint summary — SWHM-S-0018

## Tickets

| Ticket      | Type  | Title                                                                      | Outcome                                                              |
| ----------- | ----- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| SWHM-T-0199 | TASK  | Sprint plan — SWHM-S-0018                                                  | DONE — change authored, 10 TASKs decomposed, three root docs updated |
| SWHM-T-0200 | EPIC  | Order Approval Workflow                                                    | DONE — closed by rollup                                              |
| SWHM-T-0201 | STORY | Deciding an order — the threshold, the guard and the transition            | DONE — closed by rollup                                              |
| SWHM-T-0202 | STORY | What a decision produces, and how a batch of them arrives                  | DONE — closed by rollup                                              |
| SWHM-T-0203 | STORY | The Orders Approval screen                                                 | DONE — closed by rollup                                              |
| SWHM-T-0204 | TASK  | Auto-approval logic — locale thresholds and the order locale               | DONE                                                                 |
| SWHM-T-0205 | TASK  | Status validation guard — only PENDING orders are decidable                | DONE                                                                 |
| SWHM-T-0206 | TASK  | Order approval and denial workflow — the single-order applier              | DONE                                                                 |
| SWHM-T-0207 | TASK  | Supplier purchase order generation on approval                             | DONE                                                                 |
| SWHM-T-0208 | TASK  | Approval screen — pending orders table with editable status                | DONE                                                                 |
| SWHM-T-0209 | TASK  | Status colour coding — the status token family and the colour-coded cell   | DONE                                                                 |
| SWHM-T-0210 | TASK  | Admin operations — row selection, bulk Approve/Deny, and Commit            | DONE                                                                 |
| SWHM-T-0211 | TASK  | Batch decision entry point — the endpoint that replaces the approval queue | DONE                                                                 |
| SWHM-T-0212 | TASK  | Transactional batch applier — one commit moves every decision or none      | DONE                                                                 |
| SWHM-T-0213 | TASK  | Customer notifications queued on approval and denial                       | DONE                                                                 |
| SWHM-T-0216 | TASK  | Integration QA report — SWHM-S-0018                                        | DONE — verdict PASS                                                  |
| SWHM-T-0217 | TASK  | Sprint close bundle — SWHM-S-0018                                          | This ticket                                                          |

All ten implementation TASKs merged; no ticket was deferred, cancelled or left open. Per-ticket detail is in each `artifacts/SWHM-S-0018/{TICKET-KEY}/summary.md`.

## What shipped

The sprint goal — SWHM-I-0011, the approval gate between checkout and fulfilment — is met in full. The capability now exists end to end: an order is decided at placement when its locale threshold allows it (`en_US` under $500, `ja_JP` under ¥50,000, everything else PENDING), an administrator decides the rest on a screen, and a decision produces the records the downstream capabilities read.

Delivered in six layers, matching design.md § Phases 1–6:

- **The decision** (SWHM-T-0204) — `order/approval.ts`'s pure `decideApproval(locale, amount)`, a new nullable `orders.locale` column written at placement from the customer's preferred language, and `placeOrder` setting the inserted row's status from the decision rather than hardcoding PENDING.
- **The guard** (SWHM-T-0205) — `order/status.ts`: the terminal vocabulary (APPROVED, DENIED, COMPLETED), `isDecidable`, and the decidability read. Terminal statuses are immutable by return value, not by exception.
- **The applier** (SWHM-T-0206) — `order/decision.ts`'s `applyDecision`, reporting `applied` / `skipped` / `notFound`, with the extension point the next two tickets hung off.
- **What a decision produces** (SWHM-T-0207, SWHM-T-0213) — `supplier_po` / `supplier_po_line_item` carrying the shipping address and every line, and `notifications` recording that a customer is owed word of the outcome. The supplier PO's primary key on `order_id` is what makes a repeat approval unable to write a second PO.
- **The batch layer** (SWHM-T-0212, SWHM-T-0211) — `applyOrderDecisions` wrapping guard, status write, supplier PO and notification in one `db.transaction`, behind the new `POST /api/admin/orders/decisions`.
- **The screen** (SWHM-T-0208, SWHM-T-0209, SWHM-T-0210) — `/admin/orders-approval`, built from `artifacts/SWHM-S-0018/design/mockup-orders-approval.html`: the six-column pending table, the `StatusSelect` control, the nine-token status colour family in both themes, row selection with bulk Approve / Deny / Commit, and `e2e/order-approval.spec.ts` covering the administrator's whole path.

Phases 7 (test harness) and 8 (CI) were verified as already satisfied and correctly produced no ticket — `order/**`, `admin/**` and `routes/**` were already in Vitest's `server` project, and the existing workflow already triggers on `vortex/**` pushes and pull requests.

Three migrations were generated and committed: `drizzle/0010_fast_polaris.sql` (`orders.locale`), `0011_tiresome_jubilee.sql` (the two supplier-PO tables) and `0012_slow_cable.sql` (`notifications`).

## Divergence from plan

None at execution. Every ticket delivered the scope its `PLAN.md` set, in the planned dependency order, and no ticket was added, split or dropped mid-sprint.

The substantive divergence was **idea → plan**, settled during SWHM-T-0199 and recorded as design.md § Spec discrepancies rather than discovered later. The three that changed what got built: the pending-list endpoint and the admin orders screen already existed from `admin-operations`, so the sprint added only `decisions.post.ts` and a second screen at `/admin/orders-approval` instead of the `index.get.ts` / `index.post.ts` and `orders.tsx` the idea named (S1, S6, S11); server code went into the existing top-level `order/` directory rather than a new `orders/`, and needed no `vitest.config.ts` change because that path was already in the `server` project; and the supplier hand-off is a table the fulfilment capability reads, not an XML message on a queue, because this product has no broker (S2).

## Verification

**PASS.** See `artifacts/SWHM-S-0018/qa-test-report.md` — all 23 delta-spec scenarios carry a `SCENARIO-VERDICT: … pass`, `bun run verify` was green at 818/818 unit tests across 120 files, and Playwright ran 44/44 including this sprint's own journey. `integration-defects-resolution.md` is `COMPLETE` with no defect found, so nothing was fixed in place during QA.

QA recorded two cosmetic design deviations as advisory, not as defects: the subheading omits the mockup's awaiting-review count, and the "Pending orders" section label above the table is absent. Both are noted in `release-notes.md` § Not included for a human decision.

## Defects Raised

| Ticket      | Type   | Description                                                                                                                                | Filed by               | Current status                                                    |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------- |
| SWHM-T-0214 | DEFECT | `fulfillment/status.ts` completes any non-COMPLETED order without requiring APPROVED first, so a DENIED order can still be marked complete | planning (SWHM-T-0199) | REFINED — carries no sprint; awaiting triage into a future sprint |

One non-defect follow-up was raised in the same pass and is recorded here so it is not lost with the sprint: **SWHM-T-0215** (TASK, `improvement`, BACKLOG) — the older `POST /api/admin/orders/status` endpoint writes a status without the decidability guard the approval path applies, so the two admin paths disagree about whether a terminal order is mutable. Neither was fixed in this sprint: the change carries no delta authorising a modification to `fulfillment-management` or `admin-operations`.

## Retrospective

**Went well**

- Planning read the legacy specification against the actual repository before decomposing, and the 14 recorded spec discrepancies absorbed every collision between the extracted spec and what already existed. That is why § Divergence from plan is empty: the surprises were spent at planning, not at execution.
- The shared type file (`order/approval-types.ts`, written whole in the first ticket per D10) meant six later tickets imported a settled contract instead of negotiating one. No interface contract changed mid-sprint and no ticket needed a plan revision.
- Sequencing the applier before its two side effects gave SWHM-T-0207 and SWHM-T-0213 a single named extension point to wire into, and both landed without touching each other's files.
- QA passed on the first run of every gate, and the sprint's own E2E spec existed before integration rather than being written to satisfy it.

**Could improve**

- The two design deviations (missing awaiting-review count, missing "Pending orders" label) are both from the mockup's static chrome rather than its behaviour. Neither ticket's acceptance criteria named them, so nothing failed — a criterion derived from the mockup's non-interactive text would have caught both at SWHM-T-0208 instead of at QA.
- `admin-operations` now exposes two endpoints that write an order status with different rules (SWHM-T-0215). The sprint was right not to fix it under a change with no delta for it, but the product now ships a real inconsistency whose resolution depends on a triage decision nobody has scheduled.
- SWHM-T-0210's summary records an eslint `react-hooks` rule forcing the refetch to be a standalone function rather than an effect body call. That is the second screen this sprint shaped around that rule; the pattern is worth writing down once rather than being rediscovered per ticket.

## Compliance / Control Evidence

| Control                                         | Evidence                                                                                                                                      | Location                                                                            | Status    | Exception                                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| Change planned and specified before build       | OpenSpec change — proposal, design, delta spec, tagged tasks                                                                                  | `openspec/changes/swhm-i-0011-order-approval-workflow/`                             | Satisfied | —                                                                                                           |
| Every requirement traced to a verified scenario | 23 `SCENARIO-VERDICT:` lines, all pass                                                                                                        | `artifacts/SWHM-S-0018/qa-test-report.md`                                           | Satisfied | —                                                                                                           |
| Change verified before release                  | QA report, PASS verdict                                                                                                                       | `artifacts/SWHM-S-0018/qa-test-report.md`                                           | Satisfied | —                                                                                                           |
| Tests executed                                  | `bun run verify` 818/818; Playwright 44/44                                                                                                    | `artifacts/SWHM-S-0018/integration-test-result.md`                                  | Satisfied | —                                                                                                           |
| Per-ticket test evidence recorded               | `tdd-test-result.md` per implementation ticket                                                                                                | `artifacts/SWHM-S-0018/{TICKET-KEY}/`                                               | Satisfied | —                                                                                                           |
| Defects dispositioned                           | 0 found in QA; 1 DEFECT + 1 improvement raised at planning, both left open by decision                                                        | `artifacts/SWHM-S-0018/integration-defects-resolution.md`, § Defects Raised above   | Satisfied | SWHM-T-0214 and SWHM-T-0215 close with the sprint unresolved — neither is authorised by this change's delta |
| Change reviewed before merge                    | 10 ticket PRs (#129–#138) squash-merged to the sprint branch, each gated on CI                                                                | git history, `vortex/sprint/swhm-s-0018-12051c41`                                   | Satisfied | —                                                                                                           |
| Schema changes migrated and committed           | 3 generated drizzle migrations                                                                                                                | `drizzle/0010_fast_polaris.sql`, `0011_tiresome_jubilee.sql`, `0012_slow_cable.sql` | Satisfied | —                                                                                                           |
| Standing documentation current at close         | PRODUCT.md, ARCHITECTURE.md and DESIGN.md updated on their own triggers at planning; delivery matched, so no close-time correction was needed | commit `dc44a88`                                                                    | Satisfied | —                                                                                                           |
