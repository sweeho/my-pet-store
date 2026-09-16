---
ticket: SWHM-T-0175
sprint: SWHM-S-0016
type: task
---

# Summary — SWHM-T-0175

## What changed

Created the `payment/` capability module with the types the next three tickets in this
change code against, and confirmed the storage path a submitted card takes through the
existing account update path. No schema change, no migration, no encryption, no card
number written anywhere — per `design.md § Decisions` D1/D8 and `§ Spec discrepancies`
S1–S3.

## Files touched

- `payment/types.ts` (new) — `CardSubmission` (the transient submitted shape: `cardNumber`,
  `cardType`, `cardholderName`, `expiryMonth`, `expiryYear`, matching the mockup's field
  names) and `StoredCard` (an alias of the existing `account/types.ts` `CardMetadata` —
  imported, never redefined).
- `payment/types.test.ts` (new) — the AC-1 storage-path assertion: a `CardSubmission` run
  through `account/customer.ts`'s existing `updateAccount` stores type, composed expiry,
  and last four; the full card number never appears in the stored or re-read account.
- `vitest.config.ts` — added `payment/**` to the `client` project's `exclude` and
  `payment/**/*.test.ts` to the `server` project's `include`.
- `tsconfig.node.json` — added `payment` to `include`.

No file outside this list was touched. `db/schema.ts`, `drizzle/`, `account/card.ts`,
`account/customer.ts`, `account/vocabulary.ts` and `account/types.ts` are untouched, as the
ticket's ownership boundary requires.

## Design

No screen is built by this ticket (per `PLAN.md § Design reference`). The mockup fields
(`cardNumber`, `cardType`, `cardholderName`, `expiryMonth`, `expiryYear`, confirmed by
grepping `artifacts/SWHM-S-0016/design/mockup-checkout-payment-details.html`) fixed the
shape of `CardSubmission`. The "Encrypted at rest" pill and a persisted cardholder name
shown in the mockups are deliberately not built (S2, S3).

## AC coverage

- AC-1 (Credit card storage — "Card is stored during checkout... the card SHALL be stored
  for authorization"): covered by `payment/types.test.ts`. "Stored" is read as D1 fixes it
  — type, expiry, and last four persisted through the existing `card_metadata` row; the
  submitted number is never persisted anywhere.

## Verification

- `bun run typecheck` — red (missing `payment/types.ts`, `TS2307`) before the file was
  added, green (exit 0) after.
- `bun --bun vitest run payment/types.test.ts --reporter=verbose` — 1 passed, confirmed
  running under the `server` Vitest project.
- `bun run verify` (lint + typecheck + full unit suite) — 578 passed, 0 failed, exit 0.
- `bun run verify:full` — ran `verify` green, then failed fast at the `test:e2e` Chromium
  preflight (browser not installed in this container — documented in `AGENTS.md` § Notes
  from previous agents). No E2E spec was touched by this ticket.

Full detail: `artifacts/SWHM-S-0016/SWHM-T-0175/tdd-test-result.md`.
