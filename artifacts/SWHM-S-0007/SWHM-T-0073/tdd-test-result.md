---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0073
branch: vortex/feat/SWHM-T-0073-database-schema-pin-the-per-locale-detai-9672e88b
upstream: [artifacts/SWHM-S-0007/SWHM-T-0073/PLAN.md]
---

# TDD result — SWHM-T-0073

## Test cases

| Test                                          | Covers | Intent                                                                                                         |
| --------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `catalog/seed.test.ts › ST-08`                | AC-2   | every product has `product_details` for `en_US` + `ja_JP`; every item has `item_details` for `en_US` + `ja_JP` |
| `catalog/seed.test.ts › ST-09`                | AC-3   | no product or item carries a `zh_CN` details row                                                               |
| `catalog/seed.test.ts › ST-02` (pre-existing) | AC-1   | confirms DOGS' `ja_JP` name is still 犬 — unchanged by this ticket                                             |

AC-4 (schema/`drizzle/` byte-identical) and AC-5 (test placement in Vitest's `server` project) are
structural constraints verified by inspection, not by a test case — see `summary.md`.

## Red run

The seed data (`catalog/seed.ts`) is already correct — this ticket adds an assertion, not a fix — so
ST-08/ST-09 pass immediately against the real fixture and there is no natural red state to capture
from the ticket's own change. To prove the new assertions actually catch a violation, `catalog/seed.ts`
was temporarily mutated (removed the `ja_JP` detail from `BIRDS-PARROTS`, added a bogus `zh_CN` detail
to the same product) and the scoped suite run, then the mutation was reverted (confirmed via
`git diff catalog/seed.ts` showing no diff) before any other step.

`bun run test -- catalog/seed.test.ts` (against the mutated seed):

```
 FAIL  |server| catalog/seed.test.ts > catalog/seed > ST-08: every product has product_details rows for both en_US and ja_JP, and every item has item_details rows for both
AssertionError: expected [ 'en_US', 'zh_CN' ] to deeply equal [ 'en_US', 'ja_JP' ]

 FAIL  |server| catalog/seed.test.ts > catalog/seed > ST-09: no zh_CN row exists for any product or item
AssertionError: expected [ Array(1) ] to deeply equal []

 Test Files  1 failed (1)
      Tests  2 failed | 7 passed (9)
```

## Green run

`bun run verify:full` — E2E preflight reports Chromium genuinely missing in this container
(`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"), a known gap for
implementation containers (see `AGENTS.md` § Notes from previous agents). Falling back to
`bun run verify` (lint + typecheck + full unit suite) per that documented policy.

`bun run verify` (against the real, unmutated seed):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  51 passed (51)
      Tests  252 passed (252)
```

TDD-RESULT: 252 passed, 0 failed
