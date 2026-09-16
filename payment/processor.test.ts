import { describe, expect, it } from "vitest";

import { DECLINED_LAST_FOUR, stubProcessor } from "./processor";

// AC-1 (Payment authorization — "Card is authorized for payment"): design.md
// § Decisions D5 — no live gateway; a deterministic stub stands in so "a
// request was sent" is observable without a network call, and so a decline
// (mockup's authorization-rejected path) is reproducible in a test (S6, S10).
describe("payment/processor stubProcessor", () => {
  it("PROC-01 (AC-1): approves a card whose last four is not the decline sentinel", () => {
    expect(
      stubProcessor.authorize({ cardType: "Meow Card", lastFour: "1111", expiryDate: "09/2030" }),
    ).toBe("approved");
  });

  it("PROC-02: declines a card whose last four is the documented sentinel", () => {
    expect(
      stubProcessor.authorize({
        cardType: "Meow Card",
        lastFour: DECLINED_LAST_FOUR,
        expiryDate: "09/2030",
      }),
    ).toBe("declined");
  });

  it("PROC-03: the decision depends only on last four — card type and expiry don't change it", () => {
    expect(
      stubProcessor.authorize({
        cardType: "Duke Express",
        lastFour: "9999",
        expiryDate: "01/2031",
      }),
    ).toBe("approved");
  });
});
