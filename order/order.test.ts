import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createUser } from "../auth/authenticate";
import { db } from "../db/client";
import { addresses, orders } from "../db/schema";
import { placeOrder } from "./order";
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
