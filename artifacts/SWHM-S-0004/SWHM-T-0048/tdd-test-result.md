---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0048
branch: vortex/feat/SWHM-T-0048-catalog-localization-and-demo-seed-505b0ce4
upstream: [artifacts/SWHM-S-0004/SWHM-T-0048/PLAN.md]
---

# TDD result — SWHM-T-0048

## Test cases

| Test                             | Covers     | Intent                                                                    |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `catalog/locale.test.ts › LT-01` | AC-3       | `DEFAULT_LOCALE` is `en_US`                                               |
| `catalog/locale.test.ts › LT-02` | AC-3       | every locale in `account/vocabulary`'s `LANGUAGES` is supported           |
| `catalog/locale.test.ts › LT-03` | AC-3, AC-4 | `de_DE` is not supported                                                  |
| `catalog/locale.test.ts › LT-04` | AC-3       | an absent locale resolves to `DEFAULT_LOCALE`                             |
| `catalog/locale.test.ts › LT-05` | AC-3       | an empty-string locale resolves to `DEFAULT_LOCALE`                       |
| `catalog/locale.test.ts › LT-06` | AC-3       | a supported locale passes through unchanged                               |
| `catalog/locale.test.ts › LT-07` | AC-4       | an unsupported locale passes through unchanged rather than being rejected |
| `catalog/seed.test.ts › ST-01`   | AC-5       | all five `CATEGORIES` are seeded                                          |
| `catalog/seed.test.ts › ST-02`   | AC-1       | `DOGS` is `Dogs` (en_US) and `犬` (ja_JP)                                 |
| `catalog/seed.test.ts › ST-03`   | AC-5       | every category has en_US/ja_JP/zh_CN detail rows                          |
| `catalog/seed.test.ts › ST-04`   | AC-5       | every category has ≥2 products, each with ≥2 items                        |
| `catalog/seed.test.ts › ST-05`   | AC-5       | an African Grey item matches both "large" and "african"                   |
| `catalog/seed.test.ts › ST-06`   | AC-5       | a second parrot item matches "parrot" but not "african"                   |
| `catalog/seed.test.ts › ST-07`   | AC-2, AC-5 | no `de_DE` row exists for any entity                                      |

## Red run

`bun run test -- catalog/locale.test.ts catalog/seed.test.ts` — both files failed to even collect, because neither `catalog/locale.ts` nor `catalog/seed.ts` existed yet:

```
FAIL  |server| catalog/seed.test.ts [ catalog/seed.test.ts ]
Error: Cannot find module './seed' imported from /workspace/repo/catalog/seed.test.ts

FAIL  |server| catalog/locale.test.ts [ catalog/locale.test.ts ]
Error: Cannot find module './locale' imported from /workspace/repo/catalog/locale.test.ts

Test Files  2 failed (2)
     Tests  no tests
```

## Green run

`bun run verify` — this stack's full gate (lint, typecheck, complete unit/integration suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  30 passed (30)
      Tests  136 passed (136)
```

`bun run test:e2e` was not run: the E2E preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is genuinely not installed in this container ("Playwright's Chromium browser is not installed at /ms-playwright/chromium-1155/chrome-linux/chrome") — a known limitation of implementation containers recorded in `AGENTS.md`'s Notes from previous agents. Per that note, `verify` stands in and the E2E tier is left to CI / the validation phase, which run against the identical `e2e/smoke.spec.ts` database-backed probe this ticket's change must not break.

TDD-RESULT: 136 passed, 0 failed
