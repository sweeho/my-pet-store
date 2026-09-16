// Card-type decision (design.md § Decisions D2, PLAN.md step 4). Imports
// CARD_TYPES from account/vocabulary.ts rather than redefining it, so the
// accepted types stay written down in exactly one place — this store's own
// list, not the delta spec's illustrative Visa/MasterCard/American Express
// (design.md § Spec discrepancies S4).
import { CARD_TYPES } from "../account/vocabulary";

export function isAcceptedCardType(cardType: string): boolean {
  return (CARD_TYPES as readonly string[]).includes(cardType);
}
