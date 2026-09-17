# SWHM-T-0212 — Transactional batch applier: one commit moves every decision or none

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 9 · Requirement: **Transition order status through approval workflow**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D3, D6, D7 and § Spec discrepancies S1, S6, S12 are what this ticket rests on.

## Objective

The batch layer: take a set of per-order decisions, apply them all inside one `db.transaction`, and report what happened to each. This is the "ProcessManager, transactionally consistent" of `tasks.md` group 9 (S6) and the `Required` transaction attribute of group 8 (S1), in the shape this stack actually has.

## Design reference

The mockup's selection summary — "3 selected · 3 uncommitted changes" — is the reader's model of a batch. Approve, Deny and Commit sit outside the table because one control writes the selected rows together; this ticket is the server side of that one write.

## Steps

1. Add `applyOrderDecisions(decisions)` to `admin/order-status.ts`, alongside the existing `updateOrderStatus`. It wraps the whole set in one `db.transaction`, calls `order/decision.ts`'s `applyDecision` per entry, and collects every `DecisionOutcome` (D6).
2. **Leave `updateOrderStatus` exactly as it is.** It is specified by the `admin-operations` capability and this change carries no delta modifying it. That it applies no status guard is recorded as S11 and raised as a separate improvement — do not "fix" it here, and do not route it through the new path.
3. The result aggregates rather than throws: `{ applied, skipped, notFound }`, each an array of order ids, following the `{ updated, notFound }` precedent already in this file. A batch in which every order is skipped is a success with an empty `applied` list, not an error — the caller has to be able to tell "already decided" from "wrong endpoint" (the reasoning the file's existing comment already records for unknown ids).
4. Duplicate order ids in one batch: the second is skipped by the guard, because the first already moved the order out of `PENDING`. This falls out of D7 rather than needing a branch — assert it, do not code around it.
5. `bun:sqlite` is single-connection, so there is no concurrent-writer race to defend against (S12). What the transaction buys is all-or-nothing, and the comment at the top of this file already says so — do not restate it, cite it.
6. Tests: extend `admin/order-status.test.ts` with a mixed batch — one order approved, one denied, one already terminal, one unknown id — asserting each lands in the right bucket and that the two decidable orders actually moved. Assert the all-or-nothing property directly by forcing a failure partway and reading back that nothing moved.

## File/module ownership

Create: nothing.
Modify: `admin/order-status.ts`, `admin/order-status.test.ts`.

This is the only ticket in the sprint that touches `admin/`.

## Fixed interface contracts

```ts
export type OrderDecision = { orderId: number; status: ApprovalDecision };
export type DecisionBatchResult = {
  applied: number[];
  skipped: number[];
  notFound: number[];
};
export function applyOrderDecisions(decisions: OrderDecision[]): DecisionBatchResult;
```

SWHM-T-0211 serializes `DecisionBatchResult` as its response body and SWHM-T-0210's screen reads it. `StatusUpdateResult` and `updateOrderStatus` keep their current signatures untouched.

## Definition of Done

AC-1 and AC-2, observed through the batch path by reading the order rows back after a commit.
