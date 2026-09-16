import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { createUser } from "../../../auth/authenticate";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../auth/session";
import { addItem } from "../../../cart/cart";
import { category, item, itemDetails, product, productDetails } from "../../../db/schema";
import { db } from "../../../db/client";
import placeOrder from "./index.post";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/customer/index.put.test.ts.
 */
let itemCounter = 0;
// Mirrors order/order.test.ts's seedFullItem — placeOrder now refuses an
// empty cart (SWHM-T-0161), so a submission expected to succeed needs a
// real, joinable catalogue item to add to the session's cart first.
function seedFullItem(unitCost: number): string {
  itemCounter += 1;
  const itemid = `order-route-item-${itemCounter}`;
  const productid = `order-route-product-${itemCounter}`;

  db.insert(category).values({ catid: "order-route-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "order-route-cat" }).run();
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

const VALID_ADDRESS = {
  givenName: "Maya",
  familyName: "Chen",
  streetName1: "1150 Alder Street",
  streetName2: "Apartment 4B",
  city: "San Francisco",
  state: "California",
  zipCode: "94117",
  country: "USA",
  telephone: "415-555-0132",
  email: "maya.chen@example.com",
};

type AddressOverrides = Partial<Record<keyof typeof VALID_ADDRESS, string | null>>;

function validSubmission(
  overrides: { billing?: AddressOverrides; shipping?: AddressOverrides } = {},
) {
  return {
    billingAddress: { ...VALID_ADDRESS, ...overrides.billing },
    shippingAddress: { ...VALID_ADDRESS, ...overrides.shipping },
  };
}

function cookieValueOf(event: H3Event): string | undefined {
  const header = event.res.headers.get("set-cookie");
  return header?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function useSignedOnCookie(userName: string): string {
  const setup = new H3Event(new Request("http://localhost/api/order"));
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup)!;
}

function postRequest(body: unknown, cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/order", () => {
  it("PO-01: an unauthenticated submission is refused with 401 and creates nothing", async () => {
    const event = postRequest(validSubmission());

    const result = await placeOrder(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: "Not signed on" });
  });

  it("PO-02: a submission missing a required field is refused with 400 naming the field", async () => {
    createUser("maya", "secret123");
    const cookie = useSignedOnCookie("maya");

    const event = postRequest(validSubmission({ billing: { city: null } }), cookie);
    const result = await placeOrder(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({
      error: "Billing city is required.",
      section: "billing",
      field: "city",
    });
  });

  it("PO-03: a submission with an invalid email is refused with 400", async () => {
    createUser("priya", "secret123");
    const cookie = useSignedOnCookie("priya");

    const event = postRequest(validSubmission({ shipping: { email: "not-an-email" } }), cookie);
    const result = await placeOrder(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({
      error: "Shipping email must be a valid email address.",
      section: "shipping",
      field: "email",
    });
  });

  it("PO-04: a fully valid submission from a signed-on shopper with a non-empty cart creates an order and returns its id and email", async () => {
    createUser("olivia", "secret123");
    const cookie = useSignedOnCookie("olivia");
    addItem(cookie, seedFullItem(19.99), 1);

    const event = postRequest(validSubmission(), cookie);
    const result = await placeOrder(event);

    expect(event.res.status).not.toBe(400);
    expect(event.res.status).not.toBe(401);
    expect(result).toEqual({
      orderId: expect.any(Number),
      email: VALID_ADDRESS.email,
    });
  });

  it("PO-05: a submission from a signed-on shopper whose cart is empty is refused with 400 naming the empty cart", async () => {
    createUser("noor", "secret123");
    const cookie = useSignedOnCookie("noor");

    const event = postRequest(validSubmission(), cookie);
    const result = await placeOrder(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({
      error: "Your shopping cart is empty. Please add items before ordering.",
      emptyCart: true,
    });
  });
});
