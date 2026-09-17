// The single-order approval/denial applier (design.md § Decisions D3, D6,
// D7). No transaction is opened here — the caller wraps it, mirroring
// fulfillment/status.ts's shape for the same job on the same table
// (order/status.ts's own header). SWHM-T-0212's batch layer wraps a whole
// batch of these calls in one db.transaction (D6); re-deciding an
// already-terminal order is safe because the guard reports a skip rather
// than writing again (D7).
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import type { ApprovalDecision, DecisionOutcome } from "./approval-types";
import { readOrderDecidability } from "./status";
import { createSupplierPo } from "./supplier-po";

export function applyDecision(orderId: number, decision: ApprovalDecision): DecisionOutcome {
  const current = readOrderDecidability(orderId);

  if (current === null) {
    return { orderId, result: "notFound" };
  }

  if (!current.decidable) {
    return { orderId, result: "skipped", status: current.status };
  }

  db.update(orders).set({ status: decision }).where(eq(orders.orderId, orderId)).run();

  // Approved only, never on a denial and never on a skip (design.md § D4;
  // PLAN.md tasks.md 4.7). Runs inside the caller's transaction, same as
  // the status write above.
  if (decision === "APPROVED") {
    createSupplierPo(orderId);
  }

  // EXTENSION POINT: SWHM-T-0213 inserts the notification write here (both
  // outcomes) — PLAN.md step 3. Runs inside the caller's transaction, same
  // as the writes above.

  return { orderId, result: "applied", status: decision };
}
