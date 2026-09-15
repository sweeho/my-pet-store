import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers } from "../db/schema";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../auth/session";
import { isAdminError, requireAdmin } from "./request";

function cookieValueOf(event: H3Event): string | undefined {
  const setCookieHeader = event.res.headers.get("set-cookie");
  return setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function requestWithCookie(cookieValue?: string): H3Event {
  return new H3Event(
    new Request(
      "http://localhost/api/admin/orders",
      cookieValue ? { headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` } } : undefined,
    ),
  );
}

describe("admin/request", () => {
  it("AR-01: a request with no signed-on session is refused 401 with a JSON error body", () => {
    const event = requestWithCookie();

    const result = requireAdmin(event);

    expect(isAdminError(result)).toBe(true);
    expect(result).toEqual({ error: expect.any(String) });
    expect(event.res.status).toBe(401);
  });

  it("AR-02: a signed-on session without the administrator role is refused 403 with a JSON error body", () => {
    db.insert(authUsers).values({ userName: "plain-jane", password: "hash", role: null }).run();
    const setup = new H3Event(new Request("http://localhost/api/admin/orders"));
    setSignedOn(useSignOnSession(setup), "plain-jane");
    const cookieValue = cookieValueOf(setup);

    const event = requestWithCookie(cookieValue);
    const result = requireAdmin(event);

    expect(isAdminError(result)).toBe(true);
    expect(result).toEqual({ error: expect.any(String) });
    expect(event.res.status).toBe(403);
  });

  it("AR-03: the 401 and 403 refusals are distinguishable by status", () => {
    db.insert(authUsers).values({ userName: "plain-joe", password: "hash", role: null }).run();
    const setup = new H3Event(new Request("http://localhost/api/admin/orders"));
    setSignedOn(useSignOnSession(setup), "plain-joe");
    const cookieValue = cookieValueOf(setup);

    const unsignedEvent = requestWithCookie();
    requireAdmin(unsignedEvent);

    const forbiddenEvent = requestWithCookie(cookieValue);
    requireAdmin(forbiddenEvent);

    expect(unsignedEvent.res.status).toBe(401);
    expect(forbiddenEvent.res.status).toBe(403);
    expect(unsignedEvent.res.status).not.toBe(forbiddenEvent.res.status);
  });

  it("AR-04: an administrator session receives the context carrying the signed-on username", () => {
    db.insert(authUsers)
      .values({ userName: "admin-amy", password: "hash", role: "administrator" })
      .run();
    const setup = new H3Event(new Request("http://localhost/api/admin/orders"));
    setSignedOn(useSignOnSession(setup), "admin-amy");
    const cookieValue = cookieValueOf(setup);

    const event = requestWithCookie(cookieValue);
    const result = requireAdmin(event);

    expect(isAdminError(result)).toBe(false);
    expect(result).toEqual({ userName: "admin-amy" });
  });
});
