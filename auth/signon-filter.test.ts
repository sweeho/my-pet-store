import { describe, expect, it } from "vitest";

import { evaluateAccess, isNavigationRequest } from "./signon-filter";
import { SIGN_ON_PAGE } from "./protected-resources";
import type { SignOnSession } from "./session";

function session(overrides: Partial<SignOnSession> = {}): SignOnSession {
  return {
    id: "s1",
    j_signon: false,
    j_signon_username: null,
    original_url: null,
    ...overrides,
  };
}

describe("auth/signon-filter", () => {
  it("SF-01: a protected resource is denied for an unsigned-on session", () => {
    const verdict = evaluateAccess(session({ j_signon: false }), "/customer");

    expect(verdict).toEqual({ allowed: false, redirectTo: SIGN_ON_PAGE });
  });

  it("SF-02: a protected resource is allowed for a signed-on session", () => {
    const verdict = evaluateAccess(session({ j_signon: true }), "/customer");

    expect(verdict).toEqual({ allowed: true });
  });

  it("SF-03: an unprotected resource is allowed for an unsigned-on session", () => {
    const verdict = evaluateAccess(session({ j_signon: false }), "/about");

    expect(verdict).toEqual({ allowed: true });
  });
});

describe("auth/signon-filter isNavigationRequest", () => {
  it("SF-04: Sec-Fetch-Mode: navigate is a navigation", () => {
    expect(isNavigationRequest(new Headers({ "sec-fetch-mode": "navigate" }))).toBe(true);
  });

  it("SF-05: Sec-Fetch-Mode: cors (a background fetch/XHR) is not a navigation", () => {
    expect(isNavigationRequest(new Headers({ "sec-fetch-mode": "cors" }))).toBe(false);
  });

  it("SF-06: Sec-Fetch-Dest: document is a navigation when Sec-Fetch-Mode is absent", () => {
    expect(isNavigationRequest(new Headers({ "sec-fetch-dest": "document" }))).toBe(true);
  });

  it("SF-07: Sec-Fetch-Dest: empty (a background fetch) is not a navigation", () => {
    expect(isNavigationRequest(new Headers({ "sec-fetch-dest": "empty" }))).toBe(false);
  });

  it("SF-08: with neither Fetch Metadata header, an Accept preferring text/html is a navigation", () => {
    expect(
      isNavigationRequest(
        new Headers({ accept: "text/html,application/xhtml+xml,application/xml;q=0.9" }),
      ),
    ).toBe(true);
  });

  it("SF-09: with neither Fetch Metadata header, a background fetch's default Accept is not a navigation", () => {
    expect(isNavigationRequest(new Headers({ accept: "*/*" }))).toBe(false);
  });

  it("SF-10: with no Fetch Metadata header and no Accept header at all, it is not a navigation", () => {
    expect(isNavigationRequest(new Headers())).toBe(false);
  });
});
