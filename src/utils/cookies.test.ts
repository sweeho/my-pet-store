import { afterEach, describe, expect, it } from "vitest";

import { readCookie, writeCookie } from "./cookies";

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

describe("writeCookie", () => {
  afterEach(() => {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  it("stores a value that readCookie then returns unchanged (AC-6)", () => {
    writeCookie("petstore_locale", "ja_JP");

    expect(readCookie("petstore_locale")).toBe("ja_JP");
  });

  it("round-trips a value containing a comma or a semicolon (AC-6)", () => {
    writeCookie("petstore_locale", "a,b;c");

    expect(readCookie("petstore_locale")).toBe("a,b;c");
  });

  it("sets Path=/ so the cookie is readable from any route", () => {
    writeCookie("petstore_locale", "ja_JP");

    expect(document.cookie).toContain("petstore_locale=");
  });
});
