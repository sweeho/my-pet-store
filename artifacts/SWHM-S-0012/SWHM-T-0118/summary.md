---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0118
branch: vortex/feat/SWHM-T-0118-order-tables-and-retrieval-by-status-43eb6b4a
upstream: [artifacts/SWHM-S-0012/SWHM-T-0118/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0118: Order tables and retrieval by status

## What changed

Added the `orders` and `order_line_item` tables (own keys, `unit_price` recorded as the price paid,
indexed on `status` and `order_date`), seeded demo orders spanning all four statuses across multiple
categories and a 60-day date spread, and served them through `getOrdersByStatus` and
`GET /api/admin/orders?status=…`.

## Files

- `db/schema.ts` — `orders`, `order_line_item` tables per the ticket's fixed interface contract.
- `drizzle/0006_exotic_cannonball.sql`, `drizzle/meta/*` — the generated migration.
- `db/client.ts` — seeds 6 demo orders (all four statuses, items spanning multiple categories, dates 2–60 days back) after the catalog seed, plus the 3 demo customer `auth_users` rows the orders reference.
- `admin/types.ts` — `ORDER_STATUSES`/`OrderStatus`/`OrderSummary`/`Page<T>` (see Notes on why this file, not `admin/orders.ts`).
- `admin/orders.ts` (+ `.test.ts`) — `getOrdersByStatus(status, start?, count?)`: filters by one or several statuses, sorts `order_date` desc then `order_id` desc, pages as `items` + `hasNext` (no COUNT). Re-exports the types above so `import … from "../admin/orders"` keeps working too.
- `routes/api/admin/orders/index.get.ts` (+ `.test.ts`) — calls `requireAdmin` first, validates `status` (one or repeated) against `ORDER_STATUSES` and `start`/`count` (the `parsePagination` shape from `routes/api/catalog/categories/index.get.ts`), 400 on either.
- `tsconfig.node.json` — added `"admin"` to the `include` list (see Notes).

## AC coverage

- AC-1 (return the order list with `OrderId`/`UserId`/`OrderDate`/`OrderAmount`/`OrderStatus` for a requested status) — per design.md S4, realized as JSON, not XML: `GET /api/admin/orders?status=…` returns `{ items: OrderSummary[], hasNext }` with those five fields under `orderId`/`userId`/`orderDate`/`orderAmount`/`orderStatus`. Covered by `admin/orders.test.ts` (filtering, sort, pagination, empty result, field shape) and `routes/api/admin/orders/index.get.test.ts` (401/403 from the guard, 400 for an unknown status or bad pagination, the 200 shape, multiple statuses in one request).

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  61 passed (61)
      Tests  358 passed (358)
```

`bun run verify:full`'s E2E tier fails fast in this container (Chromium genuinely not installed,
`scripts/ensure-playwright-browser.mjs`) — the documented implementation-container limitation.
Did not retry or install a browser; E2E runs in CI and at integration QA. See `tdd-test-result.md` —
`TDD-RESULT: 358 passed, 0 failed`.

## Notes

- `tsconfig.node.json`'s `include` list never gained `"admin"` when SWHM-T-0117 created that module,
  so `admin/*.ts` was silently outside every tsc project and never actually typechecked by
  `bun run typecheck` until now. This ticket's route file is the first file under an _included_
  project (`routes`) to import from `admin/`, which surfaced it as a `TS6307` composite-project
  error ("File is not listed within the file list of project"). Added `"admin"` to the include list
  — a one-line, low-risk config fix outside this ticket's stated file ownership, but necessary for
  its own typecheck gate to pass and for the module SWHM-T-0117 already landed to be checked at all.
- The `Page<T>` type is `{ items, hasNext }`, distinct from `catalog/types.ts`'s `Page<T>`
  (`{ objects, start, hasNext }`) — the PLAN.md fixed contract's example response literally names
  `items`, and reusing the catalog type would have meant a field-name mismatch against that contract.
- `ORDER_STATUSES`/`OrderStatus`/`OrderSummary`/`Page<T>` live in `admin/types.ts`, which this
  ticket's own file-ownership list omits — but SWHM-T-0119's and SWHM-T-0120's PLAN.md files, already
  written, both hard-code `admin/types.ts` as the import path (SWHM-T-0120's literally: "`admin/types.ts`
  gains the types above and nothing more — it is SWHM-T-0117's file and SWHM-T-0118 has already
  extended it"). Followed that instead of the omission: added to `admin/types.ts`, and `admin/orders.ts`
  re-exports the same names so nothing importing from `admin/orders` needed to change.
- Demo orders reference three new bare `auth_users` rows (`alice_customer`, `bob_customer`,
  `carol_customer`) seeded only for FK purposes — no `customers`/`accounts`/`profiles` rows, since
  nothing this ticket builds reads them.
