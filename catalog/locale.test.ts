import { describe, expect, it } from "vitest";

import { LANGUAGES } from "../account/vocabulary";
import { DEFAULT_LOCALE, isSupportedLocale, resolveLocale } from "./locale";

describe("catalog/locale", () => {
  it("LT-01: DEFAULT_LOCALE is en_US", () => {
    expect(DEFAULT_LOCALE).toBe("en_US");
  });

  it("LT-02: isSupportedLocale is true for every locale in account/vocabulary's LANGUAGES", () => {
    for (const locale of LANGUAGES) {
      expect(isSupportedLocale(locale)).toBe(true);
    }
  });

  it("LT-03: isSupportedLocale is false for an unsupported locale", () => {
    expect(isSupportedLocale("de_DE")).toBe(false);
  });

  it("LT-04: resolveLocale maps an absent input to DEFAULT_LOCALE", () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });

  it("LT-05: resolveLocale maps an empty string to DEFAULT_LOCALE", () => {
    expect(resolveLocale("")).toBe(DEFAULT_LOCALE);
  });

  it("LT-06: resolveLocale passes a supported locale through unchanged", () => {
    expect(resolveLocale("ja_JP")).toBe("ja_JP");
  });

  it("LT-07: resolveLocale passes an unsupported locale through unchanged rather than rejecting it", () => {
    expect(resolveLocale("de_DE")).toBe("de_DE");
  });
});
