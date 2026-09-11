import { describe, expect, it } from "vitest";

import { expiryMonth, expiryYear, lastFour } from "./card";

describe("account/card", () => {
  it("CT-01: expiryMonth parses the month before the slash", () => {
    expect(expiryMonth("12/2025")).toBe("12");
  });

  it("CT-02: expiryYear parses the year after the slash", () => {
    expect(expiryYear("12/2025")).toBe("2025");
  });

  it("CT-03: expiryMonth falls back to '01' for a malformed value", () => {
    expect(expiryMonth("garbage")).toBe("01");
  });

  it("CT-04: expiryYear falls back to '2010' for a malformed value", () => {
    expect(expiryYear("garbage")).toBe("2010");
  });

  it("CT-05: expiryMonth falls back to '01' for null", () => {
    expect(expiryMonth(null)).toBe("01");
  });

  it("CT-06: expiryYear falls back to '2010' for null", () => {
    expect(expiryYear(null)).toBe("2010");
  });

  it("CT-07: expiryMonth falls back to '01' for an empty string", () => {
    expect(expiryMonth("")).toBe("01");
  });

  it("CT-08: expiryYear falls back to '2010' for an empty string", () => {
    expect(expiryYear("")).toBe("2010");
  });

  it("CT-09: lastFour returns the last four digits of a card number", () => {
    expect(lastFour("4111111111111234")).toBe("1234");
  });
});
