// Fixed in artifacts/SWHM-S-0017/SWHM-T-0190/PLAN.md § Fixed interface
// contracts (design.md § Decisions D2, D3). The order's status transition,
// and only that — this module is told to complete an order; the "all lines
// available" judgement belongs to the fulfilment pass (SWHM-T-0192). No
// transaction is opened here; the pass wraps it.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import type { OrderStatus } from "../admin/types";

export function readOrderStatus(orderId: number): OrderStatus | null {
  const row = db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get();
  return (row?.status as OrderStatus | undefined) ?? null;
}

// A second fulfilment run over a finished order is an ordinary event (D3),
// not an error — an order already COMPLETED is not moved again, and this
// reports that nothing changed by returning false rather than throwing.
export function markOrderCompleted(orderId: number): boolean {
  const status = readOrderStatus(orderId);

  if (status === null || status === "COMPLETED") {
    return false;
  }

  db.update(orders).set({ status: "COMPLETED" }).where(eq(orders.orderId, orderId)).run();
  return true;
}
