---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0139
branch: vortex/feat/SWHM-T-0139-cart-form-handling-update-cart-remove-an-ea88c06e
upstream: [artifacts/SWHM-S-0013/SWHM-T-0139/PLAN.md]
downstream: [SWHM-T-0142 codes E2E against the same PUT/DELETE contracts]
---

# Summary — SWHM-T-0139: Cart form handling

## What changed

Wired the controls SWHM-T-0138 rendered but left inert. Quantity inputs are now controlled,
keyed by `itemId` in page state (`quantities`), seeded from the fetched cart and reseeded from
every mutation response. "Update Cart" validates every row, then sends **one**
`PUT /api/cart` carrying every row's current quantity (not one request per row, per PLAN.md
step 2 / SWHM-T-0136's transaction). Each row's "Remove" sends
`DELETE /api/cart/items/{itemId}` for that row alone. Both handlers replace `cart` with the
response body and reseed `quantities` from it — no navigation, no route change, no refetch
(design.md S3).

Validation: a field is rejected only when it is empty after trimming. `<input type="number">`
sanitizes any non-numeric keystroke to `""` in the DOM (verified directly against jsdom before
writing the check), so "empty" and "not a number" (S13) are the same observable case here —
there is no code path where `onChange` delivers a literal non-numeric string. A rejected field
shows `role="alert"` text naming the item by product name (e.g. "Quantity for Parrots must be
a number.") and the request is never sent. A valid `0` or negative value is passed through
untouched — the server (`updateItems`, SWHM-T-0136) is what turns a non-positive quantity into
a removal.

No change to SWHM-T-0138's markup, copy, columns or layout — only `value`/`onChange`/`onClick`
attributes added to controls that already existed.

## Files

- `src/pages/cart.tsx` — extended: quantity/error state, `handleQuantityChange`,
  `handleUpdateCart`, `handleRemove`, wired to the existing inputs/buttons.
- `src/pages/cart.test.tsx` — extended: CPT-07..CPT-11.

## AC coverage

- AC-1 ("cart SHALL be updated with new quantities and redisplayed") — CPT-07.
- AC-2 (single `PUT /api/cart`, not one per row) — CPT-07.
- AC-3 (quantity 0 + Update Cart removes the row) — CPT-08.
- AC-4 (`DELETE /api/cart/items/{itemId}` for that item alone) — CPT-09.
- AC-5 (renders the mutation response, no navigation/route change) — no dedicated test; the
  implementation calls no navigation API, and CPT-07/08/09/11 already show in-place re-render.
- AC-6 (empty/non-numeric quantity refused with a message naming the row, no request sent) —
  CPT-10.
- AC-7 (removing the last line shows the empty state) — CPT-11.
- AC-8 (`src/pages/cart.test.tsx` assertions pass) — see `tdd-test-result.md`,
  `TDD-RESULT: 483 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  82 passed (82)
      Tests  483 passed (483)
```

`bun run test:e2e` fails its preflight because this container ships no Chromium (`AGENTS.md` §
Notes from previous agents) — expected, not a regression; no `e2e/` spec was added by this
ticket.
