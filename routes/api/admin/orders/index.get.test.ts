import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { authUsers, orders } from "../../../../db/schema";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../../auth/session";
import getOrders from "./index.get";

function cookieValueOf(event: H3Event): string | undefined {
  const setCookieHeader = event.res.headers.get("set-cookie");
  return setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function requestWithCookie(url: string, cookieValue?: string): H3Event {
  return new H3Event(
    new Request(
      url,
      cookieValue ? { headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` } } : undefined,
    ),
  );
}

function signedOnAdminCookie(userName: string): string | undefined {
  db.insert(authUsers).values({ userName, password: "hash", role: "administrator" }).run();
  const setup = new H3Event(new Request("http://localhost/api/admin/orders"));
  // Not a React hook — a server-side session accessor whose name happens to
  // start with "use" (auth/session.ts is owned by another ticket this sprint).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup);
}

let userCounter = 0;
function seedOrder(status: string, orderDate = new Date()): number {
  userCounter += 1;
  const userName = `route-user-${userCounter}`;
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate, orderAmount: 20, status })
    .returning({ orderId: orders.orderId })
    .get();
  return orderId;
}

describe("GET /api/admin/orders", () => {
  it("RO-01: a request with no signed-on session is refused 401", async () => {
    const event = new H3Event(new Request("http://localhost/api/admin/orders?status=PENDING"));

    const result = await getOrders(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RO-02: a signed-on session without the administrator role is refused 403", async () => {
    db.insert(authUsers).values({ userName: "plain-user", password: "hash", role: null }).run();
    const setup = new H3Event(new Request("http://localhost/api/admin/orders?status=PENDING"));
    setSignedOn(useSignOnSession(setup), "plain-user");
    const cookieValue = cookieValueOf(setup);

    const event = requestWithCookie(
      "http://localhost/api/admin/orders?status=PENDING",
      cookieValue,
    );
    const result = await getOrders(event);

    expect(event.res.status).toBe(403);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RO-03: an unknown status answers 400 with an error message", async () => {
    const cookieValue = signedOnAdminCookie("admin-status");

    const event = requestWithCookie(
      "http://localhost/api/admin/orders?status=NOT_A_STATUS",
      cookieValue,
    );
    const result = await getOrders(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RO-04: no status at all answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-nostatus");

    const event = requestWithCookie("http://localhost/api/admin/orders", cookieValue);
    const result = await getOrders(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RO-05: a valid status answers 200 with the five OrderSummary fields under their JSON keys", async () => {
    const orderId = seedOrder("APPROVED");
    const cookieValue = signedOnAdminCookie("admin-success");

    const event = requestWithCookie(
      "http://localhost/api/admin/orders?status=APPROVED",
      cookieValue,
    );
    const result = await getOrders(event);

    expect("error" in (result as object)).toBe(false);
    const page = result as { items: { orderId: number }[]; hasNext: boolean };
    const found = page.items.find((item) => item.orderId === orderId);
    expect(found).toMatchObject({
      orderId,
      userId: expect.any(String),
      orderDate: expect.any(String),
      orderAmount: expect.any(Number),
      orderStatus: "APPROVED",
    });
  });

  it("RO-06: several status values in the query are all matched, and nothing outside them", async () => {
    const approvedId = seedOrder("APPROVED");
    const completedId = seedOrder("COMPLETED");
    seedOrder("DENIED");
    const cookieValue = signedOnAdminCookie("admin-multi");

    const event = requestWithCookie(
      "http://localhost/api/admin/orders?status=APPROVED&status=COMPLETED",
      cookieValue,
    );
    const result = (await getOrders(event)) as {
      items: { orderId: number; orderStatus: string }[];
    };

    const ids = result.items.map((o) => o.orderId);
    expect(ids).toEqual(expect.arrayContaining([approvedId, completedId]));
    expect(
      result.items.every((o) => o.orderStatus === "APPROVED" || o.orderStatus === "COMPLETED"),
    ).toBe(true);
  });

  it("RO-07: an invalid count answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-badcount");

    const event = requestWithCookie(
      "http://localhost/api/admin/orders?status=PENDING&count=0",
      cookieValue,
    );
    const result = await getOrders(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });
});
