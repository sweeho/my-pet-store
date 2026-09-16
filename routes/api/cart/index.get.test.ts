import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { category, item, itemDetails, product, productDetails } from "../../../db/schema";
import { SESSION_COOKIE } from "../../../auth/session";
import getCart from "./index.get";
import postCart from "./index.post";

let itemCounter = 0;
function seedFullItem(unitCost: number): string {
  itemCounter += 1;
  const itemid = `cart-get-route-item-${itemCounter}`;
  const productid = `cart-get-route-product-${itemCounter}`;

  db.insert(category).values({ catid: "cart-get-route-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "cart-get-route-cat" }).run();
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

function getRequest(cookie?: string): H3Event {
  return new H3Event(
    new Request(
      "http://localhost/api/cart",
      cookie ? { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } } : undefined,
    ),
  );
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

function cookieValueOf(event: H3Event): string | undefined {
  const header = event.res.headers.get("set-cookie");
  return header?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

/**
 * INTEGRATION TEST
 *
 * Real H3Event, no server — same pattern as routes/api/customer/index.get.test.ts.
 */
describe("GET /api/cart", () => {
  it("CGR-01: a request with no bp_session cookie still receives a 200 cart, never 401 or a redirect", async () => {
    const event = getRequest();

    const result = await getCart(event);

    expect(event.res.status).toBeUndefined();
    expect(result).toEqual({ items: [], count: 0, subtotal: 0 });
  });

  it("CGR-02: reflects an item added on the same session via POST", async () => {
    const itemId = seedFullItem(20);

    const setup = postRequest({ itemId, quantity: 2 });
    await postCart(setup);
    const cookie = cookieValueOf(setup);

    const result = await getCart(getRequest(cookie));

    expect(result).toEqual({
      items: [expect.objectContaining({ itemId, quantity: 2, lineTotal: 40 })],
      count: 1,
      subtotal: 40,
    });
  });
});
