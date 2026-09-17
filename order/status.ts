// Fixed in artifacts/SWHM-S-0018/SWHM-T-0205/PLAN.md § Fixed interface
// contracts (design.md § Decisions D3, D7). The guard is a predicate over
// the current status, and a skip is reported rather than raised — this
// module is the predicate and the status read; SWHM-T-0206 is what calls
// them to decide one order. No transaction is opened here; the caller
// wraps it, mirroring fulfillment/status.ts's shape for the same job on
// the same table.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import type { OrderStatus } from "../admin/types";

export const TERMINAL_STATUSES: readonly OrderStatus[] = ["APPROVED", "DENIED", "COMPLETED"];

export function isDecidable(status: OrderStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

// null means no such order (an unknown id); a terminal status is a
// different answer from that and the caller reports them differently (D3).
export function readOrderDecidability(
  orderId: number,
): { status: OrderStatus; decidable: boolean } | null {
  const row = db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get();

  if (row === undefined) {
    return null;
  }

  const status = row.status as OrderStatus;
  return { status, decidable: isDecidable(status) };
}
