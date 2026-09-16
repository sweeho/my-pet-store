import { describe, expect, it } from "vitest";

import { createCustomer, findAccount, updateAccount } from "../account/customer";
import type { CardSubmission } from "./types";

// AC-1 (Credit card storage — "Card is stored during checkout"): confirms
// the storage path a card takes through the existing account update path
// rather than building a new one (design.md D1, D8; PLAN.md step 4).
describe("payment/types storage path (AC-1)", () => {
  it("stores card type, expiry, and last four; never the full card number", () => {
    createCustomer("payment-checkout-user");

    const submission: CardSubmission = {
      cardNumber: "4111111111111111",
      cardType: "Java(TM) Card",
      cardholderName: "Jane Doe",
      expiryMonth: "09",
      expiryYear: "2030",
    };

    const stored = updateAccount("payment-checkout-user", {
      card: {
        cardType: submission.cardType,
        expiryDate: `${submission.expiryMonth}/${submission.expiryYear}`,
        cardNumber: submission.cardNumber,
      },
    });

    expect(stored.card).toEqual({
      cardType: "Java(TM) Card",
      expiryDate: "09/2030",
      lastFour: "1111",
    });

    const persisted = findAccount("payment-checkout-user");
    expect(persisted?.card).toEqual(stored.card);
    expect(JSON.stringify(persisted)).not.toContain(submission.cardNumber);
  });
});
