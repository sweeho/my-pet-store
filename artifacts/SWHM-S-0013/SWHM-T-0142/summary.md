---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0142
branch: vortex/feat/SWHM-T-0142-browser-tier-cart-journey-531e69ea
upstream: [artifacts/SWHM-S-0013/SWHM-T-0142/PLAN.md]
---

# Summary — SWHM-T-0142: Browser-tier cart journey

## What changed

Added `e2e/cart.spec.ts`, following the shape of `e2e/catalog.spec.ts` (public journeys) and
`e2e/admin.spec.ts` (grouped describe blocks): one test per acceptance criterion, in two
`test.describe` blocks — the shopper's journey (add, edit, zero-out, remove-last, persist) and the
anonymous-access case. No app code, route or page was touched — every surface the spec drives
(SWHM-T-0134 through SWHM-T-0141) is already landed and unit-tested; per PLAN.md's scope boundary
(design.md S10) this ticket does not re-open those files.

## Files

- `e2e/cart.spec.ts` — new: 6 tests across 2 describe blocks.

## AC coverage

- AC-1 (add from item screen, found on `/cart` with the entered quantity) — "adds an item from the item screen...".
- AC-2 (edit quantity, Update Cart, new quantity + consistent subtotal) — "edits a quantity...".
- AC-3 (quantity 0 via Update Cart removes just that row) — "sets a quantity to 0...".
- AC-4 (remove the last line, empty-cart message, no table) — "removes the last remaining line...".
- AC-5 (persists across navigation) — "persists across navigation...".
- AC-6 (`/cart` reachable without signing on) — "reaches /cart without signing on...".
- AC-7 (executed, or the log states why not) — see `tdd-test-result.md`: the preflight confirmed Chromium is genuinely not installed in this container, so this spec's first real execution was CI on this branch. CI caught a genuine test bug (a `toFixed(2)` string not matching the page's `Intl.NumberFormat`-rendered subtotal), fixed and re-pushed.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  83 passed (83)
      Tests  497 passed (497)
```

`bun run test:e2e -- e2e/cart.spec.ts` was attempted directly; its preflight
(`scripts/ensure-playwright-browser.mjs`) reported Chromium genuinely not installed — not retried,
no browser installed, per the repository's implementation-container notes (F12) and this ticket's
own AC-7. Full detail in `tdd-test-result.md`.

## Notes

- Asserts against the real seeded item `BIRDS-PARROTS-1` and its `unit_cost` (`350.00`), never
  the `list_price` (`599.99`) the item screen shows — design.md S1/S12.
- Locates the quantity inputs by their `aria-label="Quantity for <itemId>"` (SWHM-T-0138's fixed
  contract), the stable handle PLAN.md names for the update/remove cases.
- CI's first run (this container has no Chromium) found one genuine test bug: the subtotal
  assertion built its expected string with `toFixed(2)`, which omits the thousands separator
  `Intl.NumberFormat` renders. Fixed in the spec; no app code changed. No defect found in the
  landed cart modules/pages themselves.
