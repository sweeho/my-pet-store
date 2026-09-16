import { lastFour } from "../account/card";
import { checkExpiry } from "./expiry";
import { stubProcessor, type PaymentProcessor } from "./processor";
import type { CardSubmission } from "./types";
import { isAcceptedCardType } from "./validation";

// `alert` carries the form-level message (DESIGN.md § Form validation
// states); `message` carries the field-level one beneath the offending
// control. Both are fixed by the mockup — the generic refusal for an
// unaccepted type or a missing field (State A), the specific one for an
// expired card (State C, mockup-checkout-payment-details-validation-and.html).
const GENERIC_REFUSAL_ALERT = "Check the highlighted fields before submitting.";

export type AuthorizeField = "cardType" | "cardNumber" | "expiryMonth";

export type AuthorizeResult =
  | { status: "invalid"; field: AuthorizeField; message: string; alert: string }
  | { status: "approved" }
  | { status: "declined" };

// Validates through SWHM-T-0176's functions first, and only then calls the
// processor boundary — a validation failure must never reach it (design.md
// § Decisions D5, D6; PLAN.md step 3). Checked in the form's field order
// (type, number, expiry) and reports one problem at a time, matching
// order/validation.ts's own standing convention.
export function authorizeCard(
  submission: CardSubmission,
  processor: PaymentProcessor = stubProcessor,
): AuthorizeResult {
  if (!isAcceptedCardType(submission.cardType)) {
    return {
      status: "invalid",
      field: "cardType",
      message: "Select an accepted card type.",
      alert: GENERIC_REFUSAL_ALERT,
    };
  }

  if (!submission.cardNumber.trim()) {
    return {
      status: "invalid",
      field: "cardNumber",
      message: "Card number is required.",
      alert: GENERIC_REFUSAL_ALERT,
    };
  }

  const expiry = checkExpiry(submission.expiryMonth, submission.expiryYear);
  if (expiry.status === "missing") {
    return {
      status: "invalid",
      field: "expiryMonth",
      message: "Expiry month and year are required.",
      alert: GENERIC_REFUSAL_ALERT,
    };
  }
  if (expiry.status === "expired") {
    const expiryLabel = `${expiry.month}/${expiry.year}`;
    return {
      status: "invalid",
      field: "expiryMonth",
      message: `This card expired ${expiryLabel}.`,
      alert: `Payment was not authorized: the card expired ${expiryLabel}. Enter a card with a future expiry date.`,
    };
  }

  const decision = processor.authorize({
    cardType: submission.cardType,
    lastFour: lastFour(submission.cardNumber),
    expiryDate: `${submission.expiryMonth}/${submission.expiryYear}`,
  });

  return { status: decision };
}
