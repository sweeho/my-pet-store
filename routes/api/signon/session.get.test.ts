import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../auth/session";
import getSession from "./session.get";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/users/index.get.test.ts.
 */
describe("GET /api/signon/session", () => {
  it("creates a session and reports its unsigned-on default for a caller with no cookie", async () => {
    const event = new H3Event(new Request("http://localhost/api/signon/session"));

    const result = await getSession(event);

    expect(result).toEqual({ j_signon: false, j_signon_username: null, original_url: null });
  });

  it("reports an existing session's signed-on attributes", async () => {
    const setup = new H3Event(new Request("http://localhost/api/signon/session"));
    const session = useSignOnSession(setup);
    setSignedOn(session, "alice");
    const setCookieHeader = setup.res.headers.get("set-cookie");
    const cookieValue = setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];

    const event = new H3Event(
      new Request("http://localhost/api/signon/session", {
        headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` },
      }),
    );
    const result = await getSession(event);

    expect(result).toEqual({ j_signon: true, j_signon_username: "alice", original_url: null });
  });
});
