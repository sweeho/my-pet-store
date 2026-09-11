---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0003
ticket: SWHM-T-0035
branch: vortex/feat/SWHM-T-0035-customer-account-api-860fd3e5
upstream: [artifacts/SWHM-S-0003/SWHM-T-0035/PLAN.md]
---

# TDD result — SWHM-T-0035

## Test cases

| Test                                            | Covers | Intent                                                                                                          |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `routes/api/customer/index.get.test.ts › GC-01` | AC-1   | signed-on read returns contact info, address, card metadata and profile in one response                         |
| `routes/api/customer/index.get.test.ts › GC-02` | AC-2   | a customer with no account rows gets profile defaults, not an error                                             |
| `routes/api/customer/index.get.test.ts › GC-03` | AC-4   | an unsigned-on read is refused with 401 and no account data                                                     |
| `routes/api/customer/index.put.test.ts › PC-01` | AC-3   | an update to all four groups round-trips through a subsequent read                                              |
| `routes/api/customer/index.put.test.ts › PC-02` | AC-4   | an unsigned-on update is refused with 401 and no account data                                                   |
| `routes/api/customer/index.put.test.ts › PC-03` | AC-5   | an out-of-vocabulary language is rejected with a descriptive message and leaves the stored preference unchanged |
| `routes/api/customer/index.put.test.ts › PC-04` | AC-6   | an out-of-vocabulary category is rejected with a descriptive message and leaves the stored preference unchanged |
| `routes/api/customer/index.put.test.ts › PC-05` | AC-7   | one customer's update never alters another customer's stored account                                            |

## Red run

`bun --bun vitest run routes/api/customer` — both suites failed to import the not-yet-created route handlers:

```
FAIL  |server| routes/api/customer/index.get.test.ts
Error: Cannot find module './index.get' imported from routes/api/customer/index.get.test.ts
FAIL  |server| routes/api/customer/index.put.test.ts
Error: Cannot find module './index.get' imported from routes/api/customer/index.put.test.ts

Test Files  2 failed (2)
     Tests  no tests
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete test suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(no errors)
$ tsc --build
(no errors)
$ NODE_ENV=test bun --bun vitest run
Test Files  26 passed (26)
     Tests  110 passed (110)
```

`bun run verify:full` was attempted first per AGENTS.md's preference; its E2E tier failed the same
way six prior SWHM-S-0002 tickets recorded in AGENTS.md § Notes from previous agents — Playwright's
Chromium is genuinely not installed in this container (`ensure-playwright-browser.mjs` fail-fast:
"Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome)"),
not a test failure. Falling back to `bun run verify` per that note; E2E runs again at INTEGRATION_QA
and in CI.

TDD-RESULT: 110 passed, 0 failed
