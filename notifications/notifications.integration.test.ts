import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { applyOrderDecisions } from "../admin/order-status";
import { processOrder } from "../fulfillment/fulfillment";
import { createCustomer, updateAccount } from "../account/customer";
import { db } from "../db/client";
import { authUsers, inventory, item, notifications, orderLineItem, orders } from "../db/schema";
import { dispatchQueued } from "./dispatch";
import type { MailTransport } from "./transport";
import type { MailMessage } from "./types";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * PLAN.md: the three delivery scenarios and the missing-address case,
 * driven through the real call paths — applyOrderDecisions (the admin
 * endpoint's path) and processOrder (the fulfilment endpoint's path) —
 * rather than by writing rows into the notifications table directly and
 * calling dispatchQueued on them. Each case mirrors the two routes'
 * documented shape: run the transition through its own db.transaction,
 * then drain after it has committed (design.md § Decisions D4).
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

let userCounter = 0;
function seedAccount(contact?: {
  email?: string;
  givenName?: string;
  familyName?: string;
}): string {
  userCounter += 1;
  const userName = `notif-e2e-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  createCustomer(userName);
  if (contact) {
    updateAccount(userName, { contactInfo: contact });
  }
  return userName;
}

function seedOrder(userName: string, status: string, billingEmail: string | null): number {
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 9.99, status, billingEmail })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

let itemCounter = 0;
function seedStockedLine(orderId: number, quantity: number): void {
  itemCounter += 1;
  const itemid = `notif-e2e-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "notif-e2e-product", listPrice: 9.99, unitCost: 4.99 })
    .run();
  db.insert(inventory).values({ itemid, quantity }).run();
  db.insert(orderLineItem)
    .values({ orderId, lineNumber: 1, itemid, quantity, unitPrice: 9.99, quantityShipped: 0 })
    .run();
}

function readOrderStatus(orderId: number): string {
  return db.select({ status: orders.status }).from(orders).where(eq(orders.orderId, orderId)).get()!
    .status;
}

function readNotificationsFor(orderId: number) {
  return db.select().from(notifications).where(eq(notifications.orderId, orderId)).all();
}

describe("notifications — end to end through the real transitions", () => {
  it("AC-1 / NI-01: approval, end to end, sends to the account's address and marks the row SENT", () => {
    const userName = seedAccount({
      email: "ada@example.com",
      givenName: "Ada",
      familyName: "Lovelace",
    });
    // billingEmail differs from the account's address on purpose — the
    // sent message must go to the account's address (design.md D5), not
    // to what was copied onto the order at queue time.
    const orderId = seedOrder(userName, "PENDING", "old-billing@example.com");
    const transport = fakeTransport();

    const result = applyOrderDecisions([{ orderId, status: "APPROVED" }]);
    dispatchQueued(transport);

    expect(result).toEqual({ applied: [orderId], skipped: [], notFound: [] });
    expect(readOrderStatus(orderId)).toBe("APPROVED");
    expect(transport.sent).toEqual([
      expect.objectContaining({
        to: "ada@example.com",
        subject: expect.stringContaining(String(orderId)),
      }),
    ]);
    expect(transport.sent[0]!.body).toContain(String(orderId));
    expect(transport.sent[0]!.body).toContain("Ada Lovelace");
    expect(transport.sent[0]!.body).toContain("APPROVED");
    const [row] = readNotificationsFor(orderId);
    expect(row).toMatchObject({ kind: "APPROVAL", status: "SENT" });
  });

  it("AC-2 / NI-02: denial, end to end, produces a message distinguishable from an approval's", () => {
    const approvedUser = seedAccount({ email: "grace@example.com", givenName: "Grace" });
    const deniedUser = seedAccount({ email: "alan@example.com", givenName: "Alan" });
    const approvedOrder = seedOrder(approvedUser, "PENDING", null);
    const deniedOrder = seedOrder(deniedUser, "PENDING", null);
    const transport = fakeTransport();

    const result = applyOrderDecisions([
      { orderId: approvedOrder, status: "APPROVED" },
      { orderId: deniedOrder, status: "DENIED" },
    ]);
    dispatchQueued(transport);

    expect(result).toEqual({ applied: [approvedOrder, deniedOrder], skipped: [], notFound: [] });
    expect(readOrderStatus(deniedOrder)).toBe("DENIED");
    expect(transport.sent).toHaveLength(2);
    const approvalMessage = transport.sent.find((m) => m.to === "grace@example.com")!;
    const denialMessage = transport.sent.find((m) => m.to === "alan@example.com")!;
    expect(denialMessage.body).toContain(String(deniedOrder));
    expect(denialMessage.body).toContain("Alan");
    expect(denialMessage.body).toContain("DENIED");
    // The point of this scenario: the two messages must actually differ,
    // not just happen to share a to-address — proving this isn't the
    // approval scenario run twice under a different name.
    expect(denialMessage.subject).not.toBe(approvalMessage.subject);
    expect(denialMessage.body).not.toBe(approvalMessage.body);
    const [denialRow] = readNotificationsFor(deniedOrder);
    expect(denialRow).toMatchObject({ kind: "DENIAL", status: "SENT" });
  });

  it("AC-3 / NI-03: completion, end to end, sends a COMPLETION message and completes the order", () => {
    const userName = seedAccount({
      email: "marie@example.com",
      givenName: "Marie",
      familyName: "Curie",
    });
    const orderId = seedOrder(userName, "APPROVED", null);
    seedStockedLine(orderId, 10);
    const transport = fakeTransport();

    const invoice = processOrder(orderId, new Date("2026-01-01T00:00:00.000Z"));
    dispatchQueued(transport);

    expect(invoice).not.toBeNull();
    expect(readOrderStatus(orderId)).toBe("COMPLETED");
    expect(transport.sent).toEqual([expect.objectContaining({ to: "marie@example.com" })]);
    expect(transport.sent[0]!.body).toContain(String(orderId));
    expect(transport.sent[0]!.body).toContain("Marie Curie");
    expect(transport.sent[0]!.body).toContain("COMPLETED");
    const [row] = readNotificationsFor(orderId);
    expect(row).toMatchObject({ kind: "COMPLETION", status: "SENT" });
  });

  it("AC-4 / NI-04: an account with no address on file ends undeliverable, the decision's status unchanged, nothing handed to the transport", () => {
    // No updateAccount call: the account keeps the all-null contact row
    // createCustomer seeds (F6). The order's own billing_email is also
    // null, so neither address source has anything to offer.
    const userName = seedAccount();
    const orderId = seedOrder(userName, "PENDING", null);
    const transport = fakeTransport();

    const result = applyOrderDecisions([{ orderId, status: "APPROVED" }]);
    const statusAfterDecision = readOrderStatus(orderId);
    dispatchQueued(transport);

    expect(result).toEqual({ applied: [orderId], skipped: [], notFound: [] });
    expect(transport.sent).toEqual([]);
    // The decision itself is unaffected — an undeliverable notification
    // must not look like a failed decision (design.md S6).
    expect(readOrderStatus(orderId)).toBe(statusAfterDecision);
    expect(readOrderStatus(orderId)).toBe("APPROVED");
    const [row] = readNotificationsFor(orderId);
    expect(row).toMatchObject({ kind: "APPROVAL", status: "UNDELIVERABLE" });
    expect(row!.failureReason).toEqual(expect.any(String));
    expect(row!.sentAt).toBeNull();
  });
});
