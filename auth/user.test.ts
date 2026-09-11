import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { authUsers } from "../db/schema";
import { findAccount } from "../account/customer";
import { CreateUserError } from "./validation";
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

  it("UT-05: registering a new user creates its account and profile with defaults", () => {
    insertUser("erin", "secret123");

    const account = findAccount("erin");

    expect(account?.status).toBe("active");
    expect(account?.profile).toEqual({
      preferredLanguage: "en_US",
      favoriteCategory: null,
      myListPreference: true,
      bannerPreference: true,
    });
  });

  it("UT-06: registering an already-taken user name throws and adds no row", () => {
    insertUser("frank", "secret123");
    const countBefore = db.select().from(authUsers).all().length;

    expect(() => insertUser("frank", "secret123")).toThrow(CreateUserError);
    expect(db.select().from(authUsers).all().length).toBe(countBefore);
  });
});
