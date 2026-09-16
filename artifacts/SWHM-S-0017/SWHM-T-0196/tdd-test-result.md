---
ticket: SWHM-T-0196
title: Integration, failure behaviour and the browser journey
---

## Test cases

### `routes/api/fulfillment/process.post.test.ts` — 2 new cases added (PT-05, PT-06)

| ID    | Covers                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PT-05 | An unexpected failure partway through processing answers 500 with no stack trace or internal message in the body, and changes no inventory, no shipped quantity and no order status — AC-1 |
| PT-06 | An unexpected failure is logged to `console.error` naming the order id it was processing — AC-2                                                                                            |

Both force the failure the same way `fulfillment/fulfillment.test.ts`'s existing PT-07 does — a `vi.spyOn(db, "update")` that throws on the second call (inventory's `reduceQuantity`, then `markLineShipped`'s write) — applied here to prove the **route's own** error mapping and logging, not the pass's rollback (already proven at the `fulfillment/fulfillment.ts` level by that ticket's own PT-07).

### `e2e/fulfillment.spec.ts` (new — Playwright, browser tier)

| Test                                                                                                                | Covers                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "signs in, reaches the inventory screen from the supplier home, and updates one ticked row"                         | AC-3: sign in as administrator → `/supplier` → **Display Inventory** → `/supplier/inventory`, four column headers, set a new quantity on a ticked row, submit, ticked row shows the new figure, untouched row unchanged |
| "a fulfillable order answers with an invoice, and a second identical request answers with none and changes nothing" | AC-4: idempotence — first run against a fillable order returns an invoice; the identical second request returns none and leaves inventory as the first left it                                                          |

## Red run

Before the route's 500 mapping and logging existed (PT-05/PT-06 against the unmodified `process.post.ts`, which let the simulated error propagate uncaught rather than answering 500):

```
$ bun run test -- routes/api/fulfillment/process.post.test.ts
 FAIL  |server| ... > PT-05: ... → Error: simulated shipped-quantity write failure (uncaught, not a 500)
 FAIL  |server| ... > PT-06: ... → Error: simulated shipped-quantity write failure (uncaught, nothing logged)
 Test Files  1 failed (1)
      Tests  2 failed | 4 passed (6)
```

## Green run

After adding the 500/logging branch to `routes/api/fulfillment/process.post.ts`:

```
$ bun run test -- routes/api/fulfillment/process.post.test.ts
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

Full pre-commit gate (`bun run verify:full`, which runs `verify` — lint + typecheck + full unit suite — then `test:e2e`):

```
$ bun run verify:full
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0     → pass (covers e2e/fulfillment.spec.ts)
$ tsc --build                                                                   → pass (e2e/ is in tsconfig.node.json's include)
$ NODE_ENV=test bun --bun vitest run
 Test Files  112 passed (112)
      Tests  722 passed (722)
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

E2E's browser preflight reports Chromium genuinely missing in this container (documented in `AGENTS.md` § Notes from previous agents — implementation containers do not ship Chromium). Per that note, `e2e/fulfillment.spec.ts` was written and type-checked/linted clean but **could not be executed** in this container — not retried, no browser installed. The browser tier runs in CI (F16: already triggers on `vortex/**`, untouched by this ticket) and at INTEGRATION_QA, where its actual pass/fail will be observed for the first time. `verify` (lint + typecheck + the full 722-test unit suite) is the gate that applies here and is green.

No pre-existing failures were introduced: adding 2 new cases to the existing route test file brought the suite from 112 files/720 tests to 112/722 tests (the file count is unchanged — no new Vitest file was added; `e2e/fulfillment.spec.ts` is a Playwright spec, outside this count), with zero failures.

TDD-RESULT: 722 passed, 0 failed
