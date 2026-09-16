---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0138
branch: vortex/feat/SWHM-T-0138-cart-screen-populated-and-empty-states-78d698d8
upstream: [artifacts/SWHM-S-0013/SWHM-T-0138/PLAN.md]
downstream: [SWHM-T-0139 wires the controls this ticket renders]
---

# Summary — SWHM-T-0138: Cart screen — populated and empty states

## What changed

Added `src/pages/cart.tsx` at `/cart` (file-based routing — creating the file is the whole
registration step). It fetches `GET /api/cart` on mount, renders a `role="status"` pending
indicator with the heading/container chrome while the read is outstanding, then one of two
states built to the mockups: the empty panel with the exact string
"Your Shopping Cart is Empty." and a "Browse the catalog" link (no `table`), or the populated
table (Item / Unit Cost / Quantity / Line Total / remove) with the item-count subtitle,
"Update Cart" button, Subtotal block and the zero-quantity hint. Reused `Table`/`Button` from
`src/components/ui/` unchanged; no new component. Currency is formatted with
`Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`, matching the mockup's
`$350.00` form. Per PLAN.md step 7, the controls (quantity input, Remove, Update Cart) render
but are inert — wiring is SWHM-T-0139.

## Files

- `src/pages/cart.tsx` — new: the `/cart` page, both states.
- `src/pages/cart.test.tsx` — new: CPT-01..CPT-06.

## AC coverage

- AC-1 (populated table, 4 columns) — CPT-03.
- AC-2 (per-item remove control) — CPT-03.
- AC-3 (exact empty message, no table) — CPT-02.
- AC-4 (subtotal shown below the table) — CPT-05.
- AC-5 (`/cart` reachable without signing on, `role="status"` pending indicator) — CPT-01; the
  page has no auth guard, matching design.md D3.
- AC-6 (empty state exact string, no `table`, catalogue action) — CPT-02.
- AC-7 (`aria-label="Quantity for <itemId>"`, currency form) — CPT-03, CPT-04.
- AC-8 (item-count subtitle, "Update Cart" control) — CPT-05.
- AC-9 (`src/pages/cart.test.tsx` assertions pass) — see `tdd-test-result.md`,
  `TDD-RESULT: 460 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  80 passed (80)
      Tests  460 passed (460)
```

`bun run test:e2e` fails its preflight because this container ships no Chromium (`AGENTS.md` §
Notes from previous agents) — expected, not a regression; no `e2e/` spec was added by this
ticket.
