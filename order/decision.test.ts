import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers, orders } from "../db/schema";
import { applyDecision } from "./decision";

/**
 * INTEGRATION TEST (server project — reaches db/client.ts / bun:sqlite)
 *
 * Same fixture pattern as order/status.test.ts. PLAN.md step 6: a PENDING
 * order moves to APPROVED, a PENDING order moves to DENIED, the row in the
 * database actually carries the new status afterwards, and each terminal
 * state is returned as a skip with the order's status unchanged.
 */

let userCounter = 0;
function seedUser(): string {
  userCounter += 1;
  const userName = `order-decision-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  return userName;
}

function seedOrder(status: string): number {
  const userName = seedUser();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 9.99, status })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

function readStatus(orderId: number): string {
  return db.select({ status: orders.status }).from(orders).where(eq(orders.orderId, orderId)).get()!
    .status;
}

describe("applyDecision", () => {
  it("AC-1 / DA-01: a PENDING order decided APPROVED transitions to APPROVED", () => {
    const orderId = seedOrder("PENDING");

    const outcome = applyDecision(orderId, "APPROVED");

    expect(outcome).toEqual({ orderId, result: "applied", status: "APPROVED" });
  });

  it("DA-02: the row itself carries APPROVED after the call, read back independently", () => {
    const orderId = seedOrder("PENDING");

    applyDecision(orderId, "APPROVED");

    expect(readStatus(orderId)).toBe("APPROVED");
  });

  it("AC-2 / DA-03: a PENDING order decided DENIED transitions to DENIED", () => {
    const orderId = seedOrder("PENDING");

    const outcome = applyDecision(orderId, "DENIED");

    expect(outcome).toEqual({ orderId, result: "applied", status: "DENIED" });
  });

  it("DA-04: the row itself carries DENIED after the call, read back independently", () => {
    const orderId = seedOrder("PENDING");

    applyDecision(orderId, "DENIED");

    expect(readStatus(orderId)).toBe("DENIED");
  });

  it("DA-05: an already-APPROVED order is skipped, its status unchanged", () => {
    const orderId = seedOrder("APPROVED");

    const outcome = applyDecision(orderId, "DENIED");

    expect(outcome).toEqual({ orderId, result: "skipped", status: "APPROVED" });
    expect(readStatus(orderId)).toBe("APPROVED");
  });

  it("DA-06: an already-DENIED order is skipped, its status unchanged", () => {
    const orderId = seedOrder("DENIED");

    const outcome = applyDecision(orderId, "APPROVED");

    expect(outcome).toEqual({ orderId, result: "skipped", status: "DENIED" });
    expect(readStatus(orderId)).toBe("DENIED");
  });

  it("DA-07: a COMPLETED order is skipped, its status unchanged", () => {
    const orderId = seedOrder("COMPLETED");

    const outcome = applyDecision(orderId, "APPROVED");

    expect(outcome).toEqual({ orderId, result: "skipped", status: "COMPLETED" });
    expect(readStatus(orderId)).toBe("COMPLETED");
  });

  it("DA-08: an unknown order id is reported notFound", () => {
    expect(applyDecision(999999, "APPROVED")).toEqual({ orderId: 999999, result: "notFound" });
  });
});
