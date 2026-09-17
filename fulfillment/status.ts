// Fixed in artifacts/SWHM-S-0017/SWHM-T-0190/PLAN.md § Fixed interface
// contracts (design.md § Decisions D2, D3). The order's status transition,
// and only that — this module is told to complete an order; the "all lines
// available" judgement belongs to the fulfilment pass (SWHM-T-0192). No
// transaction is opened here; the pass wraps it.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import { notify } from "../notifications/notify";
import type { OrderStatus } from "../admin/types";

export function readOrderStatus(orderId: number): OrderStatus | null {
  const row = db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get();
  return (row?.status as OrderStatus | undefined) ?? null;
}

// The one place "which statuses may be fulfilled" is written (SWHM-T-0214,
// design.md D1, D3) — a positive test for APPROVED rather than a list of
// statuses to exclude, so a status added later is refused by default
// instead of silently becoming fulfillable.
export function isFulfillable(status: OrderStatus): boolean {
  return status === "APPROVED";
}

// A second fulfilment run over a finished order is an ordinary event (D3),
// not an error — an order already COMPLETED is not moved again, and this
// reports that nothing changed by returning false rather than throwing.
// An unknown order (status null) and a non-approved order both fail
// isFulfillable and are refused the same way.
export function markOrderCompleted(orderId: number): boolean {
  const status = readOrderStatus(orderId);

  if (status === null || !isFulfillable(status)) {
    return false;
  }

  db.update(orders).set({ status: "COMPLETED" }).where(eq(orders.orderId, orderId)).run();
  // Only on the path that actually transitions the order (design.md §
  // Decisions D3; PLAN.md step 6) — a refused or already-COMPLETED call
  // returns above and never reaches here, so a repeat run over a finished
  // order queues nothing.
  notify(orderId, "COMPLETION");
  return true;
}
