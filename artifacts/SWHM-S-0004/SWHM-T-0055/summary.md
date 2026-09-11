---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0055
branch: vortex/feat/SWHM-T-0055-catalog-facade-and-public-http-surface-7fed9d7f
upstream: [artifacts/SWHM-S-0004/SWHM-T-0055/PLAN.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0056/PLAN.md]
---

# Summary — SWHM-T-0055: Catalog facade and public HTTP surface

## What changed

Added `catalog/catalog.ts`, the seven-operation facade (`getCategory`, `getCategories`,
`getProduct`, `getProducts`, `getItem`, `getItems`, `searchItems`) that applies the
`start=0`/`count=25`/`locale=en_US` defaults once, and the seven GET routes under
`routes/api/catalog/` that put it on the network. Every route is public — none reads the
session cookie, and `auth/protected-resources.ts` is untouched. Failures answer
`setResponseStatus` + `{ error: string }`, the SWHM-T-0035 contract, never `createError`.

## Files

- `catalog/catalog.ts` — new: the facade. Also re-exports `Category`/`Product`/`Item`/
  `Page`/`Locale` so routes have exactly one import path into `catalog/` for both
  operations and types (AC-1).
- `routes/api/catalog/categories/index.get.ts` (+ `.test.ts`) — `GET /api/catalog/categories`.
- `routes/api/catalog/categories/[categoryId].get.ts` (+ `.test.ts`) — `GET /api/catalog/categories/:categoryId`.
- `routes/api/catalog/products/index.get.ts` (+ `.test.ts`) — `GET /api/catalog/products`.
- `routes/api/catalog/products/[productId].get.ts` (+ `.test.ts`) — `GET /api/catalog/products/:productId`.
- `routes/api/catalog/items/index.get.ts` (+ `.test.ts`) — `GET /api/catalog/items`.
- `routes/api/catalog/items/[itemId].get.ts` (+ `.test.ts`) — `GET /api/catalog/items/:itemId`.
- `routes/api/catalog/search.get.ts` (+ `.test.ts`) — `GET /api/catalog/search`.

## AC coverage

- AC-1 (facade is the only module `routes/` imports from `catalog/`) — every route imports
  only `catalog/catalog`; verified with a grep across `routes/api/catalog/*.ts` (excluding
  tests) after re-exporting the types.
- AC-2 (seven routes at exactly the § HTTP surface paths/bodies) — the 7 route files;
  `CI-01`, `CD-01`, `PI-01`, `PD-01`, `II-01`, `ID-01`, `SR-01`.
- AC-3 (facade defaults: omitting start/count/locale matches stating them) — every success
  test omits all three query parameters and asserts the default-locale content.
- AC-4 (missing entity → 404 `{ error }`, never 200/null) — `CD-02`, `PD-02`, `ID-02`.
- AC-5 (missing required parameter → 400) — `PI-02` (`categoryId`), `II-02` (`productId`),
  `SR-02` (`q`).
- AC-6 (non-numeric/out-of-range `start`/`count` → 400) — `CI-02` (`count=0`); the same
  `parsePagination` check is inlined identically in `products/index.get.ts`,
  `items/index.get.ts` and `search.get.ts`.
- AC-7 (reachable with no session) — no route reads a cookie; every test sends none.
- AC-8 (route tests under `routes/`, one success + one failure each) — the 7 `*.test.ts`
  files, 14 cases total.

## Verification

```
$ catalog/catalog.ts moved aside; NODE_ENV=test bun --bun vitest run routes/api/catalog
Error: Cannot find module '../../../catalog/catalog' (×7)
Test Files  7 failed (7)

$ bun run verify                                             # green, full gate
lint ✓  typecheck ✓  222 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 222 passed, 0 failed`.

## Notes

- Query-parameter validation (`parsePagination`) is a small non-exported function
  duplicated identically in the four list routes rather than factored into a shared
  module: PLAN.md step 5 places validation "in the routes", and a new shared file inside
  `catalog/` would exceed this ticket's file ownership (INTERFACES.md's module-layout
  table assigns `catalog/catalog.ts` alone to SWHM-T-0055); a helper under `routes/api/catalog/`
  is unsafe because Nitro turns every `.ts` file there into a route regardless of its
  exports (the same gotcha recorded in `AGENTS.md` § Notes from previous agents for
  `auth/`/`account/`).
- `event.res.status` is only asserted for the 400/404 cases, matching
  `routes/api/customer/index.get.test.ts`'s own convention — calling a handler directly
  (not through Nitro's server) leaves `status` `undefined` rather than defaulted to 200.
- `verify:full`'s E2E tier cannot launch Chromium in this container (confirmed via the
  `pretest:e2e` preflight); `verify` (lint + typecheck + full unit suite) is the gate
  actually satisfied here, per AGENTS.md's guidance to fall back rather than retry or
  install. No E2E specs are owned by this ticket.
