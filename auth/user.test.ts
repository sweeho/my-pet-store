import { describe, expect, it } from "vitest";

import { findUser, insertUser, matchPassword } from "./user";

describe("auth/user", () => {
  it("UT-01: a user inserted with valid credentials is found by findUser with its user_name as the key", () => {
    insertUser("alice", "secret123");

    const found = findUser("alice");

    expect(found).toBeDefined();
    expect(found?.userName).toBe("alice");
  });

  it("UT-02: matchPassword is true for the exact password", () => {
    insertUser("bob", "secret123");
    const user = findUser("bob")!;

    expect(matchPassword(user, "secret123")).toBe(true);
  });

  it("UT-03: matchPassword is false for a different-cased password", () => {
    insertUser("carol", "secret123");
    const user = findUser("carol")!;

    expect(matchPassword(user, "SECRET123")).toBe(false);
  });

  it("UT-04: the stored password column is not the plaintext", () => {
    const created = insertUser("dave", "secret123");

    expect(created.password).not.toBe("secret123");
  });
});
