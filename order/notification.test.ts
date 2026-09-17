import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, notifications, orders } from "../db/schema";
import { queueNotification } from "./notification";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as order/supplier-po.test.ts. PLAN.md step 5: the
 * row's kind, order id and copied email for each outcome, and the
 * null-email case.
 */

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `notification-user-${userCounter}`;
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

describe("queueNotification", () => {
  it("AC-1 / NT-01: queues an APPROVAL row carrying the order id and copied billing email", () => {
    const orderId = seedOrder("ada@example.com");
    const queuedAt = new Date("2026-01-15T00:00:00.000Z");

    queueNotification(orderId, "APPROVAL", queuedAt);

    expect(readNotifications(orderId)).toEqual([
      expect.objectContaining({
        orderId,
        kind: "APPROVAL",
        recipientEmail: "ada@example.com",
        queuedAt,
      }),
    ]);
  });

  it("AC-2 / NT-02: queues a DENIAL row carrying the order id and copied billing email", () => {
    const orderId = seedOrder("grace@example.com");
    const queuedAt = new Date("2026-01-15T00:00:00.000Z");

    queueNotification(orderId, "DENIAL", queuedAt);

    expect(readNotifications(orderId)).toEqual([
      expect.objectContaining({
        orderId,
        kind: "DENIAL",
        recipientEmail: "grace@example.com",
        queuedAt,
      }),
    ]);
  });

  it("NT-03: a null billing_email is carried through as a null recipient_email, not refused", () => {
    const orderId = seedOrder(null);

    queueNotification(orderId, "APPROVAL");

    expect(readNotifications(orderId)).toEqual([
      expect.objectContaining({ orderId, kind: "APPROVAL", recipientEmail: null }),
    ]);
  });

  it("NT-04: queuedAt defaults to the moment of the call when not given", () => {
    const orderId = seedOrder("ada@example.com");
    // The integer timestamp column truncates to whole seconds (same as
    // orders.orderDate), so both sides are floored to seconds before
    // comparing.
    const beforeSeconds = Math.floor(Date.now() / 1000);

    queueNotification(orderId, "APPROVAL");

    const [row] = readNotifications(orderId);
    expect(Math.floor(row!.queuedAt.getTime() / 1000)).toBeGreaterThanOrEqual(beforeSeconds);
  });
});
