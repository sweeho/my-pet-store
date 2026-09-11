// Verbatim from the delta spec (openspec/changes/swhm-i-0003-customer-account-profile-man).
// Shared by the server validator (account/validation.ts) and the form's options
// (SWHM-T-0036), so there is exactly one list per vocabulary.
export const LANGUAGES = ["en_US", "ja_JP", "zh_CN"] as const;
export const CATEGORIES = ["BIRDS", "CATS", "DOGS", "FISH", "REPTILES"] as const;
export const CARD_TYPES = ["Java(TM) Card", "Duke Express", "Meow Card"] as const;

// Form options only — not enforced server side (INTERFACES.md, design.md D6).
export const STATES = ["California", "New York", "Texas"] as const;
export const COUNTRIES = ["USA", "Canada", "Japan", "China"] as const;

export const STATUSES = ["active", "disabled"] as const;
