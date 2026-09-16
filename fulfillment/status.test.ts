import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";

import { markOrderCompleted, readOrderStatus } from "./status";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as fulfillment/seed.test.ts. PLAN.md step 6: assert
 * both directions and the no-op — PENDING -> COMPLETED returns true; a
 * second call returns false and the row is unchanged; an unknown order id
 * returns false rather than throwing.
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

describe("fulfillment/status", () => {
  it("ST-01: readOrderStatus reads the current status of an existing order", () => {
    const orderId = seedOrder("PENDING");

    expect(readOrderStatus(orderId)).toBe("PENDING");
  });

  it("ST-02: readOrderStatus returns null for an unknown order id", () => {
    expect(readOrderStatus(999999)).toBeNull();
  });

  it("ST-03: markOrderCompleted moves a PENDING order to COMPLETED and returns true", () => {
    const orderId = seedOrder("PENDING");

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
    const orderId = seedOrder("PENDING");

    expect(markOrderCompleted(orderId)).toBe(true);
    expect(markOrderCompleted(orderId)).toBe(false);
    expect(readOrderStatus(orderId)).toBe("COMPLETED");
  });

  it("ST-06: markOrderCompleted returns false for an unknown order id rather than throwing", () => {
    expect(() => markOrderCompleted(999999)).not.toThrow();
    expect(markOrderCompleted(999999)).toBe(false);
  });
});
