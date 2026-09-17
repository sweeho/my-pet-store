import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, orderLineItem, orders, supplierPo, supplierPoLineItem } from "../db/schema";
import { createSupplierPo } from "./supplier-po";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as order/decision.test.ts. PLAN.md step 6: a PO row
 * carrying the order id, date and full shipping address; a three-line
 * order producing three line rows carrying all six fields; and that
 * calling twice for the same order leaves exactly one PO row (D7 — the
 * schema's own order_id primary key is what makes this true).
 */

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `supplier-po-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

function seedOrder(): number {
  const userName = seedUser();
  const { orderId } = db
    .insert(orders)
    .values({
      userName,
      orderDate: new Date(),
      orderAmount: 29.97,
      status: "APPROVED",
      shippingGivenName: "Ada",
      shippingFamilyName: "Lovelace",
      shippingTelephone: "555-0100",
      shippingEmail: "ada@example.com",
      shippingStreetName1: "123 Main St",
      shippingStreetName2: "Apt 4",
      shippingCity: "Springfield",
      shippingState: "IL",
      shippingZipCode: "62701",
      shippingCountry: "US",
    })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

function seedLine(
  orderId: number,
  lineNumber: number,
  overrides: { catid?: string | null; productid?: string | null } = {},
): void {
  db.insert(orderLineItem)
    .values({
      orderId,
      lineNumber,
      itemid: `ITEM-${orderId}-${lineNumber}`,
      quantity: 2,
      unitPrice: 9.99,
      catid: "catid" in overrides ? overrides.catid! : "CAT1",
      productid: "productid" in overrides ? overrides.productid! : "PROD1",
    })
    .run();
}

function readPoLines(orderId: number) {
  return db.select().from(supplierPoLineItem).where(eq(supplierPoLineItem.orderId, orderId)).all();
}

describe("createSupplierPo", () => {
  it("AC-1: writes a PO row with the order id, date and full shipping address", () => {
    const orderId = seedOrder();
    const poDate = new Date("2026-01-15T00:00:00.000Z");

    const result = createSupplierPo(orderId, poDate);

    expect(result).toEqual({
      orderId,
      poDate,
      shippingAddress: {
        givenName: "Ada",
        familyName: "Lovelace",
        telephone: "555-0100",
        email: "ada@example.com",
        streetName1: "123 Main St",
        streetName2: "Apt 4",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        country: "US",
      },
    });

    const row = db.select().from(supplierPo).where(eq(supplierPo.orderId, orderId)).get();
    expect(row?.orderId).toBe(orderId);
    expect(row?.poDate).toEqual(poDate);
    expect(row?.shippingCity).toBe("Springfield");
  });

  it("AC-2: a three-line order produces three PO line rows carrying all six fields", () => {
    const orderId = seedOrder();
    seedLine(orderId, 1, { catid: "CAT1", productid: "PROD1" });
    seedLine(orderId, 2, { catid: null, productid: null });
    seedLine(orderId, 3, { catid: "CAT3", productid: "PROD3" });

    createSupplierPo(orderId);

    const lines = readPoLines(orderId).sort((a, b) => a.lineNumber - b.lineNumber);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({
      orderId,
      lineNumber: 1,
      catid: "CAT1",
      productid: "PROD1",
      itemid: `ITEM-${orderId}-1`,
      quantity: 2,
      unitPrice: 9.99,
    });
    expect(lines[1]).toMatchObject({
      orderId,
      lineNumber: 2,
      catid: null,
      productid: null,
      itemid: `ITEM-${orderId}-2`,
    });
    expect(lines[2]).toMatchObject({
      orderId,
      lineNumber: 3,
      catid: "CAT3",
      productid: "PROD3",
    });
  });

  it("AC-3 (S2): the PO record is persisted and readable — no XML, no queue involved", () => {
    const orderId = seedOrder();
    seedLine(orderId, 1);

    createSupplierPo(orderId);

    const row = db.select().from(supplierPo).where(eq(supplierPo.orderId, orderId)).get();
    expect(row).toBeDefined();
    const lines = readPoLines(orderId);
    expect(lines).toHaveLength(1);
  });

  it("D7: calling createSupplierPo twice for the same order leaves exactly one PO row", () => {
    const orderId = seedOrder();
    seedLine(orderId, 1);

    createSupplierPo(orderId);

    expect(() => createSupplierPo(orderId)).toThrow();

    const rows = db.select().from(supplierPo).where(eq(supplierPo.orderId, orderId)).all();
    expect(rows).toHaveLength(1);
    const lines = db
      .select()
      .from(supplierPoLineItem)
      .where(and(eq(supplierPoLineItem.orderId, orderId), eq(supplierPoLineItem.lineNumber, 1)))
      .all();
    expect(lines).toHaveLength(1);
  });
});
