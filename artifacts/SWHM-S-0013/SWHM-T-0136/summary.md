---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0136
branch: vortex/feat/SWHM-T-0136-update-cart-quantities-e5c1a00e
upstream: [artifacts/SWHM-S-0013/SWHM-T-0136/PLAN.md]
downstream: [SWHM-T-0139 codes the Update Cart button against PUT /api/cart]
---

# Summary — SWHM-T-0136: Update cart quantities

## What changed

Appended `updateItem` and `updateItems` to `cart/cart.ts`. The zero-or-less removal rule
(design.md D7) lives in `updateItem` alone — it delegates to the existing `removeItem` when
`quantity <= 0` and upserts otherwise — so `updateItems` passes every batch entry straight through
`updateItem` with no pre-filtering. `updateItems` wraps the whole batch in one `db.transaction`
(mirroring `admin/order-status.ts`'s form), so a write failing partway leaves every quantity at its
original value. Landed `PUT /api/cart`, public like the other cart routes (no `j_signon` check),
which validates every entry carries an `itemId` string and a numeric `quantity` before calling
`updateItems`, answering 400 otherwise — a non-numeric quantity is rejected while a numeric `0` or
negative is a valid removal instruction (S13).

## Files

- `cart/cart.ts` — appended `updateItem`, `updateItems`.
- `cart/cart.test.ts` — appended UT-01..UT-06.
- `routes/api/cart/index.put.ts` (+ `.test.ts`) — new: public `PUT /api/cart`.

## AC coverage

- AC-1 (positive update sets quantity) — `cart/cart.test.ts` UT-01; `index.put.test.ts` CPUR-01.
- AC-2, AC-3 (zero/negative removes) — UT-02, UT-03.
- AC-4 (subtotal recalculates) — UT-05.
- AC-5 (fixed `updateItem`/`updateItems` signatures, `PUT /api/cart` request/response contract) — `cart/cart.ts`, `routes/api/cart/index.put.ts`.
- AC-6 (zero-or-less rule applied inside `updateItem` alone; batch atomicity) — `updateItem`'s early return is the only place `quantity <= 0` is checked; UT-06 proves the transaction rolls back.
- AC-7 (400 on absent/non-numeric quantity) — CPUR-03, CPUR-04.
- AC-8 (mixed batch — one 0, one positive — in one request) — UT-04; CPUR-02.
- AC-9 (all new test-file assertions pass) — see `tdd-test-result.md`, `TDD-RESULT: 478 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  82 passed (82)
      Tests  478 passed (478)
```

`bun run verify:full`'s E2E preflight reported Chromium is genuinely not installed in this
container; fell back to `bun run verify` per the repository's own notes on implementation
containers. This ticket adds no `e2e/` spec — the browser tier runs at INTEGRATION_QA and in CI.

## Notes

- `updateItem` does not validate `itemId` against the catalogue (unlike `addItem`) — PLAN.md's
  route-validation step only names `itemId`/`quantity` shape, not catalogue membership. An
  `updateItem` call for an item id the catalogue no longer has simply upserts a row that
  `getCart`'s `toCartItem` then filters out on read, same as any other orphaned row.
- `cart/cart.ts` is left easy to extend: `clearCart` (SWHM-T-0137) is the only operation left to append.
