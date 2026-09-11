import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../auth/session";
import checkAccess from "./check.get";

function cookieValueOf(event: H3Event): string | undefined {
  const setCookieHeader = event.res.headers.get("set-cookie");
  return setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function requestWithCookie(url: string, cookieValue: string | undefined): H3Event {
  return new H3Event(
    new Request(
      url,
      cookieValue ? { headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` } } : undefined,
    ),
  );
}

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/signon/session.get.test.ts. Reading a session's
 * state back out after the handler runs requires replaying the cookie the handler set on
 * the response — a second useSignOnSession(event) call on the SAME request has no cookie
 * to read and would silently create an unrelated session.
 */
describe("GET /api/signon/check", () => {
  it("CH-01: denies an unsigned-on request for a protected resource, stores original_url, and points at /signon", async () => {
    const event = new H3Event(new Request("http://localhost/api/signon/check?resource=/customer"));

    const result = await checkAccess(event);

    expect(result).toEqual({ allowed: false, redirectTo: "/signon" });

    const followUp = requestWithCookie("http://localhost/api/signon/session", cookieValueOf(event));
    expect(useSignOnSession(followUp).original_url).toBe("/customer");
  });

  it("CH-02: allows a signed-on request through with no redirect and no original_url rewrite", async () => {
    const setup = new H3Event(new Request("http://localhost/api/signon/check?resource=/customer"));
    setSignedOn(useSignOnSession(setup), "alice");
    const cookieValue = cookieValueOf(setup);

    const event = requestWithCookie(
      "http://localhost/api/signon/check?resource=/customer",
      cookieValue,
    );
    const result = await checkAccess(event);

    expect(result).toEqual({ allowed: true });

    const followUp = requestWithCookie("http://localhost/api/signon/session", cookieValue);
    expect(useSignOnSession(followUp).original_url).toBeNull();
  });

  it("CH-03: an unprotected resource is allowed for an unsigned-on request", async () => {
    const event = new H3Event(new Request("http://localhost/api/signon/check?resource=/about"));

    const result = await checkAccess(event);

    expect(result).toEqual({ allowed: true });
  });

  it("CH-04: a resource that is not a same-origin path is rejected without being stored", async () => {
    const event = new H3Event(
      new Request(
        "http://localhost/api/signon/check?resource=" + encodeURIComponent("//evil.example.com"),
      ),
    );

    const result = await checkAccess(event);

    expect(result).toEqual({ allowed: false, redirectTo: "/signon" });

    const followUp = requestWithCookie("http://localhost/api/signon/session", cookieValueOf(event));
    expect(useSignOnSession(followUp).original_url).toBeNull();
  });
});
