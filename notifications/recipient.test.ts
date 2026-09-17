import { describe, expect, it } from "vitest";

import { createCustomer, updateAccount } from "../account/customer";
import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";
import { resolveRecipient } from "./recipient";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * PLAN.md step 8: resolveRecipient returns the account's contact fields
 * for the order's user_name, nulls where the account leaves them empty,
 * and does not throw for a user with no account rows at all or an
 * unknown order (design.md F6).
 */

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `recipient-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

function seedOrderForUser(userName: string): number {
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 9.99, status: "APPROVED" })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

describe("resolveRecipient", () => {
  it("AC-4 / RC-01: returns the account's given name, family name and email for the order's user", () => {
    const userName = seedUser();
    createCustomer(userName);
    updateAccount(userName, {
      contactInfo: { givenName: "Ada", familyName: "Lovelace", email: "ada@example.com" },
    });
    const orderId = seedOrderForUser(userName);

    expect(resolveRecipient(orderId)).toEqual({
      givenName: "Ada",
      familyName: "Lovelace",
      email: "ada@example.com",
    });
  });

  it("AC-4 / RC-02: returns null for each field the account leaves empty", () => {
    const userName = seedUser();
    createCustomer(userName);
    const orderId = seedOrderForUser(userName);

    expect(resolveRecipient(orderId)).toEqual({
      givenName: null,
      familyName: null,
      email: null,
    });
  });

  it("RC-03: a user with no account rows at all resolves to all-null rather than throwing", () => {
    const userName = seedUser();
    const orderId = seedOrderForUser(userName);

    expect(() => resolveRecipient(orderId)).not.toThrow();
    expect(resolveRecipient(orderId)).toEqual({
      givenName: null,
      familyName: null,
      email: null,
    });
  });

  it("RC-04: an unknown order id resolves to all-null rather than throwing", () => {
    expect(() => resolveRecipient(999999)).not.toThrow();
    expect(resolveRecipient(999999)).toEqual({
      givenName: null,
      familyName: null,
      email: null,
    });
  });
});
