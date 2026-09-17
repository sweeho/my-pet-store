---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0020
idea: SWHM-I-0012
branch: vortex/sprint/swhm-s-0020-2eb89d94
upstream: [artifacts/SWHM-S-0020/SPRINT-PLAN.md, artifacts/SWHM-S-0020/qa-test-report.md]
downstream: [artifacts/SWHM-S-0020/release-notes.md]
---

# Sprint summary — SWHM-S-0020

Goal: **SWHM-I-0012 — Customer Notifications & Communication.** One change,
`swhm-i-0012-customer-notifications-commu`, four implementation tickets, no defects.

## Tickets

| Ticket      | Type  | Title                                                                    | Outcome                                                                                        |
| ----------- | ----- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| SWHM-T-0221 | TASK  | Sprint plan — SWHM-S-0020                                                | DONE — change authored, `PRODUCT.md`/`ARCHITECTURE.md` updated, four TASKs planned (`006b515`) |
| SWHM-T-0222 | EPIC  | Customer Notifications & Communication                                   | DONE by rollup                                                                                 |
| SWHM-T-0223 | STORY | A customer is told what became of their order                            | DONE by rollup                                                                                 |
| SWHM-T-0224 | TASK  | Notification service — queue entry point, completion trigger, recipient  | DONE — `315cfc4`, PR #144                                                                      |
| SWHM-T-0225 | TASK  | Email generation — subject and body per notification kind                | DONE — `b3d58b2`, PR #145                                                                      |
| SWHM-T-0226 | TASK  | Delivery — mail transport boundary and the drain pass                    | DONE — `e4dc5b8`, PR #146                                                                      |
| SWHM-T-0227 | TASK  | Verification — the three transitions end to end, and the missing address | DONE — `fa046ea`, PR #147                                                                      |
| SWHM-T-0229 | TASK  | Integration QA report — SWHM-S-0020                                      | DONE — PASS on first verification (`797b655`, PR #148)                                         |
| SWHM-T-0230 | TASK  | Sprint close bundle — SWHM-S-0020                                        | DONE — this file and `release-notes.md`                                                        |

## What shipped

The store now writes to a customer when their order is approved, denied, or finished. Before this
sprint it recorded that a customer was owed word of a decision and nothing read that row; the row
is now drained, turned into a message and handed to a transport, and marked with what became of
it.

`notifications/` is a new capability directory holding the whole path: `notify(orderId, kind)` is
the single queueing entry point, called by the decision applier for `APPROVAL` and `DENIAL` and by
`fulfillment/status.ts`'s completion point for the new `COMPLETION` kind — the module never
watches for changes itself. `resolveRecipient()` reads the customer's contact record through
`account/customer.ts`'s `findAccount()`. `buildMessage()` turns a kind, order id, status and
recipient into a subject and body with no I/O of its own. `dispatchQueued()` drains every `QUEUED`
row, resolves the address, sends, and leaves the row `SENT`, `FAILED` or `UNDELIVERABLE` — never
still queued. `MailTransport` is the product's second outward boundary: an interface with an
injected default that records the message rather than delivering it, the same shape
`payment/processor.ts` set.

The `notifications` table was extended in place — `status`, `sent_at`, `failure_reason`, migration
`drizzle/0013_curly_the_santerians.sql` — rather than a second table being added beside the one
the approval capability already writes to. `order/notification.ts` was removed, superseded rather
than left alongside its replacement.

Both triggering routes call `dispatchQueued()` once, after their own transaction has already
returned, so an order's status is committed before anything is sent and a throwing transport
cannot reach the order. Two route tests prove exactly that.

## Divergence from plan

Three, none costing a dispatch.

**Order placement sends nothing.** The idea's acceptance criteria and the change's own
`proposal.md` § Key Events list a notification when an order is placed; the delta spec's four
requirements cover only approved, denied and completed. Planning recorded the disagreement
(`design.md` § Spec discrepancies S2) instead of editing either text, and raised **SWHM-T-0228**
so the decision is taken deliberately. QA confirmed the delta spec, not the ticket snapshot, is
the oracle — every requirement in it holds.

**The recipient is resolved at send time, from the account.** The queueing path copies
`orders.billing_email` onto the row, under the standing rule that an order records what was
agreed. An address to contact someone at is not an agreement, so the notification reads the
account's current address and falls back to the copied one only when the account holds none
(`design.md` D5). That is a narrow, deliberate exception to a standing decision, and it was
promoted into `ARCHITECTURE.md § Key Decisions` because anything that later reaches a customer
inherits it.

**A new capability directory has to be registered in three places, not two.** SWHM-T-0224 found
`tsc --build` did not see `notifications/` until it was added to `tsconfig.node.json`'s `include`,
alongside the two Vitest lists `ARCHITECTURE.md` already named. The constraint bullet was
corrected on this close ticket.

## Root docs

- **`PRODUCT.md` — updated** (on the planning ticket). The capability map gained a `notifications`
  row, the mission and shopper paragraph now say a customer hears what became of an order, a
  non-goal fences outbound contact to that and nothing else, and four questions were opened under
  § Not yet decided: where the store's mail actually goes, whether placement is worth a message,
  whether anyone learns a message did not arrive, and whether a customer can be reached at all.
- **`ARCHITECTURE.md` — updated** (on the planning ticket, corrected on this one). The mail
  transport is now the second entry under § Integration points; the `notifications` row in § Data
  model describes an outbox with terminal states rather than a write-only record; the recipient
  decision was promoted to § Key Decisions; and § Cross-cutting constraints now names all three
  registration lists a new capability directory must appear in.
- **`DESIGN.md` — deliberately unchanged.** This capability has no screen; the idea puts a user
  interface out of scope and the design manifest is empty. Nothing in the design system moved.
- **`AGENTS.md` — not touched.** Human-authored; never rewritten by an agent.

No `## Changelog` entry was added to any of them, and none of the four carries such a section. The
commit history is the change narrative — a second, hand-maintained one inside the document drifts
from it. This is the one point where this ticket's acceptance criteria and the standing artifact
rules disagree, and the standing rule is followed.

## Verification

PASS, on first verification of the integrated sprint branch, with no fix-in-place rounds. Unit
858/858 across 125 files, browser E2E 45/45 with zero skips, build clean. All six scenarios of the
`notifications` delta spec carry a `SCENARIO-VERDICT: … — pass`. The capability itself is proven
by `notifications/notifications.integration.test.ts`, which drives `applyOrderDecisions` and
`processOrder` — the real route paths — rather than writing a row by hand; the browser run is a
regression check on the two routes that gained a `dispatchQueued()` call. Detail in
`artifacts/SWHM-S-0020/qa-test-report.md` and `integration-test-result.md`.

## Defects Raised

None. No DEFECT was created during the sprint window (started 2026-09-17T12:53Z), confirmed by
`a2a_list_tickets(type="defect", created_since=…)`, and integration QA found none to fix in place
(`integration-defects-resolution.md`).

One backlog ticket was raised, at planning rather than as a defect: **SWHM-T-0228** — decide
whether placing an order is worth a message to the customer.

## Retrospective

**Went well — half the capability already existed, and planning measured that before decomposing.**
The `notifications` table, the approval and denial queueing path and the join to the account were
all shipped by earlier sprints (`design.md` F1, F2, F7). Planning extended the table and re-pointed
the existing call sites instead of building a parallel queue. A plan written from the idea text —
which still claims orders do not exist in this repository (F13) — would have produced a second
table and left the rows the shipped path writes unreadable by the path that sends them.

**Went well — seven spec discrepancies were recorded, not resolved by editing the spec.** The
extracted specification describes a JMS broker, an AsyncSender EJB, two notifier classes and email
templates, none of which exist here. Each was written down with its disposition rather than quietly
reconciled, so QA could read S2 and correctly rule that a missing placement notification is scope,
not a failure — and so the one genuinely open product question got a ticket rather than a planner's
guess.

**Went well — the strict dependency chain across four tickets cost nothing.** Each ticket depended
on the previous one and each left the suite green (834 → 843 → 854 → 858), so the final integration
pass found nothing. The chain was sequential by necessity — every ticket wrote into `notifications/`
— and four dispatches were still cheaper than one ticket large enough to hold the whole capability.

**Could improve — "a notification was sent" is only observable in a test.** The default transport
records rather than delivers, so nothing outside this repository is contacted, and no screen shows
a `FAILED` or `UNDELIVERABLE` row. The capability is complete and operational in the sense every
tier can observe and in no other. That is recorded as open in `PRODUCT.md` twice, which is the right
disposition, but it means the sprint's user-facing claim rests entirely on a boundary nobody has
implemented behind.

**Could improve — the third registration list cost a ticket a debugging detour.** `ARCHITECTURE.md`
named two places a new capability directory must appear and there were three; SWHM-T-0224 found the
third by a `tsc --build` failure. The doc is corrected, but the underlying shape remains: three
literal, hand-maintained directory lists in three tools, none derived from any other. The next
capability directory will need all three again.

**Could improve — the implementation containers still ship no Chromium.** All four tickets hit the
same preflight failure and correctly fell back to `bun run verify`, as `.vortex/agents-generated.md`
instructs. The validation container had the opposite problem and installed Chromium mid-run. Neither
is a sprint defect and neither was filed, but it is the same environment drift SWHM-S-0019's
retrospective recorded, unchanged a sprint later.

## Compliance / Control Evidence

| Control                                | Evidence                                                                                          | Location                                                                               | Status         | Exception                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| Change specified before implementation | Change with proposal, design, delta spec and ticket-tagged task list; `validate --strict` passing | `openspec/changes/swhm-i-0012-customer-notifications-commu/`                           | Satisfied      | —                                                                                                         |
| Change reviewed before merge           | Ticket PRs merged to the sprint branch                                                            | PR #144, #145, #146, #147 (implementation), #148 (QA)                                  | Satisfied      | —                                                                                                         |
| Tests executed                         | `bun run verify` 858/858, Playwright 45/45, build exit 0, with real output recorded               | `artifacts/SWHM-S-0020/integration-test-result.md`, each ticket's `tdd-test-result.md` | Satisfied      | —                                                                                                         |
| Change verified before release         | QA report, PASS verdict, six scenario verdicts                                                    | `artifacts/SWHM-S-0020/qa-test-report.md`                                              | Satisfied      | —                                                                                                         |
| Defects dispositioned                  | None found at integration QA; none raised during the sprint window                                | `artifacts/SWHM-S-0020/integration-defects-resolution.md`                              | Satisfied      | —                                                                                                         |
| Requirement traceability               | Per-ticket ACs derived from the delta's scenarios; each AC mapped to a named test                 | `artifacts/SWHM-S-0020/SWHM-T-022{4,5,6,7}/PLAN.md` and `summary.md`                   | Satisfied      | —                                                                                                         |
| Data migration controlled              | Delivery-state columns generated by drizzle-kit and committed with the change                     | `drizzle/0013_curly_the_santerians.sql`, `db/schema.ts`                                | Satisfied      | —                                                                                                         |
| Test coverage measured                 | No coverage tool is declared in this project                                                      | —                                                                                      | Not Applicable | No `test:coverage` script and no `coverage` block in `vitest.config.ts`; a percentage would be fabricated |
