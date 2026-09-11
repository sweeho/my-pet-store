import { describe, expect, it } from "vitest";

import { authenticate, createUser } from "./authenticate";

describe("auth/authenticate", () => {
  it("AT-01: authentication succeeds with correct credentials", () => {
    createUser("alice", "secret123");

    expect(authenticate("alice", "secret123")).toBe(true);
  });

  it("AT-02: authentication fails with incorrect password", () => {
    createUser("bob", "secret123");

    expect(authenticate("bob", "wrongpass")).toBe(false);
  });

  it("AT-03: authentication fails with a non-existent username", () => {
    expect(authenticate("nonexistent", "anything")).toBe(false);
  });

  it("AT-04: authentication fails when the password differs only in case", () => {
    createUser("carol", "secret123");

    expect(authenticate("carol", "SECRET123")).toBe(false);
  });
});
