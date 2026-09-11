import { describe, expect, it } from "vitest";

import { evaluateAccess } from "./signon-filter";
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
