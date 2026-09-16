---
ticket: SWHM-T-0178
sprint: SWHM-S-0016
type: task
---

# Summary — SWHM-T-0178

## What changed

Added `e2e/payment.spec.ts`, the browser-tier coverage for the payment journey: the
approval path (with the in-flight "Authorizing…" state made deterministic via a delayed
`/api/payment/authorize` route), a per-field validation refusal for both an unaccepted
card type and an expired expiry, and a processor decline. Every decision under test
already has unit/screen-tier proof from the three tickets before this one
(SWHM-T-0175/0176/0177) — this ticket adds only the real navigation, the real
`/api/payment/authorize` round trip, and the real "no order exists" check those tiers
cannot perform.

## Files touched

- `e2e/payment.spec.ts` (new) — 4 tests: approval + State B (in-flight), State A
  (unaccepted card type), State A (expired expiry, exact `MM/YYYY` asserted in both the
  field message and the form alert), State C (processor decline).

No file outside this list was touched. `e2e/order.spec.ts`, `payment/`, `src/pages/`
and `routes/api/payment/` are all untouched, per the ticket's ownership boundary.

## Design

Read `openspec/changes/swhm-i-0009-payment-credit-card-processi/design.md` first, then
`artifacts/SWHM-S-0016/design/mockup-checkout-payment-details-validation-and.html` (the
authority for the three states this spec asserts) and its wireframe counterpart. State A's
exact per-field copy ("Select an accepted card type.", "This card expired MM/YYYY.") and
form-level alert ("Check the highlighted fields before submitting.",
"Payment was not authorized: the card expired MM/YYYY. Enter a card with a future expiry
date.") are asserted verbatim from the mockup/`payment/authorize.ts`. State C's decline
copy ("Payment was not authorized. No order was placed and the card was not charged.") has
no literal mockup text (the mockup's own "State C" is an expiry-based validation refusal,
not a processor decline) — asserted against `payment.tsx`'s own `DECLINE_ALERT`, which
`design.md § Decisions` D6 traces to.

The expired-card scenario is reachable through the real form only as a past month within
the current year: `payment.tsx`'s `Expiry year` select never offers a year before the
current one, so that is the one expired combination a shopper can actually pick. Noted in
`pastMonthInCurrentYear()` with an explicit `throw` if the suite ever runs in January,
when no past month exists in the current year either.

## AC coverage

- AC-1 (Card expiry validation — "Expired card is rejected"): test 3 — a past-month
  expiry is refused against `Expiry month`, naming the exact date.
- AC-2 (Card expiry validation — "Valid card expiry is accepted"): test 1 — a future
  expiry authorizes and reaches the confirmation screen.
- AC-3 (Card type acceptance — "Known card type is accepted"): test 1 (an accepted type
  authorizes) and test 2 (leaving the type unselected — the only "unaccepted" state the
  UI's own fixed-option select can reach — is refused against the `Card type` field).
- AC-4 (Payment authorization — "Card is authorized for payment"): test 1 — the real
  `/api/payment/authorize` request is observed in flight (State B) and its approval is
  what reaches order placement; test 4 exercises the same boundary's decline outcome.

## Verification

- `bunx eslint e2e/payment.spec.ts --max-warnings 0` — exit 0.
- `bun run typecheck` — exit 0.
- `bun run test:e2e -- e2e/payment.spec.ts` — failed fast at the `pretest:e2e` Chromium
  preflight (browser not installed in this container — documented `AGENTS.md` limitation,
  observed identically by every E2E ticket in this sprint). Not retried; no browser
  installed.
- `bun run verify` (lint + typecheck + full unit suite) — 619 passed, 0 failed, exit 0
  (unchanged unit-test count; this ticket adds no `*.test.ts`/`*.test.tsx` file).
- CI's first run on this branch (real Chromium) failed for real: 3 tests hit
  `uniqueUsername`'s own `MAX_USERID_LENGTH` guard (labels too long once `Date.now()` is
  appended) and 1 flaked on a real race — `allTextContents()` doesn't auto-wait for the
  `Expiry year` select the way `selectOption()` does, so reading it immediately after
  navigation could catch an empty option list. Fixed both (shorter labels, an explicit
  `waitFor()` before reading the select's options) — no app code touched. CI's second run
  on the fix commit is green (run 35149752951, distinct from the first failing run
  35149448665).

Full detail: `artifacts/SWHM-S-0016/SWHM-T-0178/tdd-test-result.md`.
