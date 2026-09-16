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
`src/pages/payment.test.tsx`). There is no unit-level red/green cycle to record here;
the cycle this ticket runs is "spec doesn't exist" → "spec exists, passes in a real
browser".

## Red run

Before `e2e/payment.spec.ts` existed, the payment journey had zero browser-tier
coverage — no file to run. The nearest applicable "red" signal is the same one every
E2E-only ticket in this sprint has recorded: the spec file did not exist, so
`bun run test:e2e -- e2e/payment.spec.ts` had nothing to execute.

## Green run

`bun --bun eslint e2e/payment.spec.ts --max-warnings 0` — exit 0 (via `bunx`, no
warnings).

`bun run typecheck`:

```
$ node scripts/ensure-generated-files.mjs
$ tsc --build
```

Exit code: 0.

`bun run test:e2e -- e2e/payment.spec.ts`:

```
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

This container has no Chromium — the documented limitation recorded in `AGENTS.md` §
Notes from previous agents ("Implementation containers do not ship a Chromium"),
observed identically by SWHM-T-0016, 0018, 0020, 0022, 0023, 0024 and 0177 in this same
sprint. Per `PLAN.md` step 7, this was not retried and no browser was installed; the
spec's real execution is the CI run on this branch, which has a real Chromium
(`design.md` § Codebase findings F10).

Full pre-commit gate (`bun run verify` — lint + typecheck + the complete unit suite):

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
confirmed still green after adding the new E2E spec.

CI verdict on this branch, which does run `e2e/payment.spec.ts` in a browser-equipped
runner: recorded in the ticket comment via `a2a_await_ci` before transitioning to done.

TDD-RESULT: 619 passed, 0 failed
