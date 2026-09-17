import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { authUsers } from "../../../db/schema";
import {
  SESSION_COOKIE,
  setOriginalUrl,
  setSignedOn,
  useSignOnSession,
} from "../../../auth/session";
import getSession from "./session.get";

function cookieValueOf(event: H3Event): string | undefined {
  const setCookieHeader = event.res.headers.get("set-cookie");
  return setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function requestWithCookie(cookieValue: string | undefined): H3Event {
  return new H3Event(
    new Request(
      "http://localhost/api/signon/session",
      cookieValue ? { headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` } } : undefined,
    ),
  );
}

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/users/index.get.test.ts. Also the route test for
 * design.md § Decisions D2/D3 — the `role` this endpoint reports and the guarantee that reading
 * it never writes anything (AC-13 through AC-16).
 */
describe("GET /api/signon/session", () => {
  it("creates a session and reports its unsigned-on default for a caller with no cookie", async () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));

    const result = await getSession(event);

    expect(result).toEqual({
      j_signon: false,
      j_signon_username: null,
      original_url: null,
      role: null,
    });
  });

  it("AC-13: reports the administrator role for a signed-on administrator", async () => {
    db.insert(authUsers)
      .values({ userName: "session-admin", password: "hash", role: "administrator" })
      .run();
    const setup = new H3Event(new Request("http://localhost/api/signon/session"));
    setSignedOn(useSignOnSession(setup), "session-admin");
    const cookieValue = cookieValueOf(setup);

    const result = await getSession(requestWithCookie(cookieValue));

    expect(result).toEqual({
      j_signon: true,
      j_signon_username: "session-admin",
      original_url: null,
      role: "administrator",
    });
  });

  it("AC-14: reports no role for a signed-on shopper whose identity holds none", async () => {
    db.insert(authUsers)
      .values({ userName: "session-shopper", password: "hash", role: null })
      .run();
    const setup = new H3Event(new Request("http://localhost/api/signon/session"));
    setSignedOn(useSignOnSession(setup), "session-shopper");
    const cookieValue = cookieValueOf(setup);

    const result = await getSession(requestWithCookie(cookieValue));

    expect(result).toEqual({
      j_signon: true,
      j_signon_username: "session-shopper",
      original_url: null,
      role: null,
    });
  });

  it("AC-15: reports a signed-out visitor as such, with no username and no role", async () => {
    const result = await getSession(requestWithCookie(undefined));

    expect(result).toEqual({
      j_signon: false,
      j_signon_username: null,
      original_url: null,
      role: null,
    });
  });

  it("AC-16: reading the session leaves the recorded return address untouched", async () => {
    const setup = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(setup);
    setOriginalUrl(session, "/cart");
    const cookieValue = cookieValueOf(setup);

    const result = await getSession(requestWithCookie(cookieValue));
    expect(result.original_url).toBe("/cart");

    const followUp = requestWithCookie(cookieValue);
    expect(useSignOnSession(followUp).original_url).toBe("/cart");
  });
});
