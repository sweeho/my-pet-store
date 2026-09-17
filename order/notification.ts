// Customer notifications queued on approval and denial (design.md §
// Decisions D5, D6, D7; § Spec discrepancies S9). A row recording that the
// customer is owed word of a decision, nothing more — no mail dependency,
// no transport, no retry path; swhm-i-0012 owns delivery. No transaction is
// opened here — the caller's covers it, the same shape order/supplier-po.ts
// uses for its own write on this decision.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { notifications, orders } from "../db/schema";
import type { NotificationKind } from "./approval-types";

// queuedAt defaults to the moment of the call so a test can fix it —
// order/supplier-po.ts's poDate parameter is the same pattern.
export function queueNotification(
  orderId: number,
  kind: NotificationKind,
  queuedAt: Date = new Date(),
): void {
  // recipient_email is copied from the order's billing_email at the
  // moment of queuing, never joined from the account (design.md §
  // Decisions D5, and the standing rule that an order records what was
  // agreed). billing_email is nullable on the order, so a null is carried
  // through rather than refusing the decision (PLAN.md step 2). The caller
  // only reaches this after confirming the order exists, so an unmatched
  // id here would be a defect in the caller, not a case this module needs
  // to handle.
  const order = db
    .select({ billingEmail: orders.billingEmail })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get()!;

  db.insert(notifications)
    .values({ orderId, kind, recipientEmail: order.billingEmail, queuedAt })
    .run();
}
