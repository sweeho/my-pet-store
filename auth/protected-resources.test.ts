import { describe, expect, it } from "vitest";

import { findProtectedResource, isProtectedResource } from "./protected-resources";

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
});
