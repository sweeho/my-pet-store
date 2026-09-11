import { LANGUAGES } from "../account/vocabulary";
import type { Locale } from "./types";

export const DEFAULT_LOCALE: Locale = "en_US";

export function isSupportedLocale(locale: string): boolean {
  return (LANGUAGES as readonly string[]).includes(locale);
}

// An unsupported locale is not rejected here — D4 (design.md § Planning record):
// the data layer returns null / EMPTY_PAGE for it, never an error.
export function resolveLocale(locale?: string | null): Locale {
  return locale ? locale : DEFAULT_LOCALE;
}
