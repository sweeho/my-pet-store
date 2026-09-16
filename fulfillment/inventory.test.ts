import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { inventory, item } from "../db/schema";
import type { FulfillmentLine } from "./types";

import { checkInventory, getInventoryQuantity, reduceQuantity } from "./inventory";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as fulfillment/seed.test.ts: a fresh itemid per test,
 * no FK-parent rows required (FK enforcement is off, as that file's fixture
 * already relies on). PLAN.md step 6: held == ordered (fills, leaves 0),
 * held == ordered - 1 (refuses, leaves the figure untouched), and no row
 * at all.
 */

let itemCounter = 0;
function seedItem(): string {
  itemCounter += 1;
  const itemid = `fulfillment-inventory-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "fulfillment-inventory-product", listPrice: 9.99, unitCost: 4.99 })
    .run();
  return itemid;
}

function makeLine(itemid: string, quantity: number): FulfillmentLine {
  return {
    orderId: 1001,
    lineNumber: 1,
    itemid,
    catid: null,
    productid: null,
    quantity,
    quantityShipped: 0,
    unitPrice: 9.99,
  };
}

describe("fulfillment/inventory", () => {
  it("IT-01: getInventoryQuantity reads 0 for a missing row", () => {
    const itemid = seedItem();

    expect(getInventoryQuantity(itemid)).toBe(0);
  });

  it("IT-02: getInventoryQuantity reads the held quantity for an existing row", () => {
    const itemid = seedItem();
    db.insert(inventory).values({ itemid, quantity: 100 }).run();

    expect(getInventoryQuantity(itemid)).toBe(100);
  });

  it("IT-03: checkInventory confirms availability and reduces stock to 0 when held == ordered", () => {
    const itemid = seedItem();
    db.insert(inventory).values({ itemid, quantity: 30 }).run();

    const result = checkInventory(makeLine(itemid, 30));

    expect(result).toBe(true);
    expect(getInventoryQuantity(itemid)).toBe(0);
  });

  it("IT-04: checkInventory reduces to the AC-3 figure (100 held, 30 ordered -> 70 left)", () => {
    const itemid = seedItem();
    db.insert(inventory).values({ itemid, quantity: 100 }).run();

    const result = checkInventory(makeLine(itemid, 30));

    expect(result).toBe(true);
    expect(getInventoryQuantity(itemid)).toBe(70);
  });

  it("IT-05: checkInventory reports insufficient inventory and leaves it untouched when held == ordered - 1", () => {
    const itemid = seedItem();
    db.insert(inventory).values({ itemid, quantity: 29 }).run();

    const result = checkInventory(makeLine(itemid, 30));

    expect(result).toBe(false);
    expect(getInventoryQuantity(itemid)).toBe(29);
  });

  it("IT-06: checkInventory refuses a line with no inventory row at all", () => {
    const itemid = seedItem();

    const result = checkInventory(makeLine(itemid, 1));

    expect(result).toBe(false);
    expect(getInventoryQuantity(itemid)).toBe(0);
  });

  it("IT-07: reduceQuantity decrements the held quantity by the given amount", () => {
    const itemid = seedItem();
    db.insert(inventory).values({ itemid, quantity: 100 }).run();

    reduceQuantity(itemid, 30);

    expect(getInventoryQuantity(itemid)).toBe(70);
  });
});
