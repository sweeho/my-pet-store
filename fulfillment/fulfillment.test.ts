import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { authUsers, inventory, item, orderLineItem, orders } from "../db/schema";
import { OrderNotFoundError } from "./errors";
import { processOrder } from "./fulfillment";
import * as inventoryModule from "./inventory";

/**
 * INTEGRATION TEST
 *
 * Runs against the real in-memory db Vitest swaps in (db/client.ts), same
 * pattern as order/order.test.ts and admin/order-status.test.ts. Fixtures
 * go straight to the tables fulfillment/*.ts's four dependencies already
 * own (item, inventory, orders, order_line_item) rather than through
 * order/ or admin/ — this ticket's ownership is fulfillment.ts alone.
 */
const SHIPPING_DATE = new Date("2024-03-15T12:00:00.000Z");

let itemCounter = 0;
function seedItem(quantityHeld: number): string {
  itemCounter += 1;
  const itemid = `fulfillment-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "fulfillment-product", listPrice: 9.99, unitCost: 4.99 })
    .run();
  db.insert(inventory).values({ itemid, quantity: quantityHeld }).run();
  return itemid;
}

type SeedLine = { itemid: string; quantity: number; quantityShipped?: number; unitPrice?: number };

let userCounter = 0;
function seedOrder(status: string, lines: SeedLine[]): number {
  userCounter += 1;
  const userName = `fulfillment-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date("2024-01-01T00:00:00.000Z"), orderAmount: 0, status })
    .returning({ orderId: orders.orderId })
    .get();

  db.insert(orderLineItem)
    .values(
      lines.map((line, index) => ({
        orderId,
        lineNumber: index + 1,
        itemid: line.itemid,
        quantity: line.quantity,
        unitPrice: line.unitPrice ?? 9.99,
        quantityShipped: line.quantityShipped ?? 0,
      })),
    )
    .run();

  return orderId;
}

function readOrder(orderId: number) {
  return db.select().from(orders).where(eq(orders.orderId, orderId)).get()!;
}

function readLines(orderId: number) {
  return db
    .select()
    .from(orderLineItem)
    .where(eq(orderLineItem.orderId, orderId))
    .orderBy(orderLineItem.lineNumber)
    .all();
}

function inventoryOf(itemid: string): number {
  return db.select().from(inventory).where(eq(inventory.itemid, itemid)).get()!.quantity;
}

