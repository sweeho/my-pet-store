import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";
import { applyOrderDecisions, updateOrderStatus } from "./order-status";

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

/**
 * INTEGRATION TEST (server project — reaches order/decision.ts, which
 * reaches order/supplier-po.ts and order/notification.ts, all through
 * db/client.ts / bun:sqlite).
 *
 * PLAN.md step 6: a mixed batch — one approved, one denied, one
 * already-terminal, one unknown id — lands in the right bucket and the two
 * decidable orders actually move; a duplicate order id in one batch is
 * skipped the second time by the guard (D7), not coded around; and the
 * all-or-nothing property is proved by forcing a failure partway and
 * reading back that nothing moved.
 */
describe("applyOrderDecisions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function statusOfDecision(orderId: number): string | undefined {
    return db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.orderId, orderId))
      .get()?.status;
  }

  it("AC-1 / AC-2 / OD-01: a mixed batch sorts each order into its bucket and moves the decidable ones", () => {
    const toApprove = seedOrder("PENDING");
    const toDeny = seedOrder("PENDING");
    const alreadyApproved = seedOrder("APPROVED");
    const unknownId = 999_999;

    const result = applyOrderDecisions([
      { orderId: toApprove, status: "APPROVED" },
      { orderId: toDeny, status: "DENIED" },
      { orderId: alreadyApproved, status: "DENIED" },
      { orderId: unknownId, status: "APPROVED" },
    ]);

    expect(result).toEqual({
      applied: [toApprove, toDeny],
      skipped: [alreadyApproved],
      notFound: [unknownId],
    });
    expect(statusOfDecision(toApprove)).toBe("APPROVED");
    expect(statusOfDecision(toDeny)).toBe("DENIED");
    expect(statusOfDecision(alreadyApproved)).toBe("APPROVED");
  });

  it("OD-02: a batch where every order is already terminal is a success with an empty applied list", () => {
    const alreadyDenied = seedOrder("DENIED");

    const result = applyOrderDecisions([{ orderId: alreadyDenied, status: "APPROVED" }]);

    expect(result).toEqual({ applied: [], skipped: [alreadyDenied], notFound: [] });
  });

  it("D7 / OD-03: a duplicate order id in one batch is applied once, skipped the second time by the guard", () => {
    const orderId = seedOrder("PENDING");

    const result = applyOrderDecisions([
      { orderId, status: "APPROVED" },
      { orderId, status: "APPROVED" },
    ]);

    expect(result).toEqual({ applied: [orderId], skipped: [orderId], notFound: [] });
    expect(statusOfDecision(orderId)).toBe("APPROVED");
  });

  it("D6 / OD-04: a write failing partway through the batch rolls back every order to its original status", () => {
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

    expect(() =>
      applyOrderDecisions([
        { orderId: first, status: "APPROVED" },
        { orderId: second, status: "APPROVED" },
      ]),
    ).toThrow("simulated write failure");

    expect(statusOfDecision(first)).toBe("PENDING");
    expect(statusOfDecision(second)).toBe("PENDING");
  });
});
