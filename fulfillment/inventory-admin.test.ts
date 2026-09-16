import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { inventory, item } from "../db/schema";
import { InvalidInventoryUpdateError } from "./errors";
import { applyInventoryUpdates, listInventory } from "./inventory-admin";

/**
 * INTEGRATION TEST
 *
 * Runs against the real in-memory db Vitest swaps in (db/client.ts), same
 * pattern as fulfillment/seed.test.ts and admin/order-status.test.ts.
 */
let itemCounter = 0;
function seedItem(): string {
  itemCounter += 1;
  const itemid = `inv-admin-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "inv-admin-product", listPrice: 9.99, unitCost: 4.99 })
    .run();
  return itemid;
}

function seedStockedItem(quantity: number): string {
  const itemid = seedItem();
  db.insert(inventory).values({ itemid, quantity }).run();
  return itemid;
}

describe("fulfillment/inventory-admin", () => {
  describe("listInventory", () => {
    it("IA-01: a stocked item lists its held quantity", () => {
      const itemid = seedStockedItem(24);

      const rows = listInventory();

      expect(rows).toContainEqual({ itemid, quantity: 24 });
    });

    it("IA-02: a catalogue item never stocked lists as quantity 0 (left join, D5)", () => {
      const itemid = seedItem();

      const rows = listInventory();

      expect(rows).toContainEqual({ itemid, quantity: 0 });
    });

    it("IA-03: rows are ordered by item id", () => {
      const b = `inv-admin-order-b-${itemCounter + 1}`;
      const a = `inv-admin-order-a-${itemCounter + 2}`;
      db.insert(item)
        .values([
          { itemid: b, productid: "inv-admin-product", listPrice: 1, unitCost: 1 },
          { itemid: a, productid: "inv-admin-product", listPrice: 1, unitCost: 1 },
        ])
        .run();
      itemCounter += 2;

      const rows = listInventory();
      const indexA = rows.findIndex((row) => row.itemid === a);
      const indexB = rows.findIndex((row) => row.itemid === b);

      expect(indexA).toBeLessThan(indexB);
    });
  });

  describe("applyInventoryUpdates", () => {
    it("IA-04: writes the new quantity for a stocked item and reports it updated", () => {
      const itemid = seedStockedItem(24);

      const result = applyInventoryUpdates([{ itemid, quantity: 40 }]);

      expect(result).toEqual({ updated: [itemid], notFound: [] });
      expect(db.select().from(inventory).where(eq(inventory.itemid, itemid)).get()?.quantity).toBe(
        40,
      );
    });

    it("IA-05: gives a never-stocked catalogue item its first inventory row", () => {
      const itemid = seedItem();

      const result = applyInventoryUpdates([{ itemid, quantity: 15 }]);

      expect(result).toEqual({ updated: [itemid], notFound: [] });
      expect(db.select().from(inventory).where(eq(inventory.itemid, itemid)).get()?.quantity).toBe(
        15,
      );
    });

    it("IA-06: an id not in the catalogue is reported in notFound, not dropped, and nothing else in the batch is skipped", () => {
      const known = seedStockedItem(10);
      const unknownId = "inv-admin-unknown-item";

      const result = applyInventoryUpdates([
        { itemid: known, quantity: 20 },
        { itemid: unknownId, quantity: 5 },
      ]);

      expect(result).toEqual({ updated: [known], notFound: [unknownId] });
      expect(db.select().from(inventory).where(eq(inventory.itemid, known)).get()?.quantity).toBe(
        20,
      );
    });

    it("IA-07: a negative quantity throws InvalidInventoryUpdateError and writes nothing in the batch", () => {
      const itemid = seedStockedItem(10);

      expect(() => applyInventoryUpdates([{ itemid, quantity: -1 }])).toThrow(
        InvalidInventoryUpdateError,
      );
      expect(db.select().from(inventory).where(eq(inventory.itemid, itemid)).get()?.quantity).toBe(
        10,
      );
    });

    it("IA-08: a non-integer quantity throws InvalidInventoryUpdateError", () => {
      const itemid = seedStockedItem(10);

      expect(() => applyInventoryUpdates([{ itemid, quantity: 1.5 }])).toThrow(
        InvalidInventoryUpdateError,
      );
    });

    it("IA-09: an empty batch updates nothing and reports nothing", () => {
      expect(applyInventoryUpdates([])).toEqual({ updated: [], notFound: [] });
    });
  });
});
