import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";
import { updateOrderStatus } from "./order-status";

/**
 * UNIT TEST
 *
 * Exercises updateOrderStatus against the real in-memory database Vitest
 * swaps in (db/client.ts), never a mocked db — the rollback case in
 * particular has to be proved by re-reading real rows afterward, not by
 * inspecting a mock's call log (PLAN.md's gotcha).
 */
let userCounter = 0;
function seedOrder(status: string): number {
  userCounter += 1;
  const userName = `order-status-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 10, status })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

function statusOf(orderId: number): string | undefined {
  return db.select({ status: orders.status }).from(orders).where(eq(orders.orderId, orderId)).get()
    ?.status;
}

describe("updateOrderStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("US-01: moves every order in the batch to the new status", () => {
    const a = seedOrder("PENDING");
    const b = seedOrder("PENDING");

    const result = updateOrderStatus([a, b], "APPROVED");

    expect(result).toEqual({ updated: [a, b], notFound: [] });
    expect(statusOf(a)).toBe("APPROVED");
    expect(statusOf(b)).toBe("APPROVED");
  });

  it("US-02: a mix of known and unknown ids reports both lists and still moves the known ones", () => {
    const known = seedOrder("PENDING");
    const unknownId = known + 100_000;

    const result = updateOrderStatus([known, unknownId], "APPROVED");

    expect(result).toEqual({ updated: [known], notFound: [unknownId] });
    expect(statusOf(known)).toBe("APPROVED");
  });

  it("US-03: a batch that matches nothing is a success with an empty updated list", () => {
    const unknownId = 999_999;

    const result = updateOrderStatus([unknownId], "APPROVED");

    expect(result).toEqual({ updated: [], notFound: [unknownId] });
  });

  it("US-04: a write failing partway through the batch rolls back every order to its original status", () => {
    const first = seedOrder("PENDING");
    const second = seedOrder("PENDING");

    const originalUpdate = db.update.bind(db);
    let callCount = 0;
    vi.spyOn(db, "update").mockImplementation((table) => {
      callCount += 1;
      if (callCount === 2) {
        throw new Error("simulated write failure");
      }
      return originalUpdate(table);
    });

    expect(() => updateOrderStatus([first, second], "APPROVED")).toThrow("simulated write failure");

    expect(statusOf(first)).toBe("PENDING");
    expect(statusOf(second)).toBe("PENDING");
  });
});
