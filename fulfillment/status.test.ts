import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, notifications, orders } from "../db/schema";

import { isFulfillable, markOrderCompleted, readOrderStatus } from "./status";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as fulfillment/seed.test.ts. PLAN.md step 4: assert
 * both directions and the no-op — APPROVED -> COMPLETED returns true; a
 * second call returns false and the row is unchanged; an unknown order id
 * returns false rather than throwing; PENDING and DENIED both refuse and
 * leave the row untouched (design.md D1, the fix for SWHM-T-0214).
 *
 * PLAN.md step 6 / SWHM-T-0224: markOrderCompleted queues exactly one
 * COMPLETION notification on the path that actually transitions the
 * order, and none on a refused or repeat call.
 */

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `fulfillment-status-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

function seedOrder(status: string): number {
  const userName = seedUser();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 9.99, status })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

function readNotifications(orderId: number) {
  return db.select().from(notifications).where(eq(notifications.orderId, orderId)).all();
}

describe("fulfillment/status", () => {
  it("ST-01: readOrderStatus reads the current status of an existing order", () => {
    const orderId = seedOrder("PENDING");

    expect(readOrderStatus(orderId)).toBe("PENDING");
  });

  it("ST-02: readOrderStatus returns null for an unknown order id", () => {
    expect(readOrderStatus(999999)).toBeNull();
  });

  it("ST-03: markOrderCompleted moves an APPROVED order to COMPLETED and returns true", () => {
    const orderId = seedOrder("APPROVED");

    const result = markOrderCompleted(orderId);

    expect(result).toBe(true);
    expect(readOrderStatus(orderId)).toBe("COMPLETED");
  });

  it("ST-04: markOrderCompleted refuses an order already COMPLETED and reports no change", () => {
    const orderId = seedOrder("COMPLETED");

    const result = markOrderCompleted(orderId);

    expect(result).toBe(false);
    expect(readOrderStatus(orderId)).toBe("COMPLETED");
  });

  it("ST-05: a second call after completion returns false and leaves the row unchanged", () => {
    const orderId = seedOrder("APPROVED");

    expect(markOrderCompleted(orderId)).toBe(true);
    expect(markOrderCompleted(orderId)).toBe(false);
    expect(readOrderStatus(orderId)).toBe("COMPLETED");
  });

  it("ST-06: markOrderCompleted returns false for an unknown order id rather than throwing", () => {
    expect(() => markOrderCompleted(999999)).not.toThrow();
    expect(markOrderCompleted(999999)).toBe(false);
  });

  it("ST-07: markOrderCompleted refuses a PENDING order and leaves it PENDING (SWHM-T-0214 regression)", () => {
    const orderId = seedOrder("PENDING");

    const result = markOrderCompleted(orderId);

    expect(result).toBe(false);
    expect(readOrderStatus(orderId)).toBe("PENDING");
  });

  it("ST-08: markOrderCompleted refuses a DENIED order and leaves it DENIED (SWHM-T-0214 regression)", () => {
    const orderId = seedOrder("DENIED");

    const result = markOrderCompleted(orderId);

    expect(result).toBe(false);
    expect(readOrderStatus(orderId)).toBe("DENIED");
  });

  it("ST-09: isFulfillable is true only for APPROVED", () => {
    expect(isFulfillable("APPROVED")).toBe(true);
    expect(isFulfillable("PENDING")).toBe(false);
    expect(isFulfillable("DENIED")).toBe(false);
    expect(isFulfillable("COMPLETED")).toBe(false);
  });

  it("ST-10 / AC-2: completing an order queues exactly one COMPLETION notification", () => {
    const orderId = seedOrder("APPROVED");

    markOrderCompleted(orderId);

    const rows = readNotifications(orderId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ orderId, kind: "COMPLETION" });
  });

  it("ST-11 / AC-3: a second call over an already-COMPLETED order queues no additional notification", () => {
    const orderId = seedOrder("APPROVED");

    markOrderCompleted(orderId);
    markOrderCompleted(orderId);

    expect(readNotifications(orderId)).toHaveLength(1);
  });

  it("ST-12 / AC-3: refusing a PENDING order queues no notification", () => {
    const orderId = seedOrder("PENDING");

    markOrderCompleted(orderId);

    expect(readNotifications(orderId)).toHaveLength(0);
  });
});
