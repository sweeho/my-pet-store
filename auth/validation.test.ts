import { describe, expect, it } from "vitest";

import {
  CreateUserError,
  MAX_PASSWD_LENGTH,
  MAX_USERID_LENGTH,
  validateNewUser,
} from "./validation";

describe("auth/validation", () => {
  it("VT-01: a username at exactly the maximum length passes", () => {
    const userName = "a".repeat(MAX_USERID_LENGTH);

    expect(() => validateNewUser(userName, "secret123")).not.toThrow();
  });

  it("VT-02: a username exceeding the maximum length throws with the exact message", () => {
    const userName = "a".repeat(MAX_USERID_LENGTH + 1);

    expect(() => validateNewUser(userName, "secret123")).toThrow(
      new CreateUserError("User ID cant be more than 25 chars long"),
    );
  });

  it("VT-03: a username containing '%' throws with the exact message", () => {
    expect(() => validateNewUser("ali%ce", "secret123")).toThrow(
      new CreateUserError("User Id cannot have '%' or '*' characters"),
    );
  });

  it("VT-04: a username containing '*' throws with the exact message", () => {
    expect(() => validateNewUser("ali*ce", "secret123")).toThrow(
      new CreateUserError("User Id cannot have '%' or '*' characters"),
    );
  });

  it("VT-05: a password exceeding the maximum length throws with the exact message", () => {
    const password = "a".repeat(MAX_PASSWD_LENGTH + 1);

    expect(() => validateNewUser("alice", password)).toThrow(
      new CreateUserError("Password cant be more than 32 chars long"),
    );
  });

  it("VT-06: a valid username and password pair throws nothing", () => {
    expect(() => validateNewUser("alice", "secret123")).not.toThrow();
  });
});
