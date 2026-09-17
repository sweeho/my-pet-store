import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createCustomer, updateAccount } from "../account/customer";
import { db } from "../db/client";
import { authUsers, notifications, orders } from "../db/schema";
import { dispatchQueued } from "./dispatch";
import { notify } from "./notify";
import type { MailTransport } from "./transport";
import type { MailMessage } from "./types";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * PLAN.md step 5: an injected fake transport that records what it was
 * handed — the sent path with the account's address, the fallback to the
 * row's copied address, the undeliverable path with no address anywhere,
 * the failure path with a throwing transport (row's reason, order status
 * untouched), and a second pass immediately after the first handing the
 * transport nothing (D7).
 */

function fakeTransport(): MailTransport & { sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return {
    sent,
    send(message: MailMessage) {
      sent.push(message);
    },
  };
}

function throwingTransport(reason: string): MailTransport {
  return {
    send() {
      throw new Error(reason);
    },
  };
}

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `dispatch-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

function seedOrder(userName: string, billingEmail: string | null, status = "APPROVED"): number {
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 9.99, status, billingEmail })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

function readNotification(orderId: number) {
  return db.select().from(notifications).where(eq(notifications.orderId, orderId)).all()[0]!;
}

function readOrderStatus(orderId: number): string {
  return db.select({ status: orders.status }).from(orders).where(eq(orders.orderId, orderId)).get()!
    .status;
}

describe("dispatchQueued", () => {
  it("AC-1 / AC-5 / DQ-01: sends with the account's address and marks the row SENT with a timestamp", () => {
    const userName = seedUser();
    createCustomer(userName);
    updateAccount(userName, {
      contactInfo: { email: "ada@example.com", givenName: "Ada", familyName: "Lovelace" },
    });
    const orderId = seedOrder(userName, "billing@example.com");
    notify(orderId, "APPROVAL");
    const transport = fakeTransport();

    const result = dispatchQueued(transport);

    expect(result).toEqual({ sent: 1, failed: 0, undeliverable: 0 });
    expect(transport.sent).toEqual([expect.objectContaining({ to: "ada@example.com" })]);
    const row = readNotification(orderId);
    expect(row.status).toBe("SENT");
    expect(row.sentAt).toBeInstanceOf(Date);
    expect(row.failureReason).toBeNull();
  });

  it("AC-1 / AC-5 / DQ-02: falls back to the row's copied billing email when the account has none", () => {
    const userName = seedUser();
    createCustomer(userName);
    const orderId = seedOrder(userName, "billing@example.com");
    notify(orderId, "DENIAL");
    const transport = fakeTransport();

    const result = dispatchQueued(transport);

    expect(result).toEqual({ sent: 1, failed: 0, undeliverable: 0 });
    expect(transport.sent).toEqual([expect.objectContaining({ to: "billing@example.com" })]);
    expect(readNotification(orderId).status).toBe("SENT");
  });

  it("AC-5 / DQ-03: marks the row UNDELIVERABLE with a reason when neither the account nor the order carries an address", () => {
    const userName = seedUser();
    createCustomer(userName);
    const orderId = seedOrder(userName, null);
    notify(orderId, "COMPLETION");
    const transport = fakeTransport();

    const result = dispatchQueued(transport);

    expect(result).toEqual({ sent: 0, failed: 0, undeliverable: 1 });
    expect(transport.sent).toEqual([]);
    const row = readNotification(orderId);
    expect(row.status).toBe("UNDELIVERABLE");
    expect(row.failureReason).toEqual(expect.any(String));
    expect(row.sentAt).toBeNull();
  });

  it("AC-5 / AC-6 / DQ-04: marks the row FAILED with the thrown reason and leaves the order's own status untouched", () => {
    const userName = seedUser();
    createCustomer(userName);
    updateAccount(userName, { contactInfo: { email: "ada@example.com" } });
    const orderId = seedOrder(userName, null);
    notify(orderId, "APPROVAL");
    const statusBefore = readOrderStatus(orderId);

    const result = dispatchQueued(throwingTransport("smtp exploded"));

    expect(result).toEqual({ sent: 0, failed: 1, undeliverable: 0 });
    const row = readNotification(orderId);
    expect(row.status).toBe("FAILED");
    expect(row.failureReason).toBe("smtp exploded");
    expect(row.sentAt).toBeNull();
    expect(readOrderStatus(orderId)).toBe(statusBefore);
  });

  it("AC-7 / DQ-05: a second pass immediately after the first hands the transport nothing and changes no row", () => {
    const userName = seedUser();
    createCustomer(userName);
    updateAccount(userName, { contactInfo: { email: "ada@example.com" } });
    const orderId = seedOrder(userName, null);
    notify(orderId, "APPROVAL");
    const transport = fakeTransport();
    dispatchQueued(transport);
    const rowAfterFirst = readNotification(orderId);

    const second = dispatchQueued(transport);

    expect(second).toEqual({ sent: 0, failed: 0, undeliverable: 0 });
    expect(transport.sent).toHaveLength(1);
    expect(readNotification(orderId)).toEqual(rowAfterFirst);
  });

  it("DQ-06: a row already terminal from a prior pass is not picked up again", () => {
    const userName = seedUser();
    createCustomer(userName);
    const orderId = seedOrder(userName, null);
    notify(orderId, "APPROVAL");
    dispatchQueued(throwingTransport("first pass fails"));
    const afterFirst = readNotification(orderId);

    const result = dispatchQueued(fakeTransport());

    expect(result).toEqual({ sent: 0, failed: 0, undeliverable: 0 });
    expect(readNotification(orderId)).toEqual(afterFirst);
  });

  it("DQ-07: dispatchQueued defaults to the recording transport when none is given", () => {
    const userName = seedUser();
    createCustomer(userName);
    updateAccount(userName, { contactInfo: { email: "ada@example.com" } });
    const orderId = seedOrder(userName, null);
    notify(orderId, "APPROVAL");

    expect(() => dispatchQueued()).not.toThrow();
    expect(readNotification(orderId).status).toBe("SENT");
  });
});
