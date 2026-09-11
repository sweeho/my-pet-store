import { afterEach, describe, expect, it } from "vitest";

import { readCookie } from "./cookies";

/**
 * UNIT TEST (jsdom)
 *
 * Exercises document.cookie parsing directly — no network, no server.
 * Copy src/utils/cn.test.ts's shape for other browser-side pure helpers.
 */
describe("readCookie", () => {
  afterEach(() => {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  it("reads a present cookie's value", () => {
    document.cookie = "bp_signon=alice";

    expect(readCookie("bp_signon")).toBe("alice");
  });

  it("returns undefined for a missing cookie", () => {
    expect(readCookie("bp_signon")).toBeUndefined();
  });

  it("decodes a URI-encoded value", () => {
    document.cookie = `bp_signon=${encodeURIComponent("ali ce")}`;

    expect(readCookie("bp_signon")).toBe("ali ce");
  });

  it("does not mistake a similarly-prefixed cookie for the target name", () => {
    document.cookie = "bp_signon_extra=wrong";
    document.cookie = "bp_signon=alice";

    expect(readCookie("bp_signon")).toBe("alice");
  });
});
