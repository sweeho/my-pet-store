---
ticket: SWHM-T-0176
sprint: SWHM-S-0016
type: task
---

# TDD result — SWHM-T-0176

## Test cases

| #     | Case                                                                                                                                                                                                                                 | AC   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| EX-01 | `payment/expiry.test.ts` — a far-future month/year (`05/2030` against `2026-09-16`) is `valid`.                                                                                                                                      | AC-2 |
| EX-02 | A past year (`09/2024`) is `expired`, carrying the raw month/year back.                                                                                                                                                              | AC-1 |
| EX-03 | A past month in the current year (`08/2026`) is `expired`.                                                                                                                                                                           | AC-1 |
| EX-04 | The current month (`09/2026`) is still `valid` — the boundary is inclusive, not "before today".                                                                                                                                      | DoD  |
| EX-05 | The month right after the current one (`10/2026`) is `valid`.                                                                                                                                                                        | DoD  |
| EX-06 | An empty month and year is `missing`, not `expired`.                                                                                                                                                                                 | DoD  |
| EX-07 | An out-of-range month (`13`) is `missing`, not `expired`.                                                                                                                                                                            | DoD  |
| EX-08 | A non-numeric year (`abcd`) is `missing`, not `expired`.                                                                                                                                                                             | DoD  |
| EX-09 | A zero month (`00`) is `missing`, not `expired`.                                                                                                                                                                                     | DoD  |
| CT-01 | `payment/validation.test.ts` — every entry of `account/vocabulary.ts`'s `CARD_TYPES` (`Java(TM) Card`, `Duke Express`, `Meow Card`) is accepted, driven from the imported constant so a future list change is covered automatically. | AC-3 |
| CT-02 | The delta spec's illustrative `"Visa"` is rejected — this store's list, not the extracted brand names, governs (design.md S4).                                                                                                       | AC-3 |
| CT-03 | An empty card type is rejected.                                                                                                                                                                                                      | AC-3 |

## Red run

Neither `payment/expiry.ts` nor `payment/validation.ts` existed yet:

```
$ bun --bun vitest run payment/expiry.test.ts payment/validation.test.ts
 FAIL  |server| payment/validation.test.ts [ payment/validation.test.ts ]
Error: Cannot find module './validation' imported from /workspace/repo/payment/validation.test.ts
 FAIL  |server| payment/expiry.test.ts [ payment/expiry.test.ts ]
Error: Cannot find module './expiry' imported from /workspace/repo/payment/expiry.test.ts
Test Files  2 failed (2)
     Tests  no tests
```

Exit code: 1.

## Green run

After writing `payment/expiry.ts` (`checkExpiry`) and `payment/validation.ts`
(`isAcceptedCardType`):

```
$ bun --bun vitest run payment/expiry.test.ts payment/validation.test.ts
Test Files  2 passed (2)
     Tests  14 passed (14)
```

Exit code: 0. (14 tests: the 9 `checkExpiry` cases above plus the 5 `it.each` runs the
3-entry `CARD_TYPES` table plus CT-02/CT-03 produce for `isAcceptedCardType`.)

Full pre-commit gate (`bun run verify` — lint + typecheck + the complete unit suite, not
just the tests touched by this ticket):

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
Test Files  94 passed (94)
     Tests  592 passed (592)
```

Exit code: 0.

`bun run verify:full` was also attempted; it ran `verify` (green, as above) then failed
fast at the `pretest:e2e` Chromium preflight — `[test:e2e] Playwright's Chromium browser
is not installed`. This is the documented container limitation (`AGENTS.md` § Notes from
previous agents — "Implementation containers do not ship a Chromium"), not a regression
from this change. No E2E spec was added or changed by this ticket; the browser tier is
exercised in CI and at INTEGRATION_QA.

TDD-RESULT: 592 passed, 0 failed
