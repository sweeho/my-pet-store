import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, inventory, item, orderLineItem, orders } from "../db/schema";
import { seedInventory } from "./seed";

/**
 * INTEGRATION TEST
 *
 * Runs against the real in-memory db Vitest swaps in (db/client.ts), same
 * pattern as catalog/seed.test.ts and admin/order-status.test.ts. Also
 * carries PLAN.md step 7's shape assertion: 1.1/1.2/1.4/1.6 are confirmed
 * against the existing orders/order_line_item tables here, never
 * redefined (design.md § Spec discrepancies S3).
 */
let itemCounter = 0;
function seedItem(): string {
  itemCounter += 1;
  const itemid = `fulfillment-seed-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "fulfillment-seed-product", listPrice: 9.99, unitCost: 4.99 })
    .run();
  return itemid;
}

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `fulfillment-seed-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

describe("fulfillment/seed", () => {
  it("FT-01: this test runs in the server (node) project, not client (jsdom)", () => {
    // jsdom defines `window`; a real node environment does not. Proves this
    // file — and every fulfillment/**/*.test.ts — is collected only by the
    // project that can resolve bun:sqlite (AC-3).
    expect(typeof window).toBe("undefined");
  });

  it("FT-02: a database built under Vitest holds no inventory rows", () => {
    expect(db.select().from(inventory).all()).toEqual([]);
  });

  it("FT-03: seedInventory gives every existing item a non-zero starting quantity", () => {
    const a = seedItem();
    const b = seedItem();

    seedInventory();

    const rows = db.select().from(inventory).all();
    const byItemid = new Map(rows.map((r) => [r.itemid, r.quantity]));

    expect(byItemid.get(a)).toBeGreaterThan(0);
    expect(byItemid.get(b)).toBeGreaterThan(0);
  });

  it("FT-04: a row in inventory holds a quantity against an item id", () => {
    const itemid = seedItem();
    db.insert(inventory).values({ itemid, quantity: 42 }).run();

    const row = db.select().from(inventory).where(eq(inventory.itemid, itemid)).get();

    expect(row?.quantity).toBe(42);
  });

  it("FT-05: an item with no inventory row reads as quantity 0, not null or an error", () => {
    const itemid = seedItem();

    const row = db.select().from(inventory).where(eq(inventory.itemid, itemid)).get();

    expect(row).toBeUndefined();
    expect(row?.quantity ?? 0).toBe(0);
  });

  it("FT-06: an order is created PENDING and its line starts at quantityShipped 0 (existing shape, not redefined)", () => {
    const userName = seedUser();
    const itemid = seedItem();

    const { orderId } = db
      .insert(orders)
      .values({ userName, orderDate: new Date(), orderAmount: 9.99, status: "PENDING" })
      .returning({ orderId: orders.orderId })
      .get();
    db.insert(orderLineItem)
      .values({ orderId, lineNumber: 1, itemid, quantity: 1, unitPrice: 9.99 })
      .run();

    const orderRow = db.select().from(orders).where(eq(orders.orderId, orderId)).get();
    const lineRow = db.select().from(orderLineItem).where(eq(orderLineItem.orderId, orderId)).get();

    expect(orderRow?.status).toBe("PENDING");
    expect(lineRow?.quantityShipped).toBe(0);
  });
});
