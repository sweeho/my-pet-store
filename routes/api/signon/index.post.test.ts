import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { createUser } from "../../../auth/authenticate";
import { REMEMBER_COOKIE } from "../../../auth/remember-cookie";
import { SESSION_COOKIE, setOriginalUrl, useSignOnSession } from "../../../auth/session";
import signOn from "./index.post";

function setCookieHeaders(event: H3Event): string[] {
  return event.res.headers.getSetCookie();
}

function cookieValue(event: H3Event, name: string): string | undefined {
  const header = setCookieHeaders(event).find((c) => c.startsWith(`${name}=`));
  return header?.match(new RegExp(`${name}=([^;]+)`))?.[1];
}

function postSignOn(body: Record<string, unknown>, sessionCookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/signon", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(sessionCookie ? { cookie: `${SESSION_COOKIE}=${sessionCookie}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/users/index.get.test.ts. A response can carry more
 * than one Set-Cookie header (bp_session + bp_signon), so cookies are read back with
 * Headers.getSetCookie() rather than the singular .get("set-cookie") used where only one
 * cookie is ever in play.
 */
describe("POST /api/signon", () => {
  it("SI-01: a signed-in user is redirected to the session's stored original_url", async () => {
    createUser("alice", "secret123");
    const setup = new H3Event(new Request("http://localhost/api/signon/check?resource=/customer"));
    setOriginalUrl(useSignOnSession(setup), "/customer");
    const sessionCookie = cookieValue(setup, SESSION_COOKIE);

    const event = postSignOn({ j_username: "alice", j_password: "secret123" }, sessionCookie);
    const result = await signOn(event);

    expect(result).toEqual({ signedOn: true, redirectTo: "/customer" });
  });

  it("SI-02: a signed-in user with no stored original_url is redirected to /signon-welcome", async () => {
    createUser("bob", "secret123");

    const event = postSignOn({ j_username: "bob", j_password: "secret123" });
    const result = await signOn(event);

    expect(result).toEqual({ signedOn: true, redirectTo: "/signon-welcome" });
  });

  it("SI-03: a wrong password fails sign-in and leaves the session unsigned-on", async () => {
    createUser("carol", "secret123");

    const event = postSignOn({ j_username: "carol", j_password: "wrongpass" });
    const result = await signOn(event);

    expect(result).toEqual({ signedOn: false, redirectTo: "/signon-failed" });

    const followUp = new H3Event(
      new Request("http://localhost/api/signon/session", {
        headers: { cookie: `${SESSION_COOKIE}=${cookieValue(event, SESSION_COOKIE)}` },
      }),
    );
    expect(useSignOnSession(followUp).j_signon).toBe(false);
  });

  it("SI-04: the remember checkbox sets bp_signon with a 2,678,400s Max-Age", async () => {
    createUser("dave", "secret123");

    const event = postSignOn({
      j_username: "dave",
      j_password: "secret123",
      j_remember_username: true,
    });
    await signOn(event);

    const rememberHeader = setCookieHeaders(event).find((c) => c.startsWith(`${REMEMBER_COOKIE}=`));
    expect(rememberHeader).toContain(`${REMEMBER_COOKIE}=dave`);
    expect(rememberHeader).toContain("Max-Age=2678400");
  });

  it("SI-05: an unchecked remember box clears bp_signon with Max-Age=0", async () => {
    createUser("erin", "secret123");

    const event = postSignOn({ j_username: "erin", j_password: "secret123" });
    await signOn(event);

    const rememberHeader = setCookieHeaders(event).find((c) => c.startsWith(`${REMEMBER_COOKIE}=`));
    expect(rememberHeader).toContain("Max-Age=0");
  });
});
