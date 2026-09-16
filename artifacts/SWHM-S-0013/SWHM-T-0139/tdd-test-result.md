---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0139
branch: vortex/feat/SWHM-T-0139-cart-form-handling-update-cart-remove-an-ea88c06e
upstream: [artifacts/SWHM-S-0013/SWHM-T-0139/PLAN.md]
---

# TDD result — SWHM-T-0139

## Test cases

Extends `src/pages/cart.test.tsx` (CPT-01..CPT-06 already existed from SWHM-T-0138 and are
unchanged).

| Test                                                                                                                   | Covers     | Intent                                                                    |
| ---------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `CPT-07: activating Update Cart sends every row's quantity in a single PUT /api/cart request and renders the response` | AC-1, AC-2 | one `PUT`, body carries every row's current quantity, response re-renders |
| `CPT-08: setting a row's quantity to 0 and activating Update Cart removes that row`                                    | AC-3       | 0 is a valid remove instruction, not a validation failure                 |
| `CPT-09: activating a row's Remove control sends DELETE /api/cart/items/{itemId} for that item alone`                  | AC-4       | exactly one `DELETE`, scoped to the clicked row                           |
| `CPT-10: an empty quantity field is refused on screen with a message naming the row, and no PUT is sent`               | AC-6       | validation message names the row; zero `PUT` calls                        |
| `CPT-11: removing the last remaining line leaves the screen in the empty state`                                        | AC-7       | DELETE response with `count: 0` renders the empty state, not a stale row  |

AC-5 (no navigation/route change) has no dedicated test: the implementation never calls
`useNavigate`/`<Navigate>` or touches `window.location`, so there is nothing that could
navigate — CPT-07/08/09/11 already prove the screen re-renders in place from the mutation
response. AC-8 (this test file's assertions pass) is this file's own green run, below.

## Red run

`src/pages/cart.tsx` had no handlers wired yet — the controls existed but did nothing.

```
$ bun --bun vitest run src/pages/cart.test.tsx
 Test Files  1 failed (1)
      Tests  5 failed | 6 passed (11)
```

CPT-01..CPT-06 (SWHM-T-0138's, unchanged) passed; CPT-07..CPT-11 failed — clicking Update Cart
or Remove sent no request and changed nothing on screen.

## Green run

After wiring `handleQuantityChange`, `handleUpdateCart` and `handleRemove` in
`src/pages/cart.tsx`:

```
$ bun --bun vitest run src/pages/cart.test.tsx
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

Then the full pre-commit gate:

```
$ bun run verify:full
$ bun run verify && bun run test:e2e
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run

 Test Files  82 passed (82)
      Tests  483 passed (483)

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (`AGENTS.md` § Notes from previous
agents, "Implementation containers do not ship a Chromium" — F12). This ticket adds no `e2e/`
spec. Fell back to `bun run verify` alone, which is fully green:

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  82 passed (82)
      Tests  483 passed (483)
```

483 = the 460 passing at SWHM-T-0138 plus the 5 new tests, plus 18 more from SWHM-T-0135 and
SWHM-T-0136 (`removeItem`, `updateItems`, their routes) merged onto the sprint branch since.

TDD-RESULT: 483 passed, 0 failed
