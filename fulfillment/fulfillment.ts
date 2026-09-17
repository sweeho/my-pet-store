// The fulfilment pass (design.md § Decisions D2, D3; PLAN.md's fixed
// interface contract). Composes the four modules its dependencies built —
// no held-quantity comparison, no status string and no XML lives here.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import { OrderNotFoundError } from "./errors";
import { checkInventory } from "./inventory";
import { createInvoice } from "./invoice";
import { isAlreadyShipped, markLineShipped, readLineItems } from "./line-items";
import { isFulfillable, markOrderCompleted, readOrderStatus } from "./status";
import type { FulfillmentLine, InvoiceOrder } from "./types";

// user_name and order_date are needed for the invoice; no sibling module
// exposes them, so this read is private to the pass (PLAN.md step 3).
function readInvoiceOrder(orderId: number): InvoiceOrder {
  const row = db
    .select({ orderId: orders.orderId, userName: orders.userName, orderDate: orders.orderDate })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get();

  if (!row) {
    throw new OrderNotFoundError(`Order ${orderId} not found.`);
  }

  return row;
}

// shippingDate defaults here rather than being read from a clock deep in
// the pass, so a test can always fix it by passing one explicitly
// (PLAN.md step 7); a production caller that omits it gets the moment
// processOrder was invoked.
export function processOrder(orderId: number, shippingDate: Date = new Date()): string | null {
  return db.transaction(() => {
    const order = readInvoiceOrder(orderId);

    // Refuse before anything commits (SWHM-T-0214, design.md D2) — a
    // non-approved order leaves with no inventory checked, no line shipped
    // and no invoice, the same answer as an order with nothing in stock.
    if (!isFulfillable(readOrderStatus(orderId)!)) {
      return null;
    }

    const lines = readLineItems(orderId);

    let allItemsAvailable = true;
    const fulfilledLines: FulfillmentLine[] = [];

    for (const line of lines) {
      // Already shipped is done, not missing — no inventory check runs
      // for it and it never makes the order unavailable (S6).
      if (isAlreadyShipped(line)) {
        continue;
      }

      if (checkInventory(line)) {
        markLineShipped(line);
        fulfilledLines.push(line);
      } else {
        allItemsAvailable = false;
      }
    }

    // Completed only when every line has gone out; otherwise the status
    // is left untouched — the order stays APPROVED (D3, D5).
    if (allItemsAvailable) {
      markOrderCompleted(orderId);
    }

    if (fulfilledLines.length === 0) {
      return null;
    }

    return createInvoice(order, fulfilledLines, shippingDate);
  });
}
