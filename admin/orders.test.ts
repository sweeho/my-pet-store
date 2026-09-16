import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";
import { getOrdersByStatus } from "./orders";

let userCounter = 0;
function seedOrder(status: string, orderDate: Date, orderAmount = 10): number {
  userCounter += 1;
  const userName = `order-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate, orderAmount, status })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

const DAY_MS = 24 * 60 * 60 * 1000;
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

/**
 * INTEGRATION TEST
 *
 * All cases share one in-memory db within this file (db/client.ts's
 * per-test-module instance), so a later test still sees an earlier test's
 * rows. Every assertion below is scoped to the specific order ids a test
 * just created rather than a status's total row count, except OT-01, which
 * runs first — before anything else in the file has seeded a row — to
 * exercise a genuinely empty result.
 */
describe("admin/orders getOrdersByStatus", () => {
  it("OT-01: an empty result for a status with no orders", () => {
    const page = getOrdersByStatus("DENIED");

    expect(page.items).toEqual([]);
    expect(page.hasNext).toBe(false);
  });

  it("OT-02: filtering by a single status returns only orders with that status", () => {
    seedOrder("PENDING", daysAgo(1));
    const approvedId = seedOrder("APPROVED", daysAgo(2));
    seedOrder("DENIED", daysAgo(3));

    const page = getOrdersByStatus("APPROVED", 0, 1000);

    expect(page.items.some((o) => o.orderId === approvedId)).toBe(true);
    expect(page.items.every((o) => o.orderStatus === "APPROVED")).toBe(true);
  });

  it("OT-03: filtering by several statuses returns orders matching any of them, and nothing outside them", () => {
    const approvedId = seedOrder("APPROVED", daysAgo(1));
    const completedId = seedOrder("COMPLETED", daysAgo(2));
    seedOrder("PENDING", daysAgo(3));
    seedOrder("DENIED", daysAgo(4));

    const page = getOrdersByStatus(["APPROVED", "COMPLETED"], 0, 1000);
    const ids = page.items.map((o) => o.orderId);

    expect(ids).toEqual(expect.arrayContaining([approvedId, completedId]));
    expect(
      page.items.every((o) => o.orderStatus === "APPROVED" || o.orderStatus === "COMPLETED"),
    ).toBe(true);
  });

  it("OT-04: results sort by order_date descending, newest first", () => {
    const older = seedOrder("PENDING", daysAgo(100));
    const newer = seedOrder("PENDING", daysAgo(1));

    const page = getOrdersByStatus("PENDING", 0, 1000);
    const relevant = page.items.map((o) => o.orderId).filter((id) => id === older || id === newer);

    expect(relevant).toEqual([newer, older]);
  });

  it("OT-05: order_id breaks ties between orders sharing the same order_date", () => {
    const sameDate = daysAgo(50);
    const first = seedOrder("PENDING", sameDate);
    const second = seedOrder("PENDING", sameDate);

    const page = getOrdersByStatus("PENDING", 0, 1000);
    const relevant = page.items.map((o) => o.orderId).filter((id) => id === first || id === second);

    expect(relevant).toEqual([second, first]);
  });

  it("OT-06: hasNext is true when more rows exist beyond the requested page", () => {
    seedOrder("APPROVED", daysAgo(1));
    seedOrder("APPROVED", daysAgo(2));
    seedOrder("APPROVED", daysAgo(3));

    const page = getOrdersByStatus("APPROVED", 0, 2);

    expect(page.items).toHaveLength(2);
    expect(page.hasNext).toBe(true);
  });

  it("OT-07: hasNext is false on the last page", () => {
    const existingTotal = getOrdersByStatus("COMPLETED", 0, 100000).items.length;
    const a = seedOrder("COMPLETED", daysAgo(1));
    const b = seedOrder("COMPLETED", daysAgo(2));

    const page = getOrdersByStatus("COMPLETED", 0, existingTotal + 2);

    expect(page.items.map((o) => o.orderId)).toEqual(expect.arrayContaining([a, b]));
    expect(page.hasNext).toBe(false);
  });

  it("OT-08: an OrderSummary carries the five fields the criterion names, under their JSON keys", () => {
    const orderId = seedOrder("APPROVED", daysAgo(1), 42.5);

    const page = getOrdersByStatus("APPROVED", 0, 1000);
    const summary = page.items.find((o) => o.orderId === orderId);

    expect(summary).toMatchObject({
      orderId,
      orderAmount: 42.5,
      orderStatus: "APPROVED",
    });
    expect(typeof summary?.userId).toBe("string");
    expect(typeof summary?.orderDate).toBe("string");
  });
});
