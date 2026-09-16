---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0142
branch: vortex/feat/SWHM-T-0142-browser-tier-cart-journey-531e69ea
upstream: [artifacts/SWHM-S-0013/SWHM-T-0142/PLAN.md]
---

# TDD result — SWHM-T-0142

## Test cases

| Test                                                                                                                                       | Covers | Intent                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------- |
| `e2e/cart.spec.ts › Shopping cart journey › adds an item from the item screen and finds it on /cart with the entered quantity`             | AC-1   | real add-to-cart round trip: item screen → `/cart`, quantity preserved       |
| `e2e/cart.spec.ts › Shopping cart journey › edits a quantity, activates Update Cart, and finds the new quantity and a consistent subtotal` | AC-2   | Update Cart persists the edited quantity and recalculates the subtotal       |
| `e2e/cart.spec.ts › Shopping cart journey › sets a quantity to 0, activates Update Cart, and finds that row gone from the table`           | AC-3   | zero-quantity removal via Update Cart, distinct from removing the whole cart |
| `e2e/cart.spec.ts › Shopping cart journey › removes the last remaining line and finds the empty-cart message with no table`                | AC-4   | Remove control on the only line reaches the exact empty-cart copy, no table  |
| `e2e/cart.spec.ts › Shopping cart journey › persists across navigation to another page and back to /cart`                                  | AC-5   | the cart survives a real navigation away and back, via the session cookie    |
| `e2e/cart.spec.ts › Shopping cart — anonymous access › reaches /cart without signing on and is served the cart, not redirected to sign-on` | AC-6   | `/cart` is public (design.md D3) — no redirect for an anonymous visitor      |

Asserts against the real seeded item `BIRDS-PARROTS-1` (not the legacy `1001`, per § Spec
discrepancies S12) and its `unit_cost` (`350.00`), never the `list_price` (`599.99`) the item
screen itself displays (§ Spec discrepancies S1) — `catalog/seed.ts:59-61`.

## Red run

No unit/integration tests were added by this ticket — its only file is a Playwright spec, and
every module, route and page it drives is landed and owned by an earlier ticket in this sprint
(SWHM-T-0134 through SWHM-T-0141), each already covered at the unit tier by its own ticket. There
is no code to move aside and no stub to fail against.

`bun run test:e2e -- e2e/cart.spec.ts` was run to attempt real execution:

```
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (confirmed by the preflight, not assumed —
per AGENTS.md's notes and § Codebase findings F12). Per PLAN.md's "On running it" and this
ticket's AC-7, the spec is not retried and no browser is installed here; it is written and
reviewed against the actual landed DOM (exact `aria-label`s from `src/pages/cart.tsx` and
`src/pages/catalog/item/[itemId].tsx`, and the exact empty-cart copy from the mockup) rather than
executed, and runs for the first time in CI on this branch, which does have a browser, and again
at INTEGRATION_QA.

`bun run lint` and `bun run typecheck` both passed clean against the new file before this was
written up.

CI's first run on this branch (which does have a browser) executed all six tests: five passed,
and one — "edits a quantity, activates Update Cart, and finds the new quantity and a consistent
subtotal" — failed for real, three times (initial + 2 retries):

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: getByText('$1050.00')
Expected: visible
Received: <element(s) not found>
1 failed, 33 passed (28.5s)
```

Genuine test bug, not a product bug: the assertion built its expected string with
`(UNIT_COST * 3).toFixed(2)` → `"1050.00"`, but `src/pages/cart.tsx`'s own `formatCurrency` uses
`Intl.NumberFormat("en-US", {style: "currency", currency: "USD"})`, which renders `"$1,050.00"`
with a thousands separator. Fixed by building the expected string with the same
`Intl.NumberFormat` call instead of `toFixed`, and pushed.

CI's second run on this fix failed the same test again, differently:

```
Error: expect.toBeVisible: Error: strict mode violation: getByText('$1,050.00') resolved to 2 elements:
    1) <td ...>$1,050.00</td> aka getByRole('cell', { name: '$1,050.00' })
    2) <span ...>$1,050.00</span> aka locator('span').filter({ hasText: '$' })
1 failed, 33 passed (20.9s)
```

Second genuine test bug: with only one line in the cart, its line-total cell and the cart's
subtotal render the identical string, so `getByText` matched both and Playwright's strict mode
refused to pick one. Fixed by seeding a second line (`BIRDS-FINCHES-1`, unit cost `12.00`) so the
subtotal (`$1,062.00`) is arithmetically distinct from either individual line total (`$1,050.00`,
`$12.00`) — this also better matches "a subtotal consistent with it" by proving the sum, not just
echoing a single line. No app code changed either time. This is the real red→green this ticket's
spec produced across two CI runs — the other five tests passed on the first real execution and
every run since.

## Green run

`bun run verify` — this stack's full pre-commit gate (`eslint . --ext ts,tsx
--report-unused-disable-directives --max-warnings 0` + `tsc --build` + `NODE_ENV=test bun --bun
vitest run`), run against the whole repository (unaffected by this ticket — no unit/integration
test count changes):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  83 passed (83)
      Tests  497 passed (497)
```

`bun run verify:full` was attempted; lint, typecheck and the full 497-test unit suite all passed,
then its `pretest:e2e` preflight reported Chromium genuinely not installed (same message as
above) — fell back to `bun run verify` per AGENTS.md's notes for this container (F12).

After both fixes above, CI's third run on this branch reported a green verdict for the full
suite, `e2e/cart.spec.ts`'s 6 tests included — the real execution AC-7 asks for, which happens in
CI (a browser-equipped runner), not this container.

TDD-RESULT: 497 passed, 0 failed
