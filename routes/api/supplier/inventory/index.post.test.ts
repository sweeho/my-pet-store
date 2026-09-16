import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { authUsers, inventory, item } from "../../../../db/schema";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../../auth/session";
import updateInventory from "./index.post";

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
    new Request("http://localhost/api/supplier/inventory", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieValue ? { cookie: `${SESSION_COOKIE}=${cookieValue}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

function signedOnCookie(userName: string, role: string | null): string | undefined {
  db.insert(authUsers).values({ userName, password: "hash", role }).run();
  const setup = new H3Event(new Request("http://localhost/api/supplier/inventory"));
  // Not a React hook — a server-side session accessor whose name happens to
  // start with "use" (auth/session.ts is owned by another ticket this sprint).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup);
}

let itemCounter = 0;
function seedItem(): string {
  itemCounter += 1;
  const itemid = `inv-post-route-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "inv-post-route-product", listPrice: 1, unitCost: 1 })
    .run();
  return itemid;
}

describe("POST /api/supplier/inventory", () => {
  it("IP-01: a request with no signed-on session is refused 401", async () => {
    const event = requestWithCookie({ updates: [] });

    const result = await updateInventory(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("IP-02: a signed-on session without the administrator role is refused 403", async () => {
    const cookieValue = signedOnCookie("plain-user-inventory-post", null);

    const event = requestWithCookie({ updates: [] }, cookieValue);
    const result = await updateInventory(event);

    expect(event.res.status).toBe(403);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("IP-03: a missing updates field answers 400", async () => {
    const cookieValue = signedOnCookie("admin-inventory-post-missing", "administrator");

    const event = requestWithCookie({}, cookieValue);
    const result = await updateInventory(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("IP-04: a malformed update entry answers 400", async () => {
    const cookieValue = signedOnCookie("admin-inventory-post-malformed", "administrator");

    const event = requestWithCookie({ updates: [{ itemid: "x" }] }, cookieValue);
    const result = await updateInventory(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("IP-05: a negative quantity answers 400 and writes nothing", async () => {
    const itemid = seedItem();
    const cookieValue = signedOnCookie("admin-inventory-post-negative", "administrator");

    const event = requestWithCookie({ updates: [{ itemid, quantity: -5 }] }, cookieValue);
    const result = await updateInventory(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
    expect(db.select().from(inventory).where(eq(inventory.itemid, itemid)).get()).toBeUndefined();
  });

  it("IP-06: a valid batch writes the quantities and reports the response shape", async () => {
    const itemid = seedItem();
    const cookieValue = signedOnCookie("admin-inventory-post-success", "administrator");

    const event = requestWithCookie({ updates: [{ itemid, quantity: 33 }] }, cookieValue);
    const result = await updateInventory(event);

    expect(result).toEqual({ updated: [itemid], notFound: [] });
    expect(db.select().from(inventory).where(eq(inventory.itemid, itemid)).get()?.quantity).toBe(
      33,
    );
  });

  it("IP-07: an unknown item id in an otherwise-valid batch is reported, not dropped", async () => {
    const known = seedItem();
    const unknownId = "inv-post-route-unknown";
    const cookieValue = signedOnCookie("admin-inventory-post-partial", "administrator");

    const event = requestWithCookie(
      {
        updates: [
          { itemid: known, quantity: 10 },
          { itemid: unknownId, quantity: 5 },
        ],
      },
      cookieValue,
    );
    const result = await updateInventory(event);

    expect(result).toEqual({ updated: [known], notFound: [unknownId] });
  });
});
