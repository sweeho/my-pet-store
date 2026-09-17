import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, notifications, orders } from "../db/schema";
import { notify } from "./notify";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as the superseded order/notification.test.ts.
 * PLAN.md step 8: a queued row per kind, carrying QUEUED status and no
 * sent timestamp or failure reason; the null-email case; the default
 * queuedAt.
 */

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `notify-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

function seedOrder(billingEmail: string | null): number {
  const userName = seedUser();
  const { orderId } = db
    .insert(orders)
    .values({
      userName,
      orderDate: new Date(),
      orderAmount: 9.99,
      status: "APPROVED",
      billingEmail,
    })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

function readNotifications(orderId: number) {
  return db.select().from(notifications).where(eq(notifications.orderId, orderId)).all();
}

describe("notify", () => {
  it.each(["APPROVAL", "DENIAL", "COMPLETION"] as const)(
    "AC-2 / NF-01: queues a %s row carrying the order id, copied billing email and QUEUED status",
    (kind) => {
      const orderId = seedOrder("ada@example.com");
      const queuedAt = new Date("2026-01-15T00:00:00.000Z");

      notify(orderId, kind, queuedAt);

      expect(readNotifications(orderId)).toEqual([
        expect.objectContaining({
          orderId,
          kind,
          recipientEmail: "ada@example.com",
          queuedAt,
          status: "QUEUED",
          sentAt: null,
          failureReason: null,
        }),
      ]);
    },
  );

  it("NF-02: a null billing_email is carried through as a null recipient_email, not refused", () => {
    const orderId = seedOrder(null);

    notify(orderId, "APPROVAL");

    expect(readNotifications(orderId)).toEqual([
      expect.objectContaining({ orderId, kind: "APPROVAL", recipientEmail: null }),
    ]);
  });

  it("NF-03: queuedAt defaults to the moment of the call when not given", () => {
    const orderId = seedOrder("ada@example.com");
    // The integer timestamp column truncates to whole seconds (same as
    // orders.orderDate), so both sides are floored to seconds before
    // comparing.
    const beforeSeconds = Math.floor(Date.now() / 1000);

    notify(orderId, "APPROVAL");

    const [row] = readNotifications(orderId);
    expect(Math.floor(row!.queuedAt.getTime() / 1000)).toBeGreaterThanOrEqual(beforeSeconds);
  });
});
