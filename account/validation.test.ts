import { describe, expect, it } from "vitest";

import { AccountValidationError, validateAccountUpdate } from "./validation";

describe("account/validation", () => {
  it("VA-01: an unsupported preferred language is rejected", () => {
    expect(() => validateAccountUpdate({ profile: { preferredLanguage: "fr_FR" } })).toThrow(
      AccountValidationError,
    );
  });

  it("VA-02: a supported preferred language passes", () => {
    expect(() => validateAccountUpdate({ profile: { preferredLanguage: "ja_JP" } })).not.toThrow();
  });

  it("VA-03: an unsupported favorite category is rejected", () => {
    expect(() => validateAccountUpdate({ profile: { favoriteCategory: "HAMSTERS" } })).toThrow(
      AccountValidationError,
    );
  });

  it("VA-04: a null favorite category passes", () => {
    expect(() => validateAccountUpdate({ profile: { favoriteCategory: null } })).not.toThrow();
  });

  it("VA-05: a supported favorite category passes", () => {
    expect(() => validateAccountUpdate({ profile: { favoriteCategory: "DOGS" } })).not.toThrow();
  });

  it("VA-06: an unsupported card type is rejected", () => {
    expect(() => validateAccountUpdate({ card: { cardType: "Visa" } })).toThrow(
      AccountValidationError,
    );
  });

  it("VA-07: a supported card type passes", () => {
    expect(() => validateAccountUpdate({ card: { cardType: "Duke Express" } })).not.toThrow();
  });

  it("VA-08: an update with no profile or card fields passes", () => {
    expect(() => validateAccountUpdate({ contactInfo: { givenName: "Alice" } })).not.toThrow();
  });
});
