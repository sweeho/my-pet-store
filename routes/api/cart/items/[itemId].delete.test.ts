import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import {
  category,
  item,
  itemDetails,
  product,
  productDetails,
  sessions,
} from "../../../../db/schema";
import { SESSION_COOKIE } from "../../../../auth/session";
import { addItem } from "../../../../cart/cart";
import deleteCartItem from "./[itemId].delete";

let counter = 0;
function seedFullItem(unitCost: number): string {
  counter += 1;
  const itemid = `cart-delete-route-item-${counter}`;
  const productid = `cart-delete-route-product-${counter}`;

  db.insert(category).values({ catid: "cart-delete-route-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "cart-delete-route-cat" }).run();
  db.insert(productDetails)
    .values({ productid, locale: "en_US", name: `Product ${counter}`, descn: "A product" })
    .run();
  db.insert(item)
    .values({ itemid, productid, listPrice: unitCost * 2, unitCost })
    .run();
  db.insert(itemDetails)
    .values({
      itemid,
      locale: "en_US",
      name: `Item ${counter}`,
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

function seedSession(): string {
  counter += 1;
  const id = `cart-delete-route-session-${counter}`;
  db.insert(sessions)
    .values({ id, jSignon: false, jSignonUsername: null, originalUrl: null, updatedAt: new Date() })
    .run();
  return id;
}

function deleteRequest(itemId: string, cookie?: string): H3Event {
  return new H3Event(
    new Request(`http://localhost/api/cart/items/${itemId}`, {
      method: "DELETE",
      headers: cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : undefined,
    }),
    { params: { itemId } },
  );
}

/**
 * INTEGRATION TEST
 *
 * Real H3Event, no server — same pattern as routes/api/cart/index.post.test.ts.
 */
describe("DELETE /api/cart/items/:itemId", () => {
  it("DCR-01: removes the item and responds 200 with the resulting cart", async () => {
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);
    addItem(sessionId, itemA, 1);
    addItem(sessionId, itemB, 1);

    const event = deleteRequest(itemA, sessionId);
    const result = await deleteCartItem(event);

    expect(event.res.status).not.toBe(404);
    expect(result).toEqual({
      items: [expect.objectContaining({ itemId: itemB })],
      count: 1,
      subtotal: 5,
    });
  });

  it("DCR-02: removing the only line responds 200 with an empty cart", async () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionId, itemId, 2);

    const result = await deleteCartItem(deleteRequest(itemId, sessionId));

    expect(result).toEqual({ items: [], count: 0, subtotal: 0 });
  });

  it("DCR-03: removing an item the cart does not hold is a no-op, not an error", async () => {
    const sessionId = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionId, itemId, 1);

    const event = deleteRequest("no-such-item-in-cart", sessionId);
    const result = await deleteCartItem(event);

    expect(event.res.status).not.toBe(404);
    expect(result).toEqual({
      items: [expect.objectContaining({ itemId, quantity: 1 })],
      count: 1,
      subtotal: 10,
    });
  });

  it("DCR-04: a request with no bp_session cookie is accepted rather than rejected with 401", async () => {
    const event = deleteRequest("some-item");
    const result = await deleteCartItem(event);

    expect(event.res.status).not.toBe(401);
    expect(result).toEqual({ items: [], count: 0, subtotal: 0 });
  });
});
