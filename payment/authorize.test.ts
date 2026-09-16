import { describe, expect, it } from "vitest";

import type { PaymentProcessor } from "./processor";
import { authorizeCard } from "./authorize";
import type { CardSubmission } from "./types";

// AC-1 (Payment authorization): validates through SWHM-T-0176's functions
// first, and only then calls the processor boundary — a validation failure
// must never reach it (design.md § Decisions D5, D6; PLAN.md step 3).
function submission(overrides: Partial<CardSubmission> = {}): CardSubmission {
  return {
    cardNumber: "4111111111111111",
    cardType: "Meow Card",
    cardholderName: "Jane Doe",
    expiryMonth: "09",
    expiryYear: "2030",
    ...overrides,
  };
}

function neverCalledProcessor(): PaymentProcessor {
  return {
    authorize() {
      throw new Error("test bug: the processor must not be called for an invalid submission");
    },
  };
}

describe("payment/authorize authorizeCard", () => {
  it("AUTH-01 (AC-1): an accepted card type, present number and future expiry reaches the processor and is approved", () => {
    const result = authorizeCard(submission(), { authorize: () => "approved" });
    expect(result).toEqual({ status: "approved" });
  });

  it("AUTH-02: the processor sees the reduced last four, never the full card number", () => {
    let seenLastFour: string | undefined;
    authorizeCard(submission({ cardNumber: "4111111111111234" }), {
      authorize: (request) => {
        seenLastFour = request.lastFour;
        return "approved";
      },
    });
    expect(seenLastFour).toBe("1234");
  });

  it("AUTH-03: a card the processor declines is reported as declined", () => {
    const result = authorizeCard(submission(), { authorize: () => "declined" });
    expect(result).toEqual({ status: "declined" });
  });

  it("AUTH-04: an unrecognized card type is refused before the processor is reached", () => {
    const result = authorizeCard(submission({ cardType: "Visa" }), neverCalledProcessor());
    expect(result).toEqual({
      status: "invalid",
      field: "cardType",
      message: "Select an accepted card type.",
      alert: "Check the highlighted fields before submitting.",
    });
  });

  it("AUTH-05: a missing card number is refused before the processor is reached", () => {
    const result = authorizeCard(submission({ cardNumber: "" }), neverCalledProcessor());
    expect(result).toEqual({
      status: "invalid",
      field: "cardNumber",
      message: "Card number is required.",
      alert: "Check the highlighted fields before submitting.",
    });
  });

  it("AUTH-06: a missing expiry is refused before the processor is reached", () => {
    const result = authorizeCard(
      submission({ expiryMonth: "", expiryYear: "" }),
      neverCalledProcessor(),
    );
    expect(result).toEqual({
      status: "invalid",
      field: "expiryMonth",
      message: "Expiry month and year are required.",
      alert: "Check the highlighted fields before submitting.",
    });
  });

  it("AUTH-07: an expired card is refused before the processor is reached, naming the expiry in both messages", () => {
    const result = authorizeCard(
      submission({ expiryMonth: "03", expiryYear: "2024" }),
      neverCalledProcessor(),
    );
    expect(result).toEqual({
      status: "invalid",
      field: "expiryMonth",
      message: "This card expired 03/2024.",
      alert:
        "Payment was not authorized: the card expired 03/2024. Enter a card with a future expiry date.",
    });
  });

  it("AUTH-08: the default export uses the deterministic stub processor, not a hand-rolled network call", () => {
    const result = authorizeCard(submission({ cardNumber: "4000000000000002" }));
    expect(result).toEqual({ status: "declined" });
  });
});
