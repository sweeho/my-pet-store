import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { SESSION_COOKIE } from "../../../auth/session";
import createUserRoute from "./create-user.post";
import getSession from "./session.get";
import signOn from "./index.post";

function setCookieHeaders(event: H3Event): string[] {
  return event.res.headers.getSetCookie();
}

function sessionCookieFrom(event: H3Event): string | undefined {
  const header = setCookieHeaders(event).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return header?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function request(path: string, body: Record<string, unknown>, sessionCookie?: string): H3Event {
  return new H3Event(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(sessionCookie ? { cookie: `${SESSION_COOKIE}=${sessionCookie}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

function sessionRequest(sessionCookie: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/signon/session", {
      headers: { cookie: `${SESSION_COOKIE}=${sessionCookie}` },
    }),
  );
}

/**
 * INTEGRATION TEST — cross-endpoint flows
 *
 * Each individual route already carries its own single-endpoint cover
 * (create-user.post.test.ts, index.post.test.ts, session.get.test.ts). This
 * file proves the capability end to end by chaining those endpoints in the
 * same sequence a real client would: create, then authenticate, then read
 * the session back — the thing no single-route test can show on its own.
 * Real H3Event pattern, per routes/api/users/index.get.test.ts.
 */
describe("account creation + authentication flows", () => {
  it("FT-01: an account created via create-user authenticates via sign-in with the same credentials", async () => {
    const username = "flow-valid";
    const createEvent = request("/api/signon/create-user", {
      j_username: username,
      j_password: "secret123",
      j_password_2: "secret123",
    });
    const createResult = await createUserRoute(createEvent);
    expect(createResult).toEqual({ created: true, redirectTo: "/signon-welcome" });

    const signOnEvent = request("/api/signon", { j_username: username, j_password: "secret123" });
    const signOnResult = await signOn(signOnEvent);
    expect(signOnResult).toEqual({ signedOn: true, redirectTo: "/signon-welcome" });

    const session = await getSession(sessionRequest(sessionCookieFrom(signOnEvent)!));
    expect(session).toEqual({ j_signon: true, j_signon_username: username, original_url: null });
  });

  it("FT-02: a 25-character username is accepted for creation and authenticates", async () => {
    const username = "b".repeat(25);
    const createResult = await createUserRoute(
      request("/api/signon/create-user", {
        j_username: username,
        j_password: "secret123",
        j_password_2: "secret123",
      }),
    );
    expect(createResult).toEqual({ created: true, redirectTo: "/signon-welcome" });

    const signOnResult = await signOn(
      request("/api/signon", { j_username: username, j_password: "secret123" }),
    );
    expect(signOnResult).toEqual({ signedOn: true, redirectTo: "/signon-welcome" });
  });

  it("FT-03: a 26-character username is rejected for creation and never authenticates", async () => {
    const username = "c".repeat(26);
    const createResult = await createUserRoute(
      request("/api/signon/create-user", {
        j_username: username,
        j_password: "secret123",
        j_password_2: "secret123",
      }),
    );
    expect(createResult).toEqual({
      created: false,
      error: "User ID cant be more than 25 chars long",
      redirectTo: "/user-creation-error",
    });

    const signOnResult = await signOn(
      request("/api/signon", { j_username: username, j_password: "secret123" }),
    );
    expect(signOnResult).toEqual({ signedOn: false, redirectTo: "/signon-failed" });
  });

  it("FT-04: a username containing '%' is rejected for creation and never authenticates", async () => {
    const username = "d%ave";
    const createResult = await createUserRoute(
      request("/api/signon/create-user", {
        j_username: username,
        j_password: "secret123",
        j_password_2: "secret123",
      }),
    );
    expect(createResult).toEqual({
      created: false,
      error: "User Id cannot have '%' or '*' characters",
      redirectTo: "/user-creation-error",
    });

    const signOnResult = await signOn(
      request("/api/signon", { j_username: username, j_password: "secret123" }),
    );
    expect(signOnResult).toEqual({ signedOn: false, redirectTo: "/signon-failed" });
  });

  it("FT-05: a wrong password fails sign-in and the session it created stays unsigned-on", async () => {
    const username = "flow-wrongpass";
    await createUserRoute(
      request("/api/signon/create-user", {
        j_username: username,
        j_password: "secret123",
        j_password_2: "secret123",
      }),
    );

    const signOnEvent = request("/api/signon", { j_username: username, j_password: "wrongpass" });
    const signOnResult = await signOn(signOnEvent);
    expect(signOnResult).toEqual({ signedOn: false, redirectTo: "/signon-failed" });

    const session = await getSession(sessionRequest(sessionCookieFrom(signOnEvent)!));
    expect(session).toEqual({ j_signon: false, j_signon_username: null, original_url: null });
  });

  it("FT-06: a username that was never created fails sign-in and its session stays unsigned-on", async () => {
    const signOnEvent = request("/api/signon", {
      j_username: "flow-never-created",
      j_password: "secret123",
    });
    const signOnResult = await signOn(signOnEvent);
    expect(signOnResult).toEqual({ signedOn: false, redirectTo: "/signon-failed" });

    const session = await getSession(sessionRequest(sessionCookieFrom(signOnEvent)!));
    expect(session).toEqual({ j_signon: false, j_signon_username: null, original_url: null });
  });
});
