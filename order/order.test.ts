import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createUser } from "../auth/authenticate";
import { addItem, getCart } from "../cart/cart";
import { db } from "../db/client";
import {
  addresses,
  category,
  item,
  itemDetails,
  orderLineItem,
  orders,
  product,
  productDetails,
  sessions,
} from "../db/schema";
import { createLineItems, placeOrder } from "./order";
import type { OrderSubmission } from "./validation";

/**
 * INTEGRATION TEST
 *
 * Runs against the real in-memory db (db/client.ts's per-test-module reset
 * under VITEST), same pattern as cart/repository.test.ts.
 */
const BILLING_ADDRESS = {
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

const SHIPPING_ADDRESS = {
  givenName: "Maya",
  familyName: "Chen",
  streetName1: "88 Junction Row",
  streetName2: null,
  city: "Brooklyn",
  state: "New York",
  zipCode: "11222",
  country: "USA",
  telephone: "718-555-0117",
  email: "maya.chen+ship@example.com",
};

function validSubmission(): OrderSubmission {
  return { billingAddress: BILLING_ADDRESS, shippingAddress: SHIPPING_ADDRESS };
}

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `order-test-user-${userCounter}`;
  createUser(userName, "secret123");
  return userName;
}

function readOrder(orderId: number) {
  return db.select().from(orders).where(eq(orders.orderId, orderId)).get()!;
}

function readLineItems(orderId: number) {
  return db
    .select()
    .from(orderLineItem)
    .where(eq(orderLineItem.orderId, orderId))
    .orderBy(orderLineItem.lineNumber)
    .all();
}

let sessionCounter = 0;
function seedSession(): string {
  sessionCounter += 1;
  const id = `order-line-item-session-${sessionCounter}`;
  db.insert(sessions)
    .values({ id, jSignon: false, jSignonUsername: null, originalUrl: null, updatedAt: new Date() })
    .run();
  return id;
}

