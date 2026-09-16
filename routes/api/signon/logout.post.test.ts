import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../auth/session";
import logout from "./logout.post";

function cookieValue(event: H3Event, name: string): string | undefined {
  const header = event.res.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
  return header?.match(new RegExp(`${name}=([^;]+)`))?.[1];
}

function requestWithCookie(sessionCookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/signon/logout", {
      method: "POST",
      headers: sessionCookie ? { cookie: `${SESSION_COOKIE}=${sessionCookie}` } : undefined,
    }),
  );
}

/**
 * INTEGRATION TEST — real H3Event, no server, per routes/api/signon/index.post.test.ts.
 */
describe("POST /api/signon/logout", () => {
  it("LO-01: a signed-on session is ended, and the same cookie afterwards yields a new session", async () => {
    const setup = new H3Event(new Request("http://localhost/api/signon/session"));
    setSignedOn(useSignOnSession(setup), "alice");
    const originalId = useSignOnSession(setup).id;
    const sessionCookie = cookieValue(setup, SESSION_COOKIE)!;

    const event = requestWithCookie(sessionCookie);
    const result = await logout(event);

    expect(result).toEqual({ signedOut: true });

    const followUp = requestWithCookie(sessionCookie);
    const next = useSignOnSession(followUp);
    expect(next.id).not.toBe(originalId);
    expect(next.j_signon).toBe(false);
    expect(next.j_signon_username).toBeNull();
  });

  it("LO-02: a request with no session cookie succeeds with the same body — idempotent by design", async () => {
    const event = requestWithCookie();

    const result = await logout(event);

    expect(result).toEqual({ signedOut: true });
  });

  it("LO-03: a cookie naming a session row that no longer exists succeeds with the same body", async () => {
    const event = requestWithCookie("this-session-id-does-not-exist");

    const result = await logout(event);

    expect(result).toEqual({ signedOut: true });
  });
});
