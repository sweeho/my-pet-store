import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { findUser } from "../../../auth/user";
import { SESSION_COOKIE, useSignOnSession } from "../../../auth/session";
import createUserRoute from "./create-user.post";

function cookieValue(event: H3Event, name: string): string | undefined {
  const header = event.res.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
  return header?.match(new RegExp(`${name}=([^;]+)`))?.[1];
}

function postCreateUser(body: Record<string, unknown>): H3Event {
  return new H3Event(
    new Request("http://localhost/api/signon/create-user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/signon/index.post.test.ts.
 */
describe("POST /api/signon/create-user", () => {
  it("CU-01: a valid pair creates the user, signs the session on, and redirects to /signon-welcome", async () => {
    const event = postCreateUser({
      j_username: "alice",
      j_password: "secret123",
      j_password_2: "secret123",
    });

    const result = await createUserRoute(event);

    expect(result).toEqual({ created: true, redirectTo: "/signon-welcome" });
    expect(findUser("alice")).toBeDefined();

    const followUp = new H3Event(
      new Request("http://localhost/api/signon/session", {
        headers: { cookie: `${SESSION_COOKIE}=${cookieValue(event, SESSION_COOKIE)}` },
      }),
    );
    const session = useSignOnSession(followUp);
    expect(session.j_signon).toBe(true);
    expect(session.j_signon_username).toBe("alice");
  });

  it("CU-02: a 26-character username fails with the exact validator message and creates nothing", async () => {
    const longUserName = "a".repeat(26);

    const event = postCreateUser({
      j_username: longUserName,
      j_password: "secret123",
      j_password_2: "secret123",
    });
    const result = await createUserRoute(event);

    expect(result).toEqual({
      created: false,
      error: "User ID cant be more than 25 chars long",
      redirectTo: "/user-creation-error",
    });
    expect(findUser(longUserName)).toBeUndefined();
  });

  it("CU-03: a username containing '%' fails with the exact validator message and creates nothing", async () => {
    const event = postCreateUser({
      j_username: "ali%ce",
      j_password: "secret123",
      j_password_2: "secret123",
    });
    const result = await createUserRoute(event);

    expect(result).toEqual({
      created: false,
      error: "User Id cannot have '%' or '*' characters",
      redirectTo: "/user-creation-error",
    });
    expect(findUser("ali%ce")).toBeUndefined();
  });

  it("CU-04: a mismatched password confirmation creates nothing", async () => {
    const event = postCreateUser({
      j_username: "bob",
      j_password: "secret123",
      j_password_2: "different",
    });
    const result = await createUserRoute(event);

    expect(result).toEqual({
      created: false,
      error: "Passwords do not match",
      redirectTo: "/user-creation-error",
    });
    expect(findUser("bob")).toBeUndefined();
  });
});
