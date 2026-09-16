import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { cartItems, sessions } from "../db/schema";
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

  // F4/D4: PRAGMA foreign_keys is never set, so the declared ON DELETE CASCADE
  // on cart_items.session_id enforces nothing — the delete has to be explicit.
  it("ST-09: invalidateSession deletes the session's cart_items rows explicitly, not via a cascade", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);
    db.insert(cartItems)
      .values({ sessionId: session.id, itemid: "session-test-item", quantity: 2 })
      .run();

    invalidateSession(event, session);

    const rows = db.select().from(cartItems).where(eq(cartItems.sessionId, session.id)).all();
    expect(rows).toEqual([]);
  });

  it("ST-10: invalidating a session with cart items twice does not throw, and the cart rows stay gone", () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(event);
    db.insert(cartItems)
      .values({ sessionId: session.id, itemid: "session-test-item-2", quantity: 1 })
      .run();

    invalidateSession(event, session);
    expect(() => invalidateSession(event, session)).not.toThrow();

    const rows = db.select().from(cartItems).where(eq(cartItems.sessionId, session.id)).all();
    expect(rows).toEqual([]);
  });

  // Persistence across navigation needs no new code — every cart read
  // resolves the session through useSignOnSession and the rows are keyed on
  // it (PLAN.md step 3). This test verifies that property rather than
  // building it: a second request carrying the same cookie sees the same
  // cart rows, and a request carrying no (i.e. a different) cookie does not.
  it("ST-12: two reads carrying the same session cookie see the same cart rows; a different cookie does not", () => {
    const first = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(first);
    db.insert(cartItems)
      .values({ sessionId: session.id, itemid: "persist-test-item", quantity: 4 })
      .run();
    const cookieValue = cookieValueFrom(first, SESSION_COOKIE);

    const second = new H3Event(
      new Request("http://localhost/api/signon/session", {
        headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` },
      }),
    );
    const sameSession = useSignOnSession(second);
    expect(sameSession.id).toBe(session.id);
    const rowsSameCookie = db
      .select()
      .from(cartItems)
      .where(eq(cartItems.sessionId, sameSession.id))
      .all();
    expect(rowsSameCookie).toEqual([
      { sessionId: session.id, itemid: "persist-test-item", quantity: 4 },
    ]);

    const third = new H3Event(new Request("http://localhost/api/signon/session"));
    const differentSession = useSignOnSession(third);
    expect(differentSession.id).not.toBe(session.id);
    const rowsDifferentCookie = db
      .select()
      .from(cartItems)
      .where(eq(cartItems.sessionId, differentSession.id))
      .all();
    expect(rowsDifferentCookie).toEqual([]);
  });

  it("ST-11: invalidateSession does not touch another session's cart rows", () => {
    const eventA = new H3Event(new Request("http://localhost/api/signon/session"));
    const sessionA = useSignOnSession(eventA);
    const eventB = new H3Event(new Request("http://localhost/api/signon/session"));
    const sessionB = useSignOnSession(eventB);
    db.insert(cartItems)
      .values({ sessionId: sessionA.id, itemid: "session-test-item-a", quantity: 1 })
      .run();
    db.insert(cartItems)
      .values({ sessionId: sessionB.id, itemid: "session-test-item-b", quantity: 1 })
      .run();

    invalidateSession(eventA, sessionA);

    const rowsB = db.select().from(cartItems).where(eq(cartItems.sessionId, sessionB.id)).all();
    expect(rowsB).toEqual([{ sessionId: sessionB.id, itemid: "session-test-item-b", quantity: 1 }]);
  });
});
