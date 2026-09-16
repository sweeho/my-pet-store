---
ticket: SWHM-T-0176
sprint: SWHM-S-0016
type: task
---

# Summary — SWHM-T-0176

## What changed

Added the two pure decision functions that determine whether a submitted card may be
used: an expiry check and a card-type check. Neither reads the database or talks to a
processor — both are exercised entirely through their unit tests. Per `design.md §
Decisions` D4, the expiry check has three outcomes (`valid` / `missing` / `expired`) so a
card with no expiry at all is never reported as expired. Per D2, the card-type check
imports `CARD_TYPES` from `account/vocabulary.ts` rather than redefining it, so the store's
accepted list (`Java(TM) Card`, `Duke Express`, `Meow Card`) stays written down in exactly
one place.

## Files touched

- `payment/expiry.ts` (new) — `checkExpiry(expiryMonth, expiryYear, now?)` returns
  `{ status: "valid" }`, `{ status: "missing" }`, or `{ status: "expired", month, year }`.
  Parses the raw fields itself rather than going through `account/card.ts`'s
  `expiryMonth()`/`expiryYear()` accessors, whose `01`/`2010` fallback collapses "missing"
  into what looks like "expired".
- `payment/expiry.test.ts` (new) — EX-01..EX-09: future/past/current-month boundary cases
  for `valid`/`expired`, and empty/out-of-range/non-numeric cases for `missing`.
- `payment/validation.ts` (new) — `isAcceptedCardType(cardType)`, a boolean check against
  `CARD_TYPES`.
- `payment/validation.test.ts` (new) — CT-01 (each of the store's three accepted types,
  driven from the imported `CARD_TYPES` constant), CT-02 (the delta spec's illustrative
  `"Visa"` is rejected), CT-03 (empty string rejected).

No file outside this list was touched. `account/card.ts`, `account/vocabulary.ts` and
`account/validation.ts` are untouched, as the ticket's ownership boundary requires;
`CARD_TYPES` still has exactly one definition in the repository. `payment/**` was already
registered in `vitest.config.ts` and `tsconfig.node.json` by SWHM-T-0175, so no config
change was needed here.

## Design

This ticket produces decisions, not UI — no screen is built (`PLAN.md § Design reference`,
`PLAN.md` step 5 note: "SWHM-T-0177 renders them"). I read both "validation and
authorization states" mockup/wireframe files under `artifacts/SWHM-S-0016/design/` to
confirm the three-outcome shape the rendered messages will need: State A shows a
distinct "Expiry month and year are required." (missing) versus State C's "This card
expired 03/2024." (expired, carrying the month/year back) — matching this module's
`missing`/`expired` split. State A's "Select an accepted card type." confirms card-type
refusal is a simple accept/reject, matching `isAcceptedCardType`'s boolean return.

## AC coverage

- AC-1 (Card expiry validation — "Expired card is rejected"): `payment/expiry.test.ts`
  EX-02, EX-03 — a past year and a past month in the current year both resolve to
  `expired`.
- AC-2 (Card expiry validation — "Valid card expiry is accepted"): EX-01, EX-04, EX-05 —
  a future date, the current month, and the month after all resolve to `valid`.
- AC-3 (Card type acceptance — "Known card type is accepted"): `payment/validation.test.ts`
  CT-01 — every entry of the store's `CARD_TYPES` resolves to `true`.

## Verification

- `bun --bun vitest run payment/expiry.test.ts payment/validation.test.ts` — red (module
  not found) before the two modules were written, green (14 passed) after.
- `bun run verify` (lint + typecheck + full unit suite) — 592 passed, 0 failed, exit 0.
- `bun run verify:full` — ran `verify` green, then failed fast at the `test:e2e` Chromium
  preflight (browser not installed in this container — documented in `AGENTS.md` § Notes
  from previous agents). No E2E spec was touched by this ticket.

Full detail: `artifacts/SWHM-S-0016/SWHM-T-0176/tdd-test-result.md`.
