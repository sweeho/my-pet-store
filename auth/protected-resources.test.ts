import { describe, expect, it } from "vitest";

import { evaluateAccess } from "./signon-filter";
import { ADMIN_ROLE, findProtectedResource, isProtectedResource } from "./protected-resources";
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

describe("auth/protected-resources", () => {
  it("PR-01: /order-completed is a protected resource", () => {
    expect(isProtectedResource("/order-completed")).toBe(true);
  });

  it("PR-02: /order-completed carries no role requirement — any signed-on shopper may reach it", () => {
    const resource = findProtectedResource("/order-completed");

    expect(resource).toBeDefined();
    expect(resource?.requiresRole).toBeUndefined();
  });

  it("PR-03 (AC-1): /payment is a protected resource with no role requirement", () => {
    const resource = findProtectedResource("/payment");

    expect(resource).toBeDefined();
    expect(resource?.requiresRole).toBeUndefined();
  });

  it("PR-04: /api/payment is a protected resource with no role requirement", () => {
    const resource = findProtectedResource("/api/payment");

    expect(resource).toBeDefined();
    expect(resource?.requiresRole).toBeUndefined();
  });

  // AC-4: /supplier, /api/supplier and /api/fulfillment each require the
  // administrator role.
  it("PR-05: /api/fulfillment requires the administrator role", () => {
    const resource = findProtectedResource("/api/fulfillment");

    expect(resource).toBeDefined();
    expect(resource?.requiresRole).toBe(ADMIN_ROLE);
  });

  it("PR-06: /supplier requires the administrator role", () => {
    const resource = findProtectedResource("/supplier");

    expect(resource).toBeDefined();
    expect(resource?.requiresRole).toBe(ADMIN_ROLE);
  });

  it("PR-07: /api/supplier requires the administrator role", () => {
    const resource = findProtectedResource("/api/supplier");

    expect(resource).toBeDefined();
    expect(resource?.requiresRole).toBe(ADMIN_ROLE);
  });

  // A requiresRole entry protects its whole subtree by prefix (PLAN.md step
  // 4) — a route nested under one of these three paths is covered without
  // a fourth entry.
  it("PR-08: a subtree path under each of the three new entries is protected by the same requirement", () => {
    expect(findProtectedResource("/api/fulfillment/process")?.requiresRole).toBe(ADMIN_ROLE);
    expect(findProtectedResource("/supplier/inventory")?.requiresRole).toBe(ADMIN_ROLE);
    expect(findProtectedResource("/api/supplier/inventory")?.requiresRole).toBe(ADMIN_ROLE);
  });

  // AC-4, asserted through the actual access rule the middleware applies —
  // not just registration. A missing role is refused, never redirected
  // (ARCHITECTURE.md § Key Decisions), matching signon-filter.test.ts's own
  // admin-path assertions (SF-12, SF-14).
  it("PR-09: a signed-out request to /api/fulfillment is denied, not merely unlisted", () => {
    const verdict = evaluateAccess(session({ j_signon: false }), "/api/fulfillment");

    expect(verdict).toEqual({
      allowed: false,
      reason: "not-signed-on",
      redirectTo: expect.any(String),
    });
  });

  it("PR-10: a signed-on request to /api/fulfillment without the administrator role is refused role-required, not redirected", () => {
    const verdict = evaluateAccess(session({ j_signon: true }), "/api/fulfillment", null);

    expect(verdict).toEqual({ allowed: false, reason: "role-required", requiredRole: ADMIN_ROLE });
  });

  it("PR-11: a signed-on administrator is allowed on /api/fulfillment", () => {
    const verdict = evaluateAccess(session({ j_signon: true }), "/api/fulfillment", ADMIN_ROLE);

    expect(verdict).toEqual({ allowed: true });
  });

  it("PR-12: a signed-on request to /supplier without the role is refused role-required", () => {
    const verdict = evaluateAccess(session({ j_signon: true }), "/supplier", null);

    expect(verdict).toEqual({ allowed: false, reason: "role-required", requiredRole: ADMIN_ROLE });
  });

  it("PR-13: a signed-on request to /api/supplier without the role is refused role-required", () => {
    const verdict = evaluateAccess(session({ j_signon: true }), "/api/supplier", null);

    expect(verdict).toEqual({ allowed: false, reason: "role-required", requiredRole: ADMIN_ROLE });
  });

  it("PR-14: every existing entry's behaviour is unchanged — /customer still requires no role", () => {
    const resource = findProtectedResource("/customer");

    expect(resource).toBeDefined();
    expect(resource?.requiresRole).toBeUndefined();
  });
});
