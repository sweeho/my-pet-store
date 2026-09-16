import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { authUsers, item } from "../../../../db/schema";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../../auth/session";
import getInventory from "./index.get";

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

function requestWithCookie(cookieValue?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/supplier/inventory", {
      headers: cookieValue ? { cookie: `${SESSION_COOKIE}=${cookieValue}` } : {},
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

describe("GET /api/supplier/inventory", () => {
  it("IG-01: a request with no signed-on session is refused 401", async () => {
    const event = requestWithCookie();

    const result = await getInventory(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("IG-02: a signed-on session without the administrator role is refused 403", async () => {
    const cookieValue = signedOnCookie("plain-user-inventory-get", null);

    const event = requestWithCookie(cookieValue);
    const result = await getInventory(event);

    expect(event.res.status).toBe(403);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("IG-03: an administrator lists every catalogue item, including one never stocked", async () => {
    const itemid = "inv-get-route-item-1";
    db.insert(item)
      .values({ itemid, productid: "inv-get-route-product", listPrice: 1, unitCost: 1 })
      .run();
    const cookieValue = signedOnCookie("admin-inventory-get", "administrator");

    const event = requestWithCookie(cookieValue);
    const result = await getInventory(event);

    expect(result).toEqual({
      items: expect.arrayContaining([{ itemid, quantity: 0 }]),
    });
  });
});
