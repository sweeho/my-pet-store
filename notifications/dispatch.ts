// The drain pass (design.md § Decisions D4, D5, D6, D7; § Spec
// discrepancies S1, S6). Reads every row still QUEUED and leaves each one
// terminal in the same pass — SENT, FAILED or UNDELIVERABLE — so a repeat
// run over the same rows hands the transport nothing (D7). Nothing
// schedules this: it runs on the request that queued the row, after that
// request's own transaction has already committed (D4), never inside it.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { notifications, orders } from "../db/schema";
import { buildMessage } from "./message";
import { resolveRecipient } from "./recipient";
import { recordingTransport } from "./transport";
import type { MailTransport } from "./transport";
import type { NotificationKind } from "./types";

export type DispatchResult = { sent: number; failed: number; undeliverable: number };

const NO_ADDRESS_REASON = "No email address on file";

function currentOrderStatus(orderId: number): string {
  return (
    db.select({ status: orders.status }).from(orders).where(eq(orders.orderId, orderId)).get()
      ?.status ?? ""
  );
}

// dispatchQueued never throws (PLAN.md § Fixed interface contracts): every
// per-row outcome — sent, failed or undeliverable — is written to the row
// and counted in the result, and a transport throw is caught per-row so
// one bad row never stops the rest of the pass.
export function dispatchQueued(transport: MailTransport = recordingTransport): DispatchResult {
  const queuedRows = db
    .select()
    .from(notifications)
    .where(eq(notifications.status, "QUEUED"))
    .all();

  const result: DispatchResult = { sent: 0, failed: 0, undeliverable: 0 };

  for (const row of queuedRows) {
    const recipient = resolveRecipient(row.orderId);
    // The account's address wins over the row's copied fallback (design.md
    // § Decisions D5) — the narrow exception to "an order records what was
    // agreed" that the Customer email retrieval requirement observes.
    const to = recipient.email ?? row.recipientEmail;

    if (!to) {
      db.update(notifications)
        .set({ status: "UNDELIVERABLE", failureReason: NO_ADDRESS_REASON })
        .where(eq(notifications.id, row.id))
        .run();
      result.undeliverable += 1;
      continue;
    }

    const message = buildMessage({
      orderId: row.orderId,
      kind: row.kind as NotificationKind,
      status: currentOrderStatus(row.orderId),
      recipient,
      to,
    });

    try {
      transport.send(message);
      db.update(notifications)
        .set({ status: "SENT", sentAt: new Date() })
        .where(eq(notifications.id, row.id))
        .run();
      result.sent += 1;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // No logging dependency exists in this product (F12) —
      // console.error with the order id is the established mechanism, the
      // same one routes/api/fulfillment/process.post.ts uses for its own
      // unexpected failures.
      console.error(
        `notifications/dispatch: order ${row.orderId} notification ${row.id} failed:`,
        error,
      );
      db.update(notifications)
        .set({ status: "FAILED", failureReason: reason })
        .where(eq(notifications.id, row.id))
        .run();
      result.failed += 1;
    }
  }

  return result;
}
