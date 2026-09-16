import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { sessions } from "../db/schema";
import {
  invalidateSession,
  SESSION_COOKIE,
  setOriginalUrl,
  setSignedOn,
  useSignOnSession,
} from "./session";

function cookieValueFrom(event: H3Event, name: string): string {
  const setCookieHeader = event.res.headers.get("set-cookie");
  const match = setCookieHeader?.match(new RegExp(`${name}=([^;]+)`));
  if (!match) throw new Error(`no ${name} cookie was set`);
  return match[1];
}

describe("auth/session", () => {
  it("ST-01: a fresh session (no cookie) is unsigned-on by default and sets the cookie", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));

    const session = useSignOnSession(event);

    expect(session.j_signon).toBe(false);
    expect(session.j_signon_username).toBeNull();
    expect(cookieValueFrom(event, SESSION_COOKIE)).toBe(session.id);
  });

  it("ST-02: a second request with the same cookie returns the same session row", () => {
    const first = new H3Event(new Request("http://localhost/api/signon/session"));
    const created = useSignOnSession(first);
    const cookieValue = cookieValueFrom(first, SESSION_COOKIE);

    const second = new H3Event(
      new Request("http://localhost/api/signon/session", {
        headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` },
      }),
    );
    const found = useSignOnSession(second);

    expect(found.id).toBe(created.id);
  });

  it("ST-03: setSignedOn sets both j_signon and j_signon_username", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);

    const signedOn = setSignedOn(session, "alice");

    expect(signedOn.j_signon).toBe(true);
    expect(signedOn.j_signon_username).toBe("alice");
  });

  it("ST-04: setSignedOn persists across a lookup by the same session id", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);
    setSignedOn(session, "alice");
    const cookieValue = cookieValueFrom(event, SESSION_COOKIE);

    const next = new H3Event(
      new Request("http://localhost/api/signon/session", {
        headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` },
      }),
    );
    const found = useSignOnSession(next);

    expect(found.j_signon).toBe(true);
    expect(found.j_signon_username).toBe("alice");
  });

  it("ST-05: setOriginalUrl sets original_url", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);

    const updated = setOriginalUrl(session, "/customer");

    expect(updated.original_url).toBe("/customer");
  });

  it("ST-06: invalidateSession deletes the session row", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);

    invalidateSession(event, session);

    const row = db.select().from(sessions).where(eq(sessions.id, session.id)).get();
    expect(row).toBeUndefined();
  });

  it("ST-07: invalidateSession clears the bp_session cookie with the same attributes it was set with", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);

    invalidateSession(event, session);

    const setCookieHeader = event.res.headers.get("set-cookie");
    expect(setCookieHeader).toMatch(new RegExp(`${SESSION_COOKIE}=;`));
    expect(setCookieHeader).toMatch(/Max-Age=0/);
    expect(setCookieHeader).toMatch(/HttpOnly/i);
    expect(setCookieHeader).toMatch(/SameSite=Lax/i);
    expect(setCookieHeader).toMatch(/Path=\//i);
  });

  it("ST-08: invalidating the same session id twice does not throw", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);

    invalidateSession(event, session);

    expect(() => invalidateSession(event, session)).not.toThrow();
  });
});
