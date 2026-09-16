import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { authUsers, orders } from "../../../../db/schema";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../../auth/session";
import updateStatus from "./status.post";

/**
 * INTEGRATION TEST
 *
 * Mirrors routes/api/admin/orders/index.get.test.ts's cookie/session setup:
 * a real H3Event against a real (in-memory) db, no mocking of the guard.
 */
function cookieValueOf(event: H3Event): string | undefined {
  const setCookieHeader = event.res.headers.get("set-cookie");
  return setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function requestWithCookie(body: unknown, cookieValue?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/admin/orders/status", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieValue ? { cookie: `${SESSION_COOKIE}=${cookieValue}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

function signedOnAdminCookie(userName: string): string | undefined {
  db.insert(authUsers).values({ userName, password: "hash", role: "administrator" }).run();
  const setup = new H3Event(new Request("http://localhost/api/admin/orders/status"));
  // Not a React hook — a server-side session accessor whose name happens to
  // start with "use" (auth/session.ts is owned by another ticket this sprint).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup);
}

let userCounter = 0;
function seedOrder(status: string): number {
  userCounter += 1;
  const userName = `status-route-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate: new Date(), orderAmount: 10, status })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

function statusOf(orderId: number): string | undefined {
  return db.select({ status: orders.status }).from(orders).where(eq(orders.orderId, orderId)).get()
    ?.status;
}

describe("POST /api/admin/orders/status", () => {
  it("RS-01: a request with no signed-on session is refused 401", async () => {
    const event = requestWithCookie({ orderIds: [1], status: "APPROVED" });

    const result = await updateStatus(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RS-02: a signed-on session without the administrator role is refused 403", async () => {
    db.insert(authUsers)
      .values({ userName: "plain-user-status", password: "hash", role: null })
      .run();
    const setup = new H3Event(new Request("http://localhost/api/admin/orders/status"));
    setSignedOn(useSignOnSession(setup), "plain-user-status");
    const cookieValue = cookieValueOf(setup);

    const event = requestWithCookie({ orderIds: [1], status: "APPROVED" }, cookieValue);
    const result = await updateStatus(event);

    expect(event.res.status).toBe(403);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RS-03: an unknown status answers 400 with an error message", async () => {
    const cookieValue = signedOnAdminCookie("admin-status-bad");

    const event = requestWithCookie({ orderIds: [1], status: "NOT_A_STATUS" }, cookieValue);
    const result = await updateStatus(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RS-04: a missing orderIds answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-status-missing");

    const event = requestWithCookie({ status: "APPROVED" }, cookieValue);
    const result = await updateStatus(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RS-05: an empty orderIds array answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-status-empty");

    const event = requestWithCookie({ orderIds: [], status: "APPROVED" }, cookieValue);
    const result = await updateStatus(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RS-06: a non-array orderIds answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-status-nonarray");

    const event = requestWithCookie({ orderIds: "1,2,3", status: "APPROVED" }, cookieValue);
    const result = await updateStatus(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RS-07: a non-numeric id in orderIds answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-status-nonnumeric");

    const event = requestWithCookie({ orderIds: [1, "two"], status: "APPROVED" }, cookieValue);
    const result = await updateStatus(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RS-08: a valid request moves every order and reports the response shape", async () => {
    const a = seedOrder("PENDING");
    const b = seedOrder("PENDING");
    const cookieValue = signedOnAdminCookie("admin-status-success");

    const event = requestWithCookie({ orderIds: [a, b], status: "APPROVED" }, cookieValue);
    const result = await updateStatus(event);

    expect(result).toEqual({ updated: [a, b], notFound: [] });
    expect(statusOf(a)).toBe("APPROVED");
    expect(statusOf(b)).toBe("APPROVED");
  });

  it("RS-09: unknown ids in an otherwise-valid request are reported, not dropped", async () => {
    const known = seedOrder("PENDING");
    const unknownId = known + 100_000;
    const cookieValue = signedOnAdminCookie("admin-status-partial");

    const event = requestWithCookie(
      { orderIds: [known, unknownId], status: "APPROVED" },
      cookieValue,
    );
    const result = await updateStatus(event);

    expect(result).toEqual({ updated: [known], notFound: [unknownId] });
  });
});
