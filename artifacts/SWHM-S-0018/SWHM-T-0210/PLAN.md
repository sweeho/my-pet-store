# SWHM-T-0210 — Admin operations: row selection, bulk Approve/Deny, and Commit

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 7 · Requirement: **Orders Approval screen displays pending orders with editable status**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D3, D7, D8 and § Spec discrepancies S3, S11 are what this ticket rests on.

## Objective

Select rows, set them all to APPROVED or DENIED in one press, and commit every changed status to the server in one request. The last ticket in the sprint — it closes the journey the other nine make possible.

## Design reference

**`artifacts/SWHM-S-0018/design/mockup-orders-approval.html` is the authority.** It fixes the selection checkbox column and its select-all header, the selection summary reading "3 selected · 3 uncommitted changes", the three controls outside the table in order — **Approve** (outline), **Deny** (destructive), **Commit** (default) — and the footnote. Note the mockup shows rows with _different_ pending statuses committed together: a batch is per-order decisions, not one status for all.

## Steps

1. Add a selection column to `src/pages/admin/orders-approval.tsx`: a checkbox per row plus the select-all checkbox in the header the mockup shows. Each row checkbox carries an accessible name naming its order — `aria-label="Select order 1047"` — for the same reason the status control does.
2. **Selection and editing are separate controls, and selection decides what is written.** A status changed in an unticked row is not committed. The alternative — inferring intent from whether a control was touched — cannot tell "I changed my mind" from "I meant it", and makes every rendered row a candidate for a stale write. This is the standing rule for editable tables in this product, not a choice for this screen.
3. Approve sets every **selected** row's pending status to APPROVED; Deny sets them to DENIED. Both change local state only — nothing reaches the server until Commit.
4. Commit POSTs `{ decisions: [...] }` to `POST /api/admin/orders/decisions`, sending one entry per row whose status was changed **and** whose row is selected. Send no entry with status `PENDING` — that is a state, not a decision, and the endpoint refuses it.
5. The three controls sit **outside** the table, after it, with the selection summary line beside them. One control writes the selected rows together; a per-row save turns one intention into many actions with nothing showing what is still outstanding.
6. Commit is a pending action: disable it from the press until the outcome is known, change its label to the present participle ("Committing…"), and render a `role="status"` region naming what is happening. Restore both when the outcome arrives. A disabled control still carrying its original label reads as refused rather than busy.
7. Report the outcome at the form, not the field — one `role="alert"` above or beside the actions. The response's `skipped` list is a real outcome a reader must see: an order someone else already decided comes back skipped, and a screen that silently drops it leaves the reader believing they approved something they did not (D3, D7). Refresh the list after a successful commit so decided orders leave the pending view.
8. Note S11 in passing: the guarded path is this endpoint. The screen must not fall back to `POST /api/admin/orders/status`, which applies no status guard.
9. Tests: extend `src/pages/admin/orders-approval.test.tsx` for selection, the two bulk actions over a multi-row selection, the unticked-row-not-committed rule, the request body Commit sends, and the skipped-order report. Add `e2e/order-approval.spec.ts` covering the administrator's whole path — sign on, reach the screen from the admin home link, select three pending orders, Approve, Commit, and see all three gone from the pending list and present as APPROVED on `/admin/orders`. Playwright runs on its own port, so a dev server never absorbs the run.

## File/module ownership

Create: `e2e/order-approval.spec.ts`.
Modify: `src/pages/admin/orders-approval.tsx`, `src/pages/admin/orders-approval.test.tsx`.

## Fixed interface contracts

The request body and response are SWHM-T-0211's, unchanged:

```
POST /api/admin/orders/decisions
  body { decisions: { orderId: number; status: "APPROVED" | "DENIED" }[] }
  200  { applied: number[]; skipped: number[]; notFound: number[] }
```

`StatusSelect`'s props are SWHM-T-0208's and do not change.

## Definition of Done

AC-1 through AC-4. AC-4 (three orders bulk-approved) is the end-to-end assertion and is covered in `e2e/order-approval.spec.ts` as well as in the component test — the browser tier runs in CI on the ticket branch and again at integration QA.
