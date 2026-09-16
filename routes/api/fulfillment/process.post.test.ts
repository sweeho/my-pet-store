import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { authUsers, inventory, item, orderLineItem, orders } from "../../../db/schema";
import { db } from "../../../db/client";
import processFulfillment from "./process.post";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event, real-in-memory-db pattern as
 * routes/api/admin/orders/status.post.test.ts. Fixtures go straight to the
 * tables fulfillment/*.ts's dependencies own, mirroring
 * fulfillment/fulfillment.test.ts's own seeding.
 */
let itemCounter = 0;
function seedItem(quantityHeld: number): string {
  itemCounter += 1;
  const itemid = `fulfillment-route-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "fulfillment-route-product", listPrice: 9.99, unitCost: 4.99 })
    .run();
  db.insert(inventory).values({ itemid, quantity: quantityHeld }).run();
  return itemid;
}

let userCounter = 0;
function seedOrder(itemid: string, quantity: number): number {
  userCounter += 1;
  const userName = `fulfillment-route-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({
      userName,
      orderDate: new Date("2024-01-01T00:00:00.000Z"),
      orderAmount: 0,
      status: "PENDING",
    })
    .returning({ orderId: orders.orderId })
    .get();
  db.insert(orderLineItem)
    .values({ orderId, lineNumber: 1, itemid, quantity, unitPrice: 9.99 })
    .run();
  return orderId;
}

function orderSnapshot(orderId: number) {
  const orderRow = db.select().from(orders).where(eq(orders.orderId, orderId)).get();
  const lineRow = db.select().from(orderLineItem).where(eq(orderLineItem.orderId, orderId)).get();
  return { status: orderRow?.status, quantityShipped: lineRow?.quantityShipped };
}

function postRequest(body: unknown): H3Event {
  return new H3Event(
    new Request("http://localhost/api/fulfillment/process", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/fulfillment/process", () => {
  it("PT-01: a body that is not an order identifier is refused with 400 and changes no inventory, no shipped quantity and no order status", async () => {
    const itemid = seedItem(10);
    const orderId = seedOrder(itemid, 5);
    const before = orderSnapshot(orderId);
    const inventoryBefore = db.select().from(inventory).where(eq(inventory.itemid, itemid)).get();

    const event = postRequest({ notAnOrderId: "x" });
    const result = await processFulfillment(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
    expect(orderSnapshot(orderId)).toEqual(before);
    expect(db.select().from(inventory).where(eq(inventory.itemid, itemid)).get()).toEqual(
      inventoryBefore,
    );
  });

  it("PT-02: a request naming an order that does not exist is refused with 404", async () => {
    const event = postRequest({ orderId: 999999 });

    const result = await processFulfillment(event);

    expect(event.res.status).toBe(404);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("PT-03: a fulfillable order is processed and answers { orderId, invoice, status }", async () => {
    const itemid = seedItem(10);
    const orderId = seedOrder(itemid, 5);

    const event = postRequest({ orderId });
    const result = await processFulfillment(event);

    expect(event.res.status).not.toBe(400);
    expect(event.res.status).not.toBe(404);
    expect(result).toEqual({
      orderId,
      invoice: expect.stringContaining("<invoice>"),
      status: "COMPLETED",
    });
  });

  it("PT-04: an order whose line lacks sufficient inventory is answered with a null invoice and the order left PENDING", async () => {
    const itemid = seedItem(1);
    const orderId = seedOrder(itemid, 5);

    const event = postRequest({ orderId });
    const result = await processFulfillment(event);

    expect(result).toEqual({ orderId, invoice: null, status: "PENDING" });
  });
});
