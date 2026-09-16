---
ticket: SWHM-T-0177
sprint: SWHM-S-0016
type: task
---

# TDD result — SWHM-T-0177

## Test cases

| #   | File                                         | Case                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | AC   |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | `payment/processor.test.ts`                  | PROC-01/02/03 — the stub approves any card whose last four isn't the decline sentinel `0002`, declines one that is, and the decision depends only on last four.                                                                                                                                                                                                                                                                                                                    | AC-1 |
| 2   | `payment/authorize.test.ts`                  | AUTH-01/02 — a valid submission reaches the injected processor and is approved; the processor sees only the reduced last four, never the full number.                                                                                                                                                                                                                                                                                                                              | AC-1 |
| 3   | `payment/authorize.test.ts`                  | AUTH-03 — a processor decline is reported as `{ status: "declined" }`.                                                                                                                                                                                                                                                                                                                                                                                                             | AC-1 |
| 4   | `payment/authorize.test.ts`                  | AUTH-04/05/06/07 — an unaccepted type, a missing number, a missing expiry, and an expired card are each refused with the mockup's exact field + alert copy, before a test processor that throws if called (the injected processor is never invoked).                                                                                                                                                                                                                               | AC-1 |
| 5   | `payment/authorize.test.ts`                  | AUTH-08 — the default export uses the deterministic stub, not a hand-rolled network call.                                                                                                                                                                                                                                                                                                                                                                                          | AC-1 |
| 6   | `routes/api/payment/authorize.post.test.ts`  | AP-01 — unauthenticated → 401. AP-02 (AC-1) — a valid card from a signed-on shopper is approved. AP-03 — a declined card gets 200 (a business outcome, not a request error). AP-04/05 — invalid type / expired card get 400 with `{error, field, alert}`.                                                                                                                                                                                                                          | AC-1 |
| 7   | `auth/protected-resources.test.ts`           | PR-03/04 (AC-1) — `/payment` and `/api/payment` are registered protected resources with no role requirement.                                                                                                                                                                                                                                                                                                                                                                       | AC-1 |
| 8   | `src/pages/enter-order-information.test.tsx` | EOI-13/14/15 — rewritten for the new submit path: a fully valid submission navigates to `/payment` carrying `{billingAddress, shippingAddress}` with no fetch; a refused submission (client-side, via the same `order/validation.ts` the server runs) shows the field + form alert and never navigates; entered values survive a refusal. EOI-16 (the old empty-cart-at-this-step case) removed — that guard only fires once `/api/order` is called, which no longer happens here. | —    |
| 9   | `src/pages/payment.test.tsx`                 | PAY-01 — no navigation state → redirect to `/enter-order-information`. PAY-02/03/04/05 — renders the three sections, the store's own `CARD_TYPES` (not the mockup's Visa/MasterCard/Amex), the cart-derived summary and billing recap, and a loading indicator.                                                                                                                                                                                                                    | AC-1 |
| 10  | `src/pages/payment.test.tsx`                 | PAY-06 (AC-1) — an accepted card authorizes, then calls `POST /api/order` with the unchanged `{billingAddress, shippingAddress}` shape, then navigates to `/order-completed`.                                                                                                                                                                                                                                                                                                      | AC-1 |
| 11  | `src/pages/payment.test.tsx`                 | PAY-07 (State A) / PAY-08 (State C-as-decline) / PAY-09 (State B) — a validation refusal shows the field + form alert and never calls `/api/order`; a decline shows the decline alert and never calls `/api/order`; while authorizing, the submit control reads "Authorizing…", is disabled, and a `role="status"` line is shown.                                                                                                                                                  | AC-1 |
| 12  | `src/pages/payment.test.tsx`                 | PAY-10 — an empty-cart refusal from the deferred `/api/order` call redirects to `/cart` flagged, exactly as `enter-order-information.tsx` used to do itself.                                                                                                                                                                                                                                                                                                                       | —    |
| 13  | `e2e/order.spec.ts`                          | Updated (not run here — no browser in this container, see Green run): the happy-path journey (both orders) and the empty-cart journey now fill and submit the payment step before reaching their outcome; the bad-email journey is untouched, since that refusal is now caught client-side before ever leaving the order form.                                                                                                                                                     | AC-1 |

## Red run

Each new module/route/page was red before it existed, confirmed individually:

```
$ bun --bun vitest run payment/processor.test.ts
Error: Cannot find module './processor' imported from payment/processor.test.ts

$ bun --bun vitest run payment/authorize.test.ts
Error: Cannot find module './authorize' imported from payment/authorize.test.ts

$ bun --bun vitest run routes/api/payment/authorize.post.test.ts
Error: Cannot find module './authorize.post' imported from routes/api/payment/authorize.post.test.ts

$ bun --bun vitest run auth/protected-resources.test.ts
AssertionError: expected undefined to be defined   (PR-03, PR-04 — entries not yet added)
2 failed | 2 passed (4)

$ bun --bun vitest run src/pages/enter-order-information.test.tsx
Error: unexpected fetch: /api/order   (old handleSubmit still POSTed directly)
3 failed | 12 passed (15)

$ bun --bun vitest run src/pages/payment.test.tsx
Error: Failed to resolve import "./payment" from "src/pages/payment.test.tsx"
```

All exit non-zero, each for the expected reason (missing module, missing registry entry, or old behaviour not yet replaced), before the corresponding source file was written or edited.

## Green run

After writing `payment/processor.ts`, `payment/authorize.ts`, `routes/api/payment/authorize.post.ts`, the two `auth/protected-resources.ts` entries, the rewritten `src/pages/enter-order-information.tsx` submit path, and `src/pages/payment.tsx`:

```
$ bun --bun vitest run payment/processor.test.ts        → 3 passed
$ bun --bun vitest run payment/authorize.test.ts         → 8 passed
$ bun --bun vitest run routes/api/payment/authorize.post.test.ts → 5 passed
$ bun --bun vitest run auth/protected-resources.test.ts  → 4 passed
$ bun --bun vitest run src/pages/enter-order-information.test.tsx → 15 passed
$ bun --bun vitest run src/pages/payment.test.tsx        → 10 passed
```

Full pre-commit gate (`bun run verify` — lint + typecheck + the complete unit suite, not just the tests touched by this ticket):

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
Test Files  98 passed (98)
Tests  619 passed (619)
```

Exit code: 0.

`bun run verify:full` was attempted; `verify` ran green as above, then it failed fast at the `pretest:e2e` Chromium preflight — `[test:e2e] Playwright's Chromium browser is not installed`. This is the documented container limitation (`AGENTS.md` § Notes from previous agents — "Implementation containers do not ship a Chromium"), not a regression from this change. `e2e/order.spec.ts` was updated (see Test cases #13) but could not be executed here; it runs in CI and at INTEGRATION_QA, both of which have a real Chromium.

TDD-RESULT: 619 passed, 0 failed
