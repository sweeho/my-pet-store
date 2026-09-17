import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";

import { isDecidable, readOrderDecidability, TERMINAL_STATUSES } from "./status";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as fulfillment/status.test.ts. PLAN.md step 6: one
 * PENDING order reported decidable, one order in each terminal state
 * reported skipped with its current status carried back, and the
 * unknown-id case.
 */

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `order-status-user-${userCounter}`;
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

describe("order/status", () => {
  it("OS-01: TERMINAL_STATUSES is exactly APPROVED, DENIED, COMPLETED", () => {
    expect(TERMINAL_STATUSES).toEqual(["APPROVED", "DENIED", "COMPLETED"]);
  });

  it("OS-02: isDecidable is true only for PENDING", () => {
    expect(isDecidable("PENDING")).toBe(true);
    expect(isDecidable("APPROVED")).toBe(false);
    expect(isDecidable("DENIED")).toBe(false);
    expect(isDecidable("COMPLETED")).toBe(false);
  });

  it("OS-03: readOrderDecidability reports a PENDING order as decidable", () => {
    const orderId = seedOrder("PENDING");

    expect(readOrderDecidability(orderId)).toEqual({ status: "PENDING", decidable: true });
  });

  it("OS-04: readOrderDecidability reports an APPROVED order as not decidable", () => {
    const orderId = seedOrder("APPROVED");

    expect(readOrderDecidability(orderId)).toEqual({ status: "APPROVED", decidable: false });
  });

  it("OS-05: readOrderDecidability reports a DENIED order as not decidable", () => {
    const orderId = seedOrder("DENIED");

    expect(readOrderDecidability(orderId)).toEqual({ status: "DENIED", decidable: false });
  });

  it("OS-06: readOrderDecidability reports a COMPLETED order as not decidable", () => {
    const orderId = seedOrder("COMPLETED");

    expect(readOrderDecidability(orderId)).toEqual({ status: "COMPLETED", decidable: false });
  });

  it("OS-07: readOrderDecidability returns null for an unknown order id", () => {
    expect(readOrderDecidability(999999)).toBeNull();
  });
});
