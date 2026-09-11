// Expiry is stored as "MM/YYYY". Fallbacks match the legacy accessors this
// replaces: getExpiryMonth()/getExpiryYear() default to "01"/"2010" for a
// missing or malformed value (design.md D1, S4).
const DEFAULT_MONTH = "01";
const DEFAULT_YEAR = "2010";

export function expiryMonth(expiryDate: string | null): string {
  if (!expiryDate) return DEFAULT_MONTH;
  const separatorIndex = expiryDate.indexOf("/");
  return separatorIndex > 0 ? expiryDate.slice(0, separatorIndex) : DEFAULT_MONTH;
}

export function expiryYear(expiryDate: string | null): string {
  if (!expiryDate) return DEFAULT_YEAR;
  const separatorIndex = expiryDate.indexOf("/");
  return separatorIndex > 0 ? expiryDate.slice(separatorIndex + 1) : DEFAULT_YEAR;
}

export function lastFour(cardNumber: string): string {
  return cardNumber.slice(-4);
}
