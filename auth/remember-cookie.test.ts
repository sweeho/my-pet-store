import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import {
  forgetUsername,
  REMEMBER_COOKIE,
  REMEMBER_COOKIE_MAX_AGE,
  rememberUsername,
} from "./remember-cookie";

describe("auth/remember-cookie", () => {
  it("RC-01: rememberUsername sets bp_signon to the username with maxAge 2,678,400", () => {
    const event = new H3Event(new Request("http://localhost/api/signon"));

    rememberUsername(event, "alice");

    const setCookieHeader = event.res.headers.get("set-cookie");
    expect(setCookieHeader).toContain(`${REMEMBER_COOKIE}=alice`);
    expect(setCookieHeader).toContain(`Max-Age=${REMEMBER_COOKIE_MAX_AGE}`);
    expect(REMEMBER_COOKIE_MAX_AGE).toBe(2_678_400);
  });

  it("RC-02: forgetUsername clears bp_signon by setting Max-Age=0", () => {
    const event = new H3Event(new Request("http://localhost/api/signon"));

    forgetUsername(event);

    const setCookieHeader = event.res.headers.get("set-cookie");
    expect(setCookieHeader).toContain(`${REMEMBER_COOKIE}=`);
    expect(setCookieHeader).toContain("Max-Age=0");
  });
});
