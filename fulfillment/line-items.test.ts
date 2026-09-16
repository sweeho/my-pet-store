import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, item, orderLineItem, orders } from "../db/schema";
import { isAlreadyShipped, markLineShipped, readLineItems } from "./line-items";

/**
 * INTEGRATION TEST
 *
 * Runs against the real in-memory db Vitest swaps in (db/client.ts), same
 * pattern as fulfillment/seed.test.ts and admin/order-status.test.ts.
 */
let itemCounter = 0;
function seedItem(): string {
  itemCounter += 1;
  const itemid = `line-items-test-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "line-items-test-product", listPrice: 9.99, unitCost: 4.99 })
    .run();
  return itemid;
}

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `line-items-test-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

function seedOrder(): number {
  const userName = seedUser();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 9.99, status: "PENDING" })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

describe("fulfillment/line-items", () => {
  it("LT-01: this test runs in the server (node) project, not client (jsdom)", () => {
    expect(typeof window).toBe("undefined");
  });

  it("LT-02: readLineItems returns an order's lines in line_number order", () => {
    const orderId = seedOrder();
    const itemA = seedItem();
    const itemB = seedItem();
    const itemC = seedItem();

    // Inserted out of line-number order on purpose — the read, not the
    // insert order, must produce the ordering.
    db.insert(orderLineItem)
      .values([
        { orderId, lineNumber: 3, itemid: itemC, quantity: 10, unitPrice: 1 },
        { orderId, lineNumber: 1, itemid: itemA, quantity: 20, unitPrice: 1 },
        { orderId, lineNumber: 2, itemid: itemB, quantity: 30, unitPrice: 1 },
      ])
      .run();

    const lines = readLineItems(orderId);

    expect(lines.map((l) => l.lineNumber)).toEqual([1, 2, 3]);
  });

  it("LT-03: readLineItems returns the FulfillmentLine shape", () => {
    const orderId = seedOrder();
    const itemid = seedItem();
    db.insert(orderLineItem)
      .values({ orderId, lineNumber: 1, itemid, quantity: 50, unitPrice: 4.5 })
      .run();

    const [line] = readLineItems(orderId);

    expect(line).toEqual({
      orderId,
      lineNumber: 1,
      itemid,
      catid: null,
      productid: null,
      quantity: 50,
      quantityShipped: 0,
      unitPrice: 4.5,
    });
  });

  it("LT-04: readLineItems returns only the requested order's lines", () => {
    const orderIdA = seedOrder();
    const orderIdB = seedOrder();
    const itemid = seedItem();
    db.insert(orderLineItem)
      .values([
        { orderId: orderIdA, lineNumber: 1, itemid, quantity: 5, unitPrice: 1 },
        { orderId: orderIdB, lineNumber: 1, itemid, quantity: 7, unitPrice: 1 },
      ])
      .run();

    const lines = readLineItems(orderIdA);

    expect(lines).toHaveLength(1);
    expect(lines[0].orderId).toBe(orderIdA);
  });

  // AC "Shipped line items are skipped": GIVEN quantity=50, quantityShipped=50.
  it("LT-05: isAlreadyShipped is true when quantityShipped equals quantity (AC: shipped line items are skipped)", () => {
    expect(
      isAlreadyShipped({
        orderId: 1,
        lineNumber: 1,
        itemid: "x",
        catid: null,
        productid: null,
        quantity: 50,
        quantityShipped: 50,
        unitPrice: 1,
      }),
    ).toBe(true);
  });

  // S6 (design.md): the "partially shipped" scenario shares the exact same
  // GIVEN as "shipped line items are skipped" — quantity=50, quantityShipped=50.
  // No intermediate state can arise (D3), so the same assertion carries both.
  it("LT-06: isAlreadyShipped is true for the 'partially shipped' scenario's GIVEN, which is actually fully shipped (AC: partially shipped items are skipped)", () => {
    expect(
      isAlreadyShipped({
        orderId: 1,
        lineNumber: 1,
        itemid: "x",
        catid: null,
        productid: null,
        quantity: 50,
        quantityShipped: 50,
        unitPrice: 1,
      }),
    ).toBe(true);
  });

  it("LT-07: isAlreadyShipped is false when quantityShipped is less than quantity", () => {
    expect(
      isAlreadyShipped({
        orderId: 1,
        lineNumber: 1,
        itemid: "x",
        catid: null,
        productid: null,
        quantity: 50,
        quantityShipped: 0,
        unitPrice: 1,
      }),
    ).toBe(false);
  });

  // AC "Shipped quantity is set to ordered quantity": quantity=50, quantityShipped=0 -> 50.
  it("LT-08: markLineShipped sets quantity_shipped to quantity for the (order_id, line_number) key (AC: shipped quantity is set to ordered quantity)", () => {
    const orderId = seedOrder();
    const itemid = seedItem();
    db.insert(orderLineItem)
      .values({ orderId, lineNumber: 1, itemid, quantity: 50, unitPrice: 1 })
      .run();
    const [line] = readLineItems(orderId);

    markLineShipped(line);

    const updated = db.select().from(orderLineItem).where(eq(orderLineItem.orderId, orderId)).get();
    expect(updated?.quantityShipped).toBe(50);
  });

  // AC "Shipped quantity tracks fulfillment progress": quantity=100 -> quantityShipped equals the fulfilled (full) quantity.
  it("LT-09: markLineShipped writes the full fulfilled quantity, not an arbitrary figure (AC: shipped quantity tracks fulfillment progress)", () => {
    const orderId = seedOrder();
    const itemid = seedItem();
    db.insert(orderLineItem)
      .values({ orderId, lineNumber: 1, itemid, quantity: 100, unitPrice: 1 })
      .run();
    const [line] = readLineItems(orderId);

    markLineShipped(line);

    const updated = db.select().from(orderLineItem).where(eq(orderLineItem.orderId, orderId)).get();
    expect(updated?.quantityShipped).toBe(100);
  });

  it("LT-10: markLineShipped only writes the targeted (order_id, line_number) pair, leaving sibling lines untouched", () => {
    const orderId = seedOrder();
    const itemA = seedItem();
    const itemB = seedItem();
    db.insert(orderLineItem)
      .values([
        { orderId, lineNumber: 1, itemid: itemA, quantity: 10, unitPrice: 1 },
        { orderId, lineNumber: 2, itemid: itemB, quantity: 20, unitPrice: 1 },
      ])
      .run();
    const lines = readLineItems(orderId);
    const targetLine = lines.find((l) => l.lineNumber === 1)!;

    markLineShipped(targetLine);

    const rows = db.select().from(orderLineItem).where(eq(orderLineItem.orderId, orderId)).all();
    const byLineNumber = new Map(rows.map((r) => [r.lineNumber, r.quantityShipped]));
    expect(byLineNumber.get(1)).toBe(10);
    expect(byLineNumber.get(2)).toBe(0);
  });
});
