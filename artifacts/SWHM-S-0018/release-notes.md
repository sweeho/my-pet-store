---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0018
idea: SWHM-I-0011
branch: vortex/sprint/swhm-s-0018-12051c41
upstream: [artifacts/SWHM-S-0018/qa-test-report.md]
---

# Release notes — SWHM-S-0018

## Added

- Administrators have an **Orders Approval** screen at `/admin/orders-approval`, reachable from the admin home via **Review Pending Orders** and only when signed in as an administrator. It lists every order still waiting on a decision with its id, customer, date and amount. (SWHM-T-0208)
- Each row on that screen carries a status control offering Pending, Approved and Denied, so an order can be decided one at a time. (SWHM-T-0208)
- Rows can be ticked and decided together: **Approve** and **Deny** set every ticked row at once, a running "n selected · n uncommitted changes" line says what is about to be sent, and **Commit** sends the whole batch in one go. The screen then reports what happened — including any order that was already decided and so was skipped — and reloads the list from the server. Nothing is written until Commit is used. (SWHM-T-0210)
- Order statuses are colour-coded on that screen, in both the light and dark themes. The status word is always shown alongside the colour, so nothing depends on being able to distinguish the colours. (SWHM-T-0209)
- Approving an order now produces a supplier purchase order recording the order, its date, the full shipping address and every line item, where order fulfilment can read it. Approving the same order again does not produce a second one. (SWHM-T-0207)
- Approving or denying an order queues a notification for the customer, recording the outcome they are owed. Skipping an already-decided order queues nothing. (SWHM-T-0213)
- `POST /api/admin/orders/decisions` accepts a batch of `{ orderId, status }` decisions for administrators and answers with which were applied, which were skipped and which orders were not found. A batch either lands completely or not at all — if any decision fails, none of them is written. Only APPROVED and DENIED are accepted as decisions; anything else is refused. (SWHM-T-0211, SWHM-T-0212)

## Changed

- Small orders no longer wait for a person. An order placed in the United States under $500, or in Japan under ¥50,000, is approved the moment it is placed; everything else is still created pending a decision. The order queue therefore now shows only the orders that actually need attention. (SWHM-T-0204)
- An order's status is now final once it is approved, denied or completed. Deciding an already-decided order through the approval screen or the new endpoint changes nothing and is reported back as skipped, rather than silently overwriting the earlier outcome. (SWHM-T-0205, SWHM-T-0206)
- An order now records the language the customer was shopping in when they placed it. This is what the auto-approval threshold is chosen by, and it is fixed at placement — changing the profile language later does not change how an existing order was decided. (SWHM-T-0204)

## Upgrade notes

- **Three database migrations** are added and applied automatically at startup: `drizzle/0010_fast_polaris.sql` (a `locale` column on `orders`), `0011_tiresome_jubilee.sql` (the `supplier_po` and `supplier_po_line_item` tables) and `0012_slow_cable.sql` (the `notifications` table). No manual step and no downtime handling is required for an embedded SQLite database.
- **Orders placed before this release have no locale recorded**, which reads the same as an unrecognised one: they are never auto-approved and stay pending until somebody decides them. Nothing is back-filled and no existing order's status is changed by the upgrade.
- **Auto-approval starts applying immediately to newly placed orders** — a small US or Japan order that would previously have appeared in the queue now never does. The thresholds are fixed in code and are not configurable.
- No configuration, environment variable or feature flag was added, and the existing `POST /api/admin/orders/status` endpoint is unchanged.

## Not included

- Nothing sends the queued customer notification. The store records that the customer is owed word of the decision; delivering it belongs to a later capability. The same holds for the supplier purchase order — it is a record for order fulfilment to read, not a message sent to a supplier.
- A denied order cannot be reconsidered, and neither can an approved one. There is no un-deny, no reopen and no record of who decided an order or when.
- The screen shows every pending order in one list with no paging, no filter, no sort and no search. It also does not show the count of orders awaiting review in its subheading, and has no "Pending orders" label above the table — both are in the supplied mockup and were noted as cosmetic gaps at QA (`qa-test-report.md` § Code Review) rather than fixed.
- Order fulfilment still completes an order without first requiring it to be approved, so a denied order can be marked complete by a fulfilment run (SWHM-T-0214, open).
- The older `POST /api/admin/orders/status` endpoint still writes a status without the immutability guard the approval path applies, so the two administrator paths disagree about whether a decided order can be changed (SWHM-T-0215, open).
- Nothing in the store shows a shopper the status of their own order.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0018/qa-test-report.md` (PASS; all 23 spec scenarios passed, 818/818 unit tests, 44/44 browser tests, no defect found).

## Compliance / Control Evidence

| Control                              | Evidence                                                | Location                                  | Status    | Exception                                           |
| ------------------------------------ | ------------------------------------------------------- | ----------------------------------------- | --------- | --------------------------------------------------- |
| Release contents recorded            | this file                                               | `artifacts/SWHM-S-0018/release-notes.md`  | Satisfied | —                                                   |
| Release verified before land         | QA PASS verdict                                         | `artifacts/SWHM-S-0018/qa-test-report.md` | Satisfied | —                                                   |
| Known limitations disclosed          | § Not included, with ticket keys for the two open items | this file                                 | Satisfied | SWHM-T-0214 and SWHM-T-0215 ship open and untriaged |
| Schema change recorded for operators | § Upgrade notes names all three migrations              | this file                                 | Satisfied | —                                                   |