let itemCounter = 0;
// Mirrors cart/checkout.test.ts's seedFullItem — a full, joinable item row,
// since toOrderLineItems (called by createLineItems) resolves catid,
// productid and price through the same catalogue joins.
function seedFullItem(unitCost: number): string {
  itemCounter += 1;
  const itemid = `order-line-item-${itemCounter}`;
  const productid = `order-line-product-${itemCounter}`;

  db.insert(category).values({ catid: "order-line-cat" }).onConflictDoNothing().run();
  db.insert(product).values({ productid, catid: "order-line-cat" }).run();
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

// createUser (auth/authenticate.ts -> account/customer.ts createCustomer)
// already inserts a blank addresses row for every new user; fill it in so
// there is something for a wrongly-reading implementation to leak.
function seedAccountAddress(userName: string): void {
  db.update(addresses)
    .set({ city: "Springfield", country: "Canada", zipCode: "00000" })
    .where(eq(addresses.userName, userName))
    .run();
}

describe("placeOrder", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("OT-01: records the user_name passed in, never one supplied in the submission body", () => {
    const userName = seedUser();
    // A submission carrying an unexpected userName field, as if a shopper's
    // client tried to place an order on someone else's account.
    const submission = { ...validSubmission(), userName: "someone-else" } as OrderSubmission;

    const { orderId } = placeOrder(userName, submission);

    expect(readOrder(orderId).userName).toBe(userName);
  });

  it("OT-02: copies every billing address field onto the order's billing_* columns", () => {
    const userName = seedUser();

    const { orderId } = placeOrder(userName, validSubmission());
    const row = readOrder(orderId);

    expect(row.billingGivenName).toBe("Maya");
    expect(row.billingFamilyName).toBe("Chen");
    expect(row.billingStreetName1).toBe("1150 Alder Street");
    expect(row.billingStreetName2).toBe("Apartment 4B");
    expect(row.billingCity).toBe("San Francisco");
    expect(row.billingState).toBe("California");
    expect(row.billingZipCode).toBe("94117");
    expect(row.billingCountry).toBe("USA");
    expect(row.billingTelephone).toBe("415-555-0132");
    expect(row.billingEmail).toBe("maya.chen@example.com");
  });

  it("OT-03: copies every shipping address field onto the order's shipping_* columns, independent of billing", () => {
    const userName = seedUser();

    const { orderId } = placeOrder(userName, validSubmission());
    const row = readOrder(orderId);

    expect(row.shippingStreetName1).toBe("88 Junction Row");
    expect(row.shippingStreetName2).toBeNull();
    expect(row.shippingCity).toBe("Brooklyn");
    expect(row.shippingState).toBe("New York");
    expect(row.shippingZipCode).toBe("11222");
    expect(row.shippingEmail).toBe("maya.chen+ship@example.com");
    // Billing and shipping stay independent — neither section overwrote the other.
    expect(row.billingCity).toBe("San Francisco");
  });

  it("OT-04: the order neither reads nor writes the customer's account address", () => {
    const userName = seedUser();
    seedAccountAddress(userName);

    const { orderId } = placeOrder(userName, validSubmission());

    // The account's address is untouched by placement (design.md § Decisions D2)...
    const accountAddress = db
      .select()
      .from(addresses)
      .where(eq(addresses.userName, userName))
      .get();
    expect(accountAddress?.city).toBe("Springfield");
    // ...and the order recorded what was submitted, not the account's address.
    expect(readOrder(orderId).billingCity).toBe("San Francisco");
  });

  it("OT-05: a new order's status is PENDING", () => {
    const userName = seedUser();

    const { orderId } = placeOrder(userName, validSubmission());

    expect(readOrder(orderId).status).toBe("PENDING");
  });

  it("OT-06: the order date is the placement time, read from a controlled clock", () => {
    const userName = seedUser();
    const now = new Date("2027-01-15T10:30:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const { orderId } = placeOrder(userName, validSubmission());

    expect(readOrder(orderId).orderDate).toEqual(now);
  });

  it("OT-07: returns the new order's id and its contact email", () => {
    const userName = seedUser();

    const result = placeOrder(userName, validSubmission());

    expect(result.orderId).toBe(readOrder(result.orderId).orderId);
    expect(result.email).toBe("maya.chen@example.com");
  });
});

describe("createLineItems", () => {
  it("LI-01: creates one line item per cart line, carrying its quantity and unit price from the cart", () => {
    const { orderId } = placeOrder(seedUser(), validSubmission());
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    const itemB = seedFullItem(5);
    const itemC = seedFullItem(2);
    addItem(sessionId, itemA, 3);
    addItem(sessionId, itemB, 2);
    addItem(sessionId, itemC, 1);

    createLineItems(orderId, sessionId);

    const lines = readLineItems(orderId);
    expect(lines).toHaveLength(3);
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemid: itemA, quantity: 3, unitPrice: 10 }),
        expect.objectContaining({ itemid: itemB, quantity: 2, unitPrice: 5 }),
        expect.objectContaining({ itemid: itemC, quantity: 1, unitPrice: 2 }),
      ]),
    );
  });

  it("LI-02: each line item carries the catid and productid resolved from the catalogue, alongside itemid", () => {
    const { orderId } = placeOrder(seedUser(), validSubmission());
    const sessionId = seedSession();
    const itemA = seedFullItem(10);
    addItem(sessionId, itemA, 1);

    createLineItems(orderId, sessionId);

    expect(readLineItems(orderId)).toEqual([
      expect.objectContaining({
        itemid: itemA,
        catid: "order-line-cat",
        productid: `order-line-product-${itemCounter}`,
      }),
    ]);
  });

  it("LI-03: line numbers are assigned from 1 upward, contiguous, matching the (order_id, line_number) key", () => {
    const { orderId } = placeOrder(seedUser(), validSubmission());
    const sessionId = seedSession();
    addItem(sessionId, seedFullItem(10), 1);
    addItem(sessionId, seedFullItem(5), 1);
    addItem(sessionId, seedFullItem(2), 1);

    createLineItems(orderId, sessionId);

    expect(readLineItems(orderId).map((line) => line.lineNumber)).toEqual([1, 2, 3]);
  });

  it("LI-04: unit_price is the price captured at placement — a later catalogue price change leaves it unchanged", () => {
    const { orderId } = placeOrder(seedUser(), validSubmission());
    const sessionId = seedSession();
    const itemId = seedFullItem(10);
    addItem(sessionId, itemId, 1);

    createLineItems(orderId, sessionId);

    db.update(item).set({ unitCost: 999 }).where(eq(item.itemid, itemId)).run();

    expect(readLineItems(orderId)[0]!.unitPrice).toBe(10);
  });

  it("LI-05: quantity_shipped is 0 on a newly created line item", () => {
    const { orderId } = placeOrder(seedUser(), validSubmission());
    const sessionId = seedSession();
    addItem(sessionId, seedFullItem(10), 1);

    createLineItems(orderId, sessionId);

    expect(readLineItems(orderId)[0]!.quantityShipped).toBe(0);
  });

  it("LI-06: order_amount is the sum of quantity times unit price across the line items, matching the cart's subtotal", () => {
    const { orderId } = placeOrder(seedUser(), validSubmission());
    const sessionId = seedSession();
    addItem(sessionId, seedFullItem(10), 3);
    addItem(sessionId, seedFullItem(5), 2);
    const cartSubtotal = getCart(sessionId).subtotal;

    createLineItems(orderId, sessionId);

    expect(readOrder(orderId).orderAmount).toBe(cartSubtotal);
    expect(readOrder(orderId).orderAmount).toBe(40);
  });
});
