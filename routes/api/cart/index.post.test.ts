import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { category, item, itemDetails, product, productDetails } from "../../../db/schema";
import { SESSION_COOKIE } from "../../../auth/session";
import postCart from "./index.post";

let itemCounter = 0;
function seedFullItem(unitCost: number): string {
  itemCounter += 1;
  const itemid = `cart-post-route-item-${itemCounter}`;
  const productid = `cart-post-route-product-${itemCounter}`;

  db.insert(category).values({ catid: "cart-post-route-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "cart-post-route-cat" }).run();
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

function postRequest(body: unknown, cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/cart", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

/**
 * INTEGRATION TEST
 *
 * Real H3Event, no server — same pattern as routes/api/customer/index.put.test.ts.
 */
describe("POST /api/cart", () => {
  it("CPR-01: adds the specified quantity and responds 200 with the resulting cart", async () => {
    const itemId = seedFullItem(10);

    const result = await postCart(postRequest({ itemId, quantity: 3 }));

    expect(result).toEqual({
      items: [expect.objectContaining({ itemId, quantity: 3, unitCost: 10, lineTotal: 30 })],
      count: 1,
      subtotal: 30,
    });
  });

  it("CPR-02: defaults quantity to 1 when omitted", async () => {
    const itemId = seedFullItem(10);

    const result = await postCart(postRequest({ itemId }));

    expect(result).toEqual(
      expect.objectContaining({
        items: [expect.objectContaining({ itemId, quantity: 1 })],
      }),
    );
  });

  it("CPR-03: responds 400 with an error body when itemId names no item in the catalogue", async () => {
    const event = postRequest({ itemId: "no-such-item" });

    const result = await postCart(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("CPR-04: a request with no bp_session cookie is accepted rather than rejected with 401", async () => {
    const itemId = seedFullItem(10);

    const event = postRequest({ itemId, quantity: 1 });
    const result = await postCart(event);

    expect(event.res.status).not.toBe(401);
    expect(result).toEqual(expect.objectContaining({ count: 1 }));
  });
});
