import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, item, itemDetails, product, productDetails, sessions } from "../db/schema";
import { addItem, getCart, removeItem, UnknownItemError } from "./cart";

let sessionCounter = 0;
function seedSession(): string {
  sessionCounter += 1;
  const id = `cart-cart-session-${sessionCounter}`;
  db.insert(sessions)
    .values({ id, jSignon: false, jSignonUsername: null, originalUrl: null, updatedAt: new Date() })
    .run();
  return id;
}

let itemCounter = 0;
// A full, joinable item row (category, product + product_details, item +
// item_details, all en_US) — getCart/addItem resolve prices through
// getItem, whose inner joins drop a row with no matching product/item
// details entirely (catalog/item.ts, F6).
function seedFullItem(unitCost: number, listPrice = unitCost * 2): string {
  itemCounter += 1;
  const itemid = `cart-cart-item-${itemCounter}`;
  const productid = `cart-cart-product-${itemCounter}`;

  db.insert(category).values({ catid: "cart-cart-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "cart-cart-cat" }).run();
  db.insert(productDetails)
    .values({ productid, locale: "en_US", name: `Product ${itemCounter}`, descn: "A product" })
    .run();
  db.insert(item).values({ itemid, productid, listPrice, unitCost }).run();
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
 * instance). Every item is fully seeded (category/product/item + their
 * localized details rows) so getItem's inner joins resolve it.
 */
describe("cart/cart", () => {
  it("CT-01: addItem with a specified quantity adds that many units", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);

    const cart = addItem(sessionId, itemId, 3);

    expect(cart.items).toEqual([
      expect.objectContaining({ itemId, quantity: 3, unitCost: 10, lineTotal: 30 }),
    ]);
  });

  it("CT-02: addItem with no quantity argument defaults to 1, identically to passing 1", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);

    const defaulted = addItem(sessionId, itemId);
    expect(defaulted.items).toEqual([
      expect.objectContaining({ itemId, quantity: 1, unitCost: 10, lineTotal: 10 }),
    ]);

    const explicitSessionId = seedSession();
    const explicit = addItem(explicitSessionId, itemId, 1);
    expect(explicit.items).toEqual(defaulted.items);
  });

  it("CT-03: adding a duplicate item raises the quantity rather than adding a second line", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);

    addItem(sessionId, itemId, 2);
    const cart = addItem(sessionId, itemId, 1);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual(expect.objectContaining({ itemId, quantity: 3 }));
  });

  it("CT-04: subtotal for a single item is unitCost times quantity", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);

    const cart = addItem(sessionId, itemId, 3);

    expect(cart.subtotal).toBe(30);
  });

  it("CT-05: subtotal for multiple items is the sum of each line total", () => {
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);

    addItem(sessionId, itemA, 2);
    const cart = addItem(sessionId, itemB, 4);

    expect(cart.subtotal).toBe(40);
  });

  it("CT-06: count is the number of distinct lines, not the sum of quantities", () => {
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);

    addItem(sessionId, itemA, 3);
    const cart = addItem(sessionId, itemB, 1);

    expect(cart.count).toBe(2);
  });

  it("CT-07: addItem rejects an item id the catalogue has no item for", () => {
    const sessionId = seedSession();

    expect(() => addItem(sessionId, "no-such-item", 1)).toThrow(UnknownItemError);
  });

  it("CT-08: getCart on a session with no rows returns an empty cart", () => {
    const sessionId = seedSession();

    expect(getCart(sessionId)).toEqual({ items: [], count: 0, subtotal: 0 });
  });

  it("CT-09: a cart line's unitCost is item.unit_cost, never item.list_price", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(350, 599.99);

    const cart = addItem(sessionId, itemId, 1);

    expect(cart.items[0]!.unitCost).toBe(350);
  });

  it("CT-10: getCart is scoped to the session — another session's cart is unaffected", () => {
    const sessionA = seedSession();
    const sessionB = seedSession();
    const itemId = seedFullItem(10);

    addItem(sessionA, itemId, 5);

    expect(getCart(sessionB)).toEqual({ items: [], count: 0, subtotal: 0 });
  });

  it("CT-11: removeItem removes the line and leaves the remaining lines untouched", () => {
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);
    const itemC = seedFullItem(2);
    addItem(sessionId, itemA, 1);
    addItem(sessionId, itemB, 1);
    addItem(sessionId, itemC, 1);

    const cart = removeItem(sessionId, itemA);

    expect(cart.count).toBe(2);
    expect(cart.items.map((cartItem) => cartItem.itemId).sort()).toEqual([itemB, itemC].sort());
  });

  it("CT-12: removing the only line leaves count 0, items empty and subtotal 0", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionId, itemId, 3);

    const cart = removeItem(sessionId, itemId);

    expect(cart).toEqual({ items: [], count: 0, subtotal: 0 });
  });

  it("CT-13: removing an item the cart does not hold is a no-op, not an error", () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionId, itemId, 1);

    const cart = removeItem(sessionId, "no-such-item-in-cart");

    expect(cart).toEqual(getCart(sessionId));
    expect(cart.items).toEqual([expect.objectContaining({ itemId, quantity: 1 })]);
  });
});
