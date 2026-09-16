import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";
import { seedOrderIdSequence } from "./id";

/**
 * UNIT TEST
 *
 * Runs against the real in-memory db (db/client.ts's per-test-module
 * instance), same pattern as admin/order-status.test.ts. db/client.ts calls
 * seedOrderIdSequence(db) at import time, before the (VITEST-skipped) demo
 * order seed, so the orders table is already empty and pre-seeded to 1000
 * by the time this file's first test runs (design.md § Codebase findings
 * F6). ID-01/ID-02 rely on that starting condition.
 */
let userCounter = 0;
function seedOrder(): number {
  userCounter += 1;
  const userName = `order-id-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 10, status: "PENDING" })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

describe("order/id", () => {
  it("ID-01: the first order allocated in an empty table receives 1001", () => {
    expect(seedOrder()).toBe(1001);
  });

  it("ID-02: subsequent orders receive the next incrementing ids", () => {
    seedOrder();

    expect(seedOrder()).toBe(1003);
    expect(seedOrder()).toBe(1004);
  });

  it("ID-03: re-applying the seed to a table that already holds orders leaves existing rows and the next id untouched", () => {
    seedOrder();
    const second = seedOrder();
    const rowCountBeforeReseed = db.select().from(orders).all().length;

    seedOrderIdSequence(db);

    expect(db.select().from(orders).all()).toHaveLength(rowCountBeforeReseed);
    const third = seedOrder();
    expect(third).toBe(second + 1);
  });
});
