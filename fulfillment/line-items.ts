// Fixed in artifacts/SWHM-S-0017/SWHM-T-0191/PLAN.md § Fixed interface
// contracts (design.md § Decisions D3, D4).
import { and, asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { orderLineItem } from "../db/schema";
import type { FulfillmentLine } from "./types";

export function readLineItems(orderId: number): FulfillmentLine[] {
  return db
    .select()
    .from(orderLineItem)
    .where(eq(orderLineItem.orderId, orderId))
    .orderBy(asc(orderLineItem.lineNumber))
    .all();
}

// A line is either untouched or fully shipped — no intermediate state can
// arise, because markLineShipped only ever writes the full quantity (D3).
// The spec's "Partially shipped items are skipped" scenario shares the
// exact same GIVEN (quantity=50, quantityShipped=50) as "Shipped line
// items are skipped" (design.md § Spec discrepancies S6); this equality
// check is the one rule both scenarios describe.
export function isAlreadyShipped(line: FulfillmentLine): boolean {
  return line.quantityShipped === line.quantity;
}

// Writes the line's own full quantity against its (order_id, line_number)
// composite key — never an arbitrary figure, so no caller can invent a
// partial shipment this capability cannot represent (D3).
export function markLineShipped(line: FulfillmentLine): void {
  db.update(orderLineItem)
    .set({ quantityShipped: line.quantity })
    .where(
      and(eq(orderLineItem.orderId, line.orderId), eq(orderLineItem.lineNumber, line.lineNumber)),
    )
    .run();
}
