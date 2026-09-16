// Expiry decision over a card submission's raw month/year fields (design.md
// § Decisions D4, PLAN.md step 2). Deliberately does not go through
// account/card.ts's expiryMonth()/expiryYear() accessors: those fall back
// to "01"/"2010" for a missing or malformed value (account/card.ts, design.md
// § Codebase findings F3), which would make a card with no expiry at all
// read as expired — a different, wrong message to show a shopper. This
// module keeps "missing" a distinct third outcome instead.
export type ExpiryCheck =
  | { status: "valid" }
  | { status: "missing" }
  | { status: "expired"; month: string; year: string };

function parsePart(value: string, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= max ? parsed : null;
}

// A card is valid through the end of its expiry month, so the comparison is
// against the first day of the following month, not today's date directly.
export function checkExpiry(
  expiryMonth: string,
  expiryYear: string,
  now: Date = new Date(),
): ExpiryCheck {
  const month = parsePart(expiryMonth, 12);
  const year = parsePart(expiryYear, 9999);
  if (month === null || year === null) {
    return { status: "missing" };
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isPast = year < currentYear || (year === currentYear && month < currentMonth);
  if (isPast) {
    return { status: "expired", month: expiryMonth, year: expiryYear };
  }

  return { status: "valid" };
}
