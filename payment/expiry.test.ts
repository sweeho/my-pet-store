import { describe, expect, it } from "vitest";

import { checkExpiry } from "./expiry";

// AC-1 (Card expiry validation — "Expired card is rejected") and AC-2
// ("Valid card expiry is accepted"): design.md § Decisions D4 — a missing or
// malformed expiry is a third outcome, not folded into "expired" the way
// account/card.ts's 01/2010 fallback would (design.md § Codebase findings F3).
describe("payment/expiry checkExpiry", () => {
  const now = new Date(2026, 8, 16); // 2026-09-16

  it("EX-01 (AC-2): a future expiry is valid", () => {
    expect(checkExpiry("05", "2030", now)).toEqual({ status: "valid" });
  });

  it("EX-02 (AC-1): a past-year expiry is expired", () => {
    expect(checkExpiry("09", "2024", now)).toEqual({
      status: "expired",
      month: "09",
      year: "2024",
    });
  });

  it("EX-03 (AC-1): a past month in the current year is expired", () => {
    expect(checkExpiry("08", "2026", now)).toEqual({
      status: "expired",
      month: "08",
      year: "2026",
    });
  });

  it("EX-04: the current month is still valid through its end", () => {
    expect(checkExpiry("09", "2026", now)).toEqual({ status: "valid" });
  });

  it("EX-05: the month right after the current one is valid", () => {
    expect(checkExpiry("10", "2026", now)).toEqual({ status: "valid" });
  });

  it("EX-06: an empty month and year is missing, not expired", () => {
    expect(checkExpiry("", "", now)).toEqual({ status: "missing" });
  });

  it("EX-07: an out-of-range month is missing, not expired", () => {
    expect(checkExpiry("13", "2026", now)).toEqual({ status: "missing" });
  });

  it("EX-08: a non-numeric year is missing, not expired", () => {
    expect(checkExpiry("09", "abcd", now)).toEqual({ status: "missing" });
  });

  it("EX-09: a zero month is missing, not expired", () => {
    expect(checkExpiry("00", "2026", now)).toEqual({ status: "missing" });
  });
});
