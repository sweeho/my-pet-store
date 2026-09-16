import { describe, expect, it } from "vitest";

import { CARD_TYPES } from "../account/vocabulary";
import { isAcceptedCardType } from "./validation";

// AC-3 (Card type acceptance — "Known card type is accepted"): design.md §
// Decisions D2 — this store's own CARD_TYPES stand; the delta spec's Visa /
// MasterCard / American Express illustrative names are not adopted
// (design.md § Spec discrepancies S4).
describe("payment/validation isAcceptedCardType", () => {
  it.each(CARD_TYPES)("CT-01-%s (AC-3): %s is accepted", (cardType) => {
    expect(isAcceptedCardType(cardType)).toBe(true);
  });

  it("CT-02: an unrecognized card type (the delta spec's illustrative Visa) is rejected", () => {
    expect(isAcceptedCardType("Visa")).toBe(false);
  });

  it("CT-03: an empty card type is rejected", () => {
    expect(isAcceptedCardType("")).toBe(false);
  });
});
