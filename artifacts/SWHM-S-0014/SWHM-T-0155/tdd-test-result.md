---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0155
branch: vortex/feat/SWHM-T-0155-order-id-allocation-seeded-at-1001-4e815c35
upstream: [artifacts/SWHM-S-0014/SWHM-T-0155/PLAN.md]
---

# TDD result — SWHM-T-0155

## Test cases

| Test                                                                                                                                            | Covers     | Intent                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `order/id.test.ts › order/id › ID-01: the first order allocated in an empty table receives 1001`                                                | AC-1       | the seed value itself                                                              |
| `order/id.test.ts › order/id › ID-02: subsequent orders receive the next incrementing ids`                                                      | AC-2       | 1002, 1003, 1004 — the database allocates each id in sequence, not this module     |
| `order/id.test.ts › order/id › ID-03: re-applying the seed to a table that already holds orders leaves existing rows and the next id untouched` | AC-4, AC-5 | idempotency: existing rows untouched, next id never lowered below one already used |

## Red run

`order/id.ts` did not exist yet — the test file was written first and fails to even resolve its import:

```
$ bun --bun vitest run order/id.test.ts
FAIL  |server| order/id.test.ts [ order/id.test.ts ]
Error: Cannot find module './id' imported from /workspace/repo/order/id.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

`order/id.ts` added (`seedOrderIdSequence`), wired into `db/client.ts` before the demo-order block:

```
$ bun --bun vitest run order/id.test.ts
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Then `bun run verify:full` — this stack's full pre-commit gate plus the browser tier:

```
$ bun run verify && bun run test:e2e
$ bun run lint && bun run typecheck && bun run test
 Test Files  85 passed (85)
      Tests  513 passed (513)

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (`AGENTS.md` § Notes from previous agents,
"Implementation containers do not ship a Chromium"). This ticket adds no `e2e/` spec and no
user-visible surface (`PLAN.md` § Design reference: none applies). Fell back to `bun run verify`
alone, which is fully green:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  85 passed (85)
      Tests  513 passed (513)
```

513 = the pre-existing suite (510, inherited from SWHM-T-0153 and earlier tickets landed on this
branch before it forked) plus the 3 new tests listed above.

TDD-RESULT: 513 passed, 0 failed
