import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, item, itemDetails, product, productDetails, sessions } from "../db/schema";
import { addItem, getCart } from "./cart";
import { clearCartAfterOrder, toOrderLineItems } from "./checkout";

let sessionCounter = 0;
function seedSession(): string {
  sessionCounter += 1;
  const id = `checkout-session-${sessionCounter}`;
  db.insert(sessions)
    .values({ id, jSignon: false, jSignonUsername: null, originalUrl: null, updatedAt: new Date() })
    .run();
  return id;
}

let itemCounter = 0;
// A full, joinable item row — toOrderLineItems resolves prices through
// getCart -> getItem, whose inner joins drop a row with no matching
// product/item details entirely (catalog/item.ts, F6).
function seedFullItem(unitCost: number): string {
  itemCounter += 1;
  const itemid = `checkout-item-${itemCounter}`;
  const productid = `checkout-product-${itemCounter}`;

  db.insert(category).values({ catid: "checkout-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "checkout-cat" }).run();
  db.insert(productDetails)
    .values({ productid, locale: "en_US", name: `Product ${itemCounter}`, descn: "A product" })
    .run();
  db.insert(item)
    .values({ itemid, productid, listPrice: unitCost * 2, unitCost })
    .run();
  db.insert(itemDetails)
    .values({
      itemid,
      locale: "en_US",
      name: `Item ${itemCounter}`,
      image: "/images/placeholder.svg",
      descn: "An item",
      attr1: null,
      attr2: null,
      attr3: null,
      attr4: null,
      attr5: null,
    })
    .run();

  return itemid;
}

/**
 * INTEGRATION TEST
 *
 * Runs against the real in-memory db (db/client.ts's per-test-module
 * instance), same pattern as cart/cart.test.ts.
 */
describe("cart/checkout", () => {
  it("CO-01: maps every cart line to an order_line_item shape carrying itemid, quantity and unitPrice", () => {
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);
    addItem(sessionId, itemA, 3);
    addItem(sessionId, itemB, 2);

    const lines = toOrderLineItems(sessionId);

    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemid: itemA, quantity: 3, unitPrice: 10 }),
        expect.objectContaining({ itemid: itemB, quantity: 2, unitPrice: 5 }),
      ]),
    );
    expect(lines).toHaveLength(2);
  });

  it("CO-02: lineNumber is assigned from 1 upward, contiguous, with no gaps and no repeats", () => {
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);
    const itemC = seedFullItem(2);
    addItem(sessionId, itemA, 1);
    addItem(sessionId, itemB, 1);
    addItem(sessionId, itemC, 1);

    const lines = toOrderLineItems(sessionId);

    expect(lines.map((line) => line.lineNumber).sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it("CO-03: unitPrice is the price captured at the time of the call, not a later read of item.unit_cost", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionId, itemId, 1);

    const lines = toOrderLineItems(sessionId);

    db.update(item).set({ unitCost: 999 }).where(eq(item.itemid, itemId)).run();

    expect(lines[0]!.unitPrice).toBe(10);
  });

  it("CO-04: toOrderLineItems on an empty cart returns an empty array rather than throwing", () => {
    const sessionId = seedSession();

    expect(toOrderLineItems(sessionId)).toEqual([]);
  });

  it("CO-05: clearCartAfterOrder leaves the session's cart reporting a count of 0", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionId, itemId, 1);

    clearCartAfterOrder(sessionId);

    expect(getCart(sessionId)).toEqual({ items: [], count: 0, subtotal: 0 });
  });

  it("CO-06: clearCartAfterOrder on one session leaves another session's cart untouched", () => {
    const sessionA = seedSession();
    const sessionB = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionA, itemId, 1);
    addItem(sessionB, itemId, 2);

    clearCartAfterOrder(sessionA);

    expect(getCart(sessionA).count).toBe(0);
    expect(getCart(sessionB).count).toBe(1);
  });
});
