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
});
