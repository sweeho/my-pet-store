import { CARD_TYPES, CATEGORIES, LANGUAGES } from "./vocabulary";
import type { AccountUpdate } from "./types";

export class AccountValidationError extends Error {}

// Language and category are enforced server side because those vocabularies
// are complete and read back as behaviour. State and country are not: they
// are the legacy form's dropdown options only (design.md D6).
export function validateAccountUpdate(update: AccountUpdate): void {
  const language = update.profile?.preferredLanguage;
  if (language !== undefined && !(LANGUAGES as readonly string[]).includes(language)) {
    throw new AccountValidationError(`Unsupported language: ${language}`);
  }

  const category = update.profile?.favoriteCategory;
  if (
    category !== undefined &&
    category !== null &&
    !(CATEGORIES as readonly string[]).includes(category)
  ) {
    throw new AccountValidationError(`Unsupported category: ${category}`);
  }

  const cardType = update.card?.cardType;
  if (
    cardType !== undefined &&
    cardType !== null &&
    !(CARD_TYPES as readonly string[]).includes(cardType)
  ) {
    throw new AccountValidationError(`Unsupported card type: ${cardType}`);
  }
}
