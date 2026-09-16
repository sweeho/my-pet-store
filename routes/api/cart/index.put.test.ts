import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { category, item, itemDetails, product, productDetails } from "../../../db/schema";
import { SESSION_COOKIE } from "../../../auth/session";
import postCart from "./index.post";
import putCart from "./index.put";

let itemCounter = 0;
function seedFullItem(unitCost: number): string {
  itemCounter += 1;
  const itemid = `cart-put-route-item-${itemCounter}`;
  const productid = `cart-put-route-product-${itemCounter}`;

  db.insert(category).values({ catid: "cart-put-route-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "cart-put-route-cat" }).run();
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

function putRequest(body: unknown, cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/cart", {
      method: "PUT",
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

async function seededCartCookie(entries: { itemId: string; quantity: number }[]): Promise<string> {
  const setup = postRequest({ itemId: entries[0]!.itemId, quantity: entries[0]!.quantity });
  await postCart(setup);
  const cookie = cookieValueOf(setup)!;

  for (const entry of entries.slice(1)) {
    await postCart(postRequest({ itemId: entry.itemId, quantity: entry.quantity }, cookie));
  }

  return cookie;
}

/**
 * INTEGRATION TEST
 *
 * Real H3Event, no server — same pattern as routes/api/cart/index.post.test.ts.
 */
describe("PUT /api/cart", () => {
  it("CPUR-01: updates a line to a positive quantity and responds 200 with the resulting cart", async () => {
    const itemId = seedFullItem(10);
    const cookie = await seededCartCookie([{ itemId, quantity: 2 }]);

    const result = await putCart(putRequest({ updates: [{ itemId, quantity: 5 }] }, cookie));

    expect(result).toEqual({
      items: [expect.objectContaining({ itemId, quantity: 5, lineTotal: 50 })],
      count: 1,
      subtotal: 50,
    });
  });

  it("CPUR-02: a batch containing a quantity of 0 and a positive quantity removes the first line and sets the second, in one request", async () => {
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);
    const cookie = await seededCartCookie([
      { itemId: itemA, quantity: 2 },
      { itemId: itemB, quantity: 1 },
    ]);

    const result = await putCart(
      putRequest(
        {
          updates: [
            { itemId: itemA, quantity: 0 },
            { itemId: itemB, quantity: 4 },
          ],
        },
        cookie,
      ),
    );

    expect(result).toEqual({
      items: [expect.objectContaining({ itemId: itemB, quantity: 4 })],
      count: 1,
      subtotal: 20,
    });
  });

  it("CPUR-03: responds 400 with an error body when a quantity is absent", async () => {
    const itemId = seedFullItem(10);
    const event = putRequest({ updates: [{ itemId }] });

    const result = await putCart(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("CPUR-04: responds 400 with an error body when a quantity is not a number", async () => {
    const itemId = seedFullItem(10);
    const event = putRequest({ updates: [{ itemId, quantity: "5" }] });

    const result = await putCart(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("CPUR-05: a request with no bp_session cookie is accepted rather than rejected with 401", async () => {
    const itemId = seedFullItem(10);
    const event = putRequest({ updates: [{ itemId, quantity: 1 }] });

    const result = await putCart(event);

    expect(event.res.status).not.toBe(401);
    expect(result).toEqual(expect.objectContaining({ count: 1 }));
  });
});