describe("fulfillment/fulfillment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("PT-01: throws OrderNotFoundError for an unknown order id", () => {
    expect(() => processOrder(999999, SHIPPING_DATE)).toThrow(OrderNotFoundError);
  });

  it("PT-02: fully-stocked order ships every line, completes the order, and returns the invoice XML", () => {
    const itemid = seedItem(100);
    const orderId = seedOrder("PENDING", [{ itemid, quantity: 30, unitPrice: 12.5 }]);

    const invoice = processOrder(orderId, SHIPPING_DATE);

    expect(invoice).toContain(`<poId>${orderId}</poId>`);
    expect(invoice).toContain(`<itemId>${itemid}</itemId>`);
    expect(invoice).toContain("<shippingDate>2024-03-15T12:00:00.000Z</shippingDate>");
    expect(readOrder(orderId).status).toBe("COMPLETED");
    expect(readLines(orderId)[0].quantityShipped).toBe(30);
    expect(inventoryOf(itemid)).toBe(70);
  });

  it("PT-03: an order with no available inventory ships nothing, stays PENDING, and returns null", () => {
    const itemid = seedItem(0);
    const orderId = seedOrder("PENDING", [{ itemid, quantity: 10 }]);

    const invoice = processOrder(orderId, SHIPPING_DATE);

    expect(invoice).toBeNull();
    expect(readOrder(orderId).status).toBe("PENDING");
    expect(readLines(orderId)[0].quantityShipped).toBe(0);
    expect(inventoryOf(itemid)).toBe(0);
  });

  it("PT-04: a partially fillable order ships only the available lines, stays PENDING, and invoices only what shipped", () => {
    const stockedItem = seedItem(50);
    const shortItem = seedItem(5);
    const orderId = seedOrder("PENDING", [
      { itemid: stockedItem, quantity: 20 },
      { itemid: shortItem, quantity: 10 },
    ]);

    const invoice = processOrder(orderId, SHIPPING_DATE);

    expect(invoice).toContain(`<itemId>${stockedItem}</itemId>`);
    expect(invoice).not.toContain(`<itemId>${shortItem}</itemId>`);
    expect(readOrder(orderId).status).toBe("PENDING");
    const [lineA, lineB] = readLines(orderId);
    expect(lineA.quantityShipped).toBe(20);
    expect(lineB.quantityShipped).toBe(0);
    expect(inventoryOf(stockedItem)).toBe(30);
    expect(inventoryOf(shortItem)).toBe(5);
  });

  it("PT-05: rerunning after restocking ships only what was outstanding, without deducting the already-shipped line again (idempotence, AC-3)", () => {
    const stockedItem = seedItem(50);
    const shortItem = seedItem(5);
    const orderId = seedOrder("PENDING", [
      { itemid: stockedItem, quantity: 20 },
      { itemid: shortItem, quantity: 10 },
    ]);

    const firstInvoice = processOrder(orderId, SHIPPING_DATE);
    expect(firstInvoice).toContain(`<itemId>${stockedItem}</itemId>`);

    // Restock the short item between runs.
    db.update(inventory).set({ quantity: 10 }).where(eq(inventory.itemid, shortItem)).run();

    const secondInvoice = processOrder(orderId, SHIPPING_DATE);

    expect(secondInvoice).toContain(`<itemId>${shortItem}</itemId>`);
    expect(secondInvoice).not.toContain(`<itemId>${stockedItem}</itemId>`);
    expect(readOrder(orderId).status).toBe("COMPLETED");
    const [lineA, lineB] = readLines(orderId);
    expect(lineA.quantityShipped).toBe(20);
    expect(lineB.quantityShipped).toBe(10);
    // stockedItem was deducted once, on the first run only.
    expect(inventoryOf(stockedItem)).toBe(30);
    expect(inventoryOf(shortItem)).toBe(0);
  });

  it("PT-06: an already-shipped line is skipped without an inventory check (S6)", () => {
    const shippedItem = seedItem(0);
    const unshippedItem = seedItem(0);
    const orderId = seedOrder("PENDING", [
      { itemid: shippedItem, quantity: 5, quantityShipped: 5 },
      { itemid: unshippedItem, quantity: 5 },
    ]);
    const checkInventorySpy = vi.spyOn(inventoryModule, "checkInventory");

    const invoice = processOrder(orderId, SHIPPING_DATE);

    expect(invoice).toBeNull();
    expect(checkInventorySpy).toHaveBeenCalledTimes(1);
    expect(checkInventorySpy).toHaveBeenCalledWith(
      expect.objectContaining({ itemid: unshippedItem }),
    );
  });

  it("PT-07: a failure partway through the pass leaves no deduction, no shipped quantity and no status change", () => {
    const itemid = seedItem(100);
    const orderId = seedOrder("PENDING", [{ itemid, quantity: 30 }]);

    const originalUpdate = db.update.bind(db);
    let updateCount = 0;
    vi.spyOn(db, "update").mockImplementation((table) => {
      updateCount += 1;
      // First update() call is inventory's reduceQuantity; fail on the
      // second, markLineShipped's write, to prove the earlier deduction
      // is rolled back too — not merely that the second write never lands.
      if (updateCount === 2) {
        throw new Error("simulated shipped-quantity write failure");
      }
      return originalUpdate(table);
    });

    expect(() => processOrder(orderId, SHIPPING_DATE)).toThrow(
      "simulated shipped-quantity write failure",
    );

    expect(readOrder(orderId).status).toBe("PENDING");
    expect(readLines(orderId)[0].quantityShipped).toBe(0);
    expect(inventoryOf(itemid)).toBe(100);
  });
});
