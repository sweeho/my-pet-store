---
ticket: SWHM-T-0178
sprint: SWHM-S-0016
type: task
---

# TDD result — SWHM-T-0178

## Test cases

| #   | Case                                                                                                                                                                                                                                                                                                                      | AC               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | `e2e/payment.spec.ts` — a signed-on shopper with a populated cart reaches `/payment`, submits an accepted card type with a future expiry; the in-flight submit is observed deterministically (a delayed `**/api/payment/authorize` route, State B), then the shopper lands on `/order-completed` with a visible order id. | AC-2, AC-3, AC-4 |
| 2   | An unselected ("not accepted") card type is refused against the `Card type` control specifically (`aria-invalid="true"`, "Select an accepted card type." beneath it, plus the form-level "Check the highlighted fields before submitting." alert — State A); the cart still holds its item afterwards (no order placed).  | AC-3             |
| 3   | An expiry in a past month of the current year (the only expired date the form's own `Expiry year` select can reach) is refused against `Expiry month` specifically, naming the exact `MM/YYYY` in both the field message and the form-level alert (State A); the cart still holds its item afterwards.                    | AC-1             |
| 4   | A card number ending in the stub processor's decline sentinel (`0002`, otherwise valid, accepted, unexpired) leaves the shopper on `/payment` with "Payment was not authorized. No order was placed and the card was not charged." (State C); the cart still holds its item afterwards.                                   | AC-4             |

This ticket is browser-tier coverage only — every decision under test already has
red→green unit/screen-tier proof from the tickets that implemented it
(`payment/expiry.test.ts`, `payment/validation.test.ts`, `payment/authorize.test.ts`,
`payment/processor.test.ts`, `routes/api/payment/authorize.post.test.ts`,
`src/pages/payment.test.tsx`). There is no unit-level red/green cycle to record; the
red→green cycle this ticket actually ran is CI's first real execution of the spec
failing, then passing after two fixes — recorded below (same shape as
`artifacts/SWHM-S-0013/SWHM-T-0142/tdd-test-result.md`, the precedent for an E2E-only
ticket in this repository).

## Red run

Chromium is genuinely not installed in this container (confirmed by the preflight, not
assumed):

```
$ bun run test:e2e -- e2e/payment.spec.ts
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Documented `AGENTS.md` § Notes from previous agents limitation, observed identically by
every E2E ticket in this sprint. Per `PLAN.md` step 7, not retried, no browser
installed. `bunx eslint e2e/payment.spec.ts --max-warnings 0` and `bun run typecheck`
both passed clean against the new file before it was pushed.

CI's first run on this branch (a real Chromium, `design.md` § Codebase findings F10)
executed all 40 assertions across the 4 tests: 37 passed, 3 failed for real, 1 flaked
(https://github.com/sweeho/my-pet-store/actions/runs/35149448665):

```
1) an unaccepted card type is refused... (AC-3)
   Error: test bug: username "payment-type-1789592234454" exceeds MAX_USERID_LENGTH (25) — shorten label
2) an expired card is refused... (AC-1)
   Error: test bug: username "payment-expired-1789592235151" exceeds MAX_USERID_LENGTH (25) — shorten label
3) a processor decline leaves the shopper...
   Error: test bug: username "payment-decline-1789592237076" exceeds MAX_USERID_LENGTH (25) — shorten label
4) an accepted card... (flaky, passed on retry)
   Error: locator.selectOption: options[0]: expected object, got undefined
     at fillCardFields (e2e/payment.spec.ts:125) — card.expiryYear was undefined
```

Two genuine test bugs, not product bugs:

1. `uniqueUsername("payment-type")` / `"payment-expired"` / `"payment-decline")` each
   produce a `${label}-${Date.now()}` string longer than `MAX_USERID_LENGTH` (25) once
   the 13-digit timestamp is appended — the same guard `e2e/order.spec.ts`'s own
   `uniqueUsername` throws on, just never tripped by this file's own labels until CI
   ran it for real.
2. `expiryYearOptionTexts` read `.locator("option").allTextContents()` on the `Expiry
year` select immediately after `reachPaymentStep`'s navigation. Unlike
   `selectOption()`, `allTextContents()` does not auto-wait for the element to attach —
   reading it before React committed the payment form's first render raced and
   returned an empty option list, so `years[years.length - 1]` was `undefined`.

Fixed by shortening the four labels to `"pay-ok"` / `"pay-type"` / `"pay-expired"` /
`"pay-decline"` (all ≤ 11 chars, matching `e2e/order.spec.ts`'s own short-label
convention) and by adding `await select.waitFor()` before reading the year select's
option texts. No app code changed.

## Green run

`bunx eslint e2e/payment.spec.ts --max-warnings 0` and `bun run typecheck` — both exit 0
after the fix.

CI's second run on this branch, on the fix commit, reported a green verdict for the
full suite, `e2e/payment.spec.ts`'s 4 tests included
(https://github.com/sweeho/my-pet-store/actions/runs/35149752951, confirmed via
`gh run list` — `completed success`, distinct run id from the first, not a stale
verdict).

Full pre-commit gate (`bun run verify` — lint + typecheck + the complete unit suite),
run after the fix:

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
Test Files  98 passed (98)
     Tests  619 passed (619)
```

Exit code: 0. No unit test count changed as a result of this ticket (it adds no
`*.test.ts`/`*.test.tsx` file) — 619 is this branch's existing full unit-tier count,
confirmed still green.

TDD-RESULT: 619 passed, 0 failed
