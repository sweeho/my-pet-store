import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../../db/client";
import { authUsers, orders } from "../../../../db/schema";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../../auth/session";
import { recordingTransport } from "../../../../notifications/transport";
import postDecisions from "./decisions.post";

/**
 * INTEGRATION TEST
 *
 * Mirrors routes/api/admin/orders/status.post.test.ts's cookie/session
 * setup: a real H3Event against a real (in-memory) db, no mocking of the
 * guard.
 */
function cookieValueOf(event: H3Event): string | undefined {
  const setCookieHeader = event.res.headers.get("set-cookie");
  return setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function requestWithCookie(body: unknown, cookieValue?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/admin/orders/decisions", {
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
  const setup = new H3Event(new Request("http://localhost/api/admin/orders/decisions"));
  // Not a React hook — a server-side session accessor whose name happens to
  // start with "use" (auth/session.ts is owned by another ticket this sprint).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup);
}

let userCounter = 0;
function seedOrder(status: string): number {
  userCounter += 1;
  const userName = `decisions-route-user-${userCounter}`;
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

describe("POST /api/admin/orders/decisions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("RD-01: a request with no signed-on session is refused 401", async () => {
    const event = requestWithCookie({ decisions: [{ orderId: 1, status: "APPROVED" }] });

    const result = await postDecisions(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-02: a signed-on session without the administrator role is refused 403", async () => {
    db.insert(authUsers)
      .values({ userName: "plain-user-decisions", password: "hash", role: null })
      .run();
    const setup = new H3Event(new Request("http://localhost/api/admin/orders/decisions"));
    setSignedOn(useSignOnSession(setup), "plain-user-decisions");
    const cookieValue = cookieValueOf(setup);

    const event = requestWithCookie(
      { decisions: [{ orderId: 1, status: "APPROVED" }] },
      cookieValue,
    );
    const result = await postDecisions(event);

    expect(event.res.status).toBe(403);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-03: a missing decisions field answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-decisions-missing");

    const event = requestWithCookie({}, cookieValue);
    const result = await postDecisions(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-04: an empty decisions array answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-decisions-empty");

    const event = requestWithCookie({ decisions: [] }, cookieValue);
    const result = await postDecisions(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-05: a non-array decisions field answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-decisions-nonarray");

    const event = requestWithCookie({ decisions: "not-an-array" }, cookieValue);
    const result = await postDecisions(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-06: a non-numeric orderId answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-decisions-nonnumeric");

    const event = requestWithCookie(
      { decisions: [{ orderId: "one", status: "APPROVED" }] },
      cookieValue,
    );
    const result = await postDecisions(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-07: an unrecognized status answers 400", async () => {
    const cookieValue = signedOnAdminCookie("admin-decisions-badstatus");

    const event = requestWithCookie(
      { decisions: [{ orderId: 1, status: "NOT_A_STATUS" }] },
      cookieValue,
    );
    const result = await postDecisions(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-08: PENDING is refused as a decision status (S7 — it's a state, not a decision)", async () => {
    const cookieValue = signedOnAdminCookie("admin-decisions-pending");

    const event = requestWithCookie(
      { decisions: [{ orderId: 1, status: "PENDING" }] },
      cookieValue,
    );
    const result = await postDecisions(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("AC-1 / AC-2 / RD-09: a valid mixed batch applies, skips and reports notFound correctly, moving the rows", async () => {
    const toApprove = seedOrder("PENDING");
    const toDeny = seedOrder("PENDING");
    const alreadyTerminal = seedOrder("APPROVED");
    const unknownId = alreadyTerminal + 100_000;
    const cookieValue = signedOnAdminCookie("admin-decisions-mixed");

    const event = requestWithCookie(
      {
        decisions: [
          { orderId: toApprove, status: "APPROVED" },
          { orderId: toDeny, status: "DENIED" },
          { orderId: alreadyTerminal, status: "DENIED" },
          { orderId: unknownId, status: "APPROVED" },
        ],
      },
      cookieValue,
    );
    const result = await postDecisions(event);

    expect(result).toEqual({
      applied: [toApprove, toDeny],
      skipped: [alreadyTerminal],
      notFound: [unknownId],
    });
    expect(statusOf(toApprove)).toBe("APPROVED");
    expect(statusOf(toDeny)).toBe("DENIED");
    expect(statusOf(alreadyTerminal)).toBe("APPROVED");
  });

  it("RD-10: posting the same batch twice skips every order the second time and changes nothing further", async () => {
    const a = seedOrder("PENDING");
    const b = seedOrder("PENDING");
    const cookieValue = signedOnAdminCookie("admin-decisions-repeat");
    const body = {
      decisions: [
        { orderId: a, status: "APPROVED" },
        { orderId: b, status: "DENIED" },
      ],
    };

    const first = await postDecisions(requestWithCookie(body, cookieValue));
    expect(first).toEqual({ applied: [a, b], skipped: [], notFound: [] });

    const second = await postDecisions(requestWithCookie(body, cookieValue));

    expect(second).toEqual({ applied: [], skipped: [a, b], notFound: [] });
    expect(statusOf(a)).toBe("APPROVED");
    expect(statusOf(b)).toBe("DENIED");
  });

  it("RD-11 / AC-6: the request still succeeds and the decision still applies when the notification transport throws", async () => {
    userCounter += 1;
    const userName = `decisions-route-user-${userCounter}`;
    db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
    const { orderId } = db
      .insert(orders)
      .values({
        userName,
        orderDate: new Date(),
        orderAmount: 10,
        status: "PENDING",
        billingEmail: "billing@example.com",
      })
      .returning({ orderId: orders.orderId })
      .get();
    const cookieValue = signedOnAdminCookie("admin-decisions-transport-throws");
    vi.spyOn(recordingTransport, "send").mockImplementation(() => {
      throw new Error("simulated transport failure");
    });

    const event = requestWithCookie({ decisions: [{ orderId, status: "APPROVED" }] }, cookieValue);
    const result = await postDecisions(event);

    expect(event.res.status).not.toBe(500);
    expect(result).toEqual({ applied: [orderId], skipped: [], notFound: [] });
    expect(statusOf(orderId)).toBe("APPROVED");
  });
});
