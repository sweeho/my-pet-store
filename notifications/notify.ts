// The single queueing entry point (design.md § Decisions D2, D3, D5). One
// row recording that the customer is owed word of a status change, nothing
// more — no mail dependency, no transport, no retry path; the rest of
// swhm-i-0012 owns delivery. No transaction is opened here — the caller's
// covers it, the same shape order/supplier-po.ts uses for its own write on
// this decision. Supersedes order/notification.ts's queueNotification,
// which this ticket removes (design.md S4).
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { notifications, orders } from "../db/schema";
import type { NotificationKind } from "./types";

// queuedAt defaults to the moment of the call so a test can fix it —
// order/supplier-po.ts's poDate parameter is the same pattern.
export function notify(orderId: number, kind: NotificationKind, queuedAt: Date = new Date()): void {
  // recipient_email is copied from the order's billing_email at the
  // moment of queuing, as a fallback only — the address actually used at
  // send time is resolved from the account instead (design.md § Decisions
  // D5). billing_email is nullable on the order, so a null is carried
  // through rather than refusing the notification. The caller only reaches
  // this after confirming the order exists, so an unmatched id here would
  // be a defect in the caller, not a case this module needs to handle.
  const order = db
    .select({ billingEmail: orders.billingEmail })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get()!;

  db.insert(notifications)
    .values({ orderId, kind, recipientEmail: order.billingEmail, queuedAt })
    .run();
}
