// Batch order status update, fixed in artifacts/SWHM-S-0012/SWHM-T-0119/PLAN.md
// § Fixed interface contracts.
//
// S5 (design.md § Spec discrepancies): the legacy framing delegates to an
// AsyncSender EJB that posts an OrderApproval message to a queue. bun:sqlite
// is a single-connection embedded database — there is no concurrent writer
// to isolate from and no queue to hand work to (catalog/transaction.ts
// already records this same reasoning for a read). What a transaction gives
// instead is the property the scenario actually asserts: every order in the
// batch moves or none does.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import type { ApprovalDecision, DecisionOutcome } from "../order/approval-types";
import { applyDecision } from "../order/decision";
import type { OrderStatus } from "./types";

export type StatusUpdateResult = {
  updated: number[];
  notFound: number[];
};

// D5 (design.md): unknown order ids are reported, not silently dropped —
// a batch that matches nothing is still a success with an empty `updated`
// list, not an error, so the caller can tell "no such orders" apart from a
// request that changed nothing because of a wrong endpoint.
export function updateOrderStatus(orderIds: number[], newStatus: OrderStatus): StatusUpdateResult {
  return db.transaction(() => {
    const updated: number[] = [];
    const notFound: number[] = [];

    for (const orderId of orderIds) {
      const row = db
        .update(orders)
        .set({ status: newStatus })
        .where(eq(orders.orderId, orderId))
        .returning({ orderId: orders.orderId })
        .get();

      if (row) {
        updated.push(orderId);
      } else {
        notFound.push(orderId);
      }
    }

    return { updated, notFound };
  });
}

// The batch applier for the guarded approval path (design.md § Decisions
// D3, D6, D7; § Spec discrepancies S1, S6, S12) — the "ProcessManager,
// transactionally consistent" of tasks.md group 9 and the `Required`
// transaction attribute of group 8, in the shape this stack has: there is
// no broker and no concurrent writer to isolate from (bun:sqlite is
// single-connection, S12), so what the transaction buys is the same
// all-or-nothing property updateOrderStatus's own comment already
// describes for this file — cited here, not restated.
//
// This is deliberately a second path from updateOrderStatus above, not a
// shared one: that function is specified by admin-operations and applies
// no status guard (S11, raised separately), and routing it through
// applyDecision here would change its behaviour with no delta authorising
// it (PLAN.md step 2).
export type OrderDecision = { orderId: number; status: ApprovalDecision };

export type DecisionBatchResult = {
  applied: number[];
  skipped: number[];
  notFound: number[];
};

// A duplicate order id in one batch needs no special case: the first
// occurrence moves the order out of PENDING, so the guard inside
// applyDecision reports the second occurrence as skipped on its own (D7).
export function applyOrderDecisions(decisions: OrderDecision[]): DecisionBatchResult {
  return db.transaction(() => {
    const applied: number[] = [];
    const skipped: number[] = [];
    const notFound: number[] = [];

    for (const { orderId, status } of decisions) {
      const outcome: DecisionOutcome = applyDecision(orderId, status);

      if (outcome.result === "applied") {
        applied.push(outcome.orderId);
      } else if (outcome.result === "skipped") {
        skipped.push(outcome.orderId);
      } else {
        notFound.push(outcome.orderId);
      }
    }

    return { applied, skipped, notFound };
  });
}
