---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0155
branch: vortex/feat/SWHM-T-0155-order-id-allocation-seeded-at-1001-4e815c35
upstream: [artifacts/SWHM-S-0014/SWHM-T-0155/PLAN.md]
---

# Summary — SWHM-T-0155: Order id allocation seeded at 1001

## What changed

`orders.order_id` is already `integer primary key autoincrement` (`db/schema.ts`), so the
"generator" is SQLite's own autoincrement sequence, tracked in `sqlite_sequence`. Added
`order/id.ts` exporting `seedOrderIdSequence(db)`, which runs:

```sql
INSERT INTO sqlite_sequence (name, seq)
SELECT 'orders', 1000
WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'orders')
```

SQLite gives `orders` a `sqlite_sequence` row the moment anything first inserts into it — either
this seed or a real order — so the `WHERE NOT EXISTS` makes the statement a pure insert-if-absent:
it never `UPDATE`s a row that already exists. That is the whole idempotency guarantee (AC-4/AC-5)
— on a fresh table it sets the next id to 1001; on a table that already holds orders, the row
already exists and the statement is a no-op, so existing rows and the next id are untouched.

`order/id.ts` takes `db` as a parameter rather than importing it from `db/client.ts`: `db/client.ts`
is its only caller, and importing back from it would be a circular import into the module every
other module's db access already goes through (the same class of problem `db/client.ts`'s existing
`hashAdminPassword` comment documents for `auth/user.ts`).

`db/client.ts` calls `seedOrderIdSequence(db)` right after `migrate()`, before the demo-order
block, so a fresh development database gives 1001 to the first demo order rather than to a row
that follows it (AC of "before ... inserts its demo orders").

Went with a standalone module (`order/id.ts`) rather than folding the one SQL statement inline into
`db/client.ts`: the idempotency case (AC-5) needs to invoke the seed a second time, against a
table already holding orders, from a test — that needs an exported, independently callable
function, not an inline top-level statement.

## Files

- `order/id.ts` — new. `seedOrderIdSequence(db)`.
- `order/id.test.ts` — new. ID-01 through ID-03.
- `db/client.ts` — calls `seedOrderIdSequence(db)` before the demo-order block.

## AC coverage

- AC-1 (first order in an empty table gets 1001) — `order/id.test.ts` ID-01.
- AC-2 (next two get 1002 and 1003) — ID-02 (asserts its own 2nd and 3rd inserted orders receive
  consecutive ids, continuing the same sequence ID-01 started at 1001 — the shared in-memory db
  persists across `it`s in one file, same pattern as `admin/order-status.test.ts`).
- "the id is allocated by the database as part of the insert" — the seed only ever touches
  `sqlite_sequence`; `order/id.ts` never reads `max(order_id)` and never mints its own id. Order ids
  in the test come back from `.returning({ orderId: orders.orderId })` on the real insert.
- "seed applied before `db/client.ts` inserts its demo orders" — code order in `db/client.ts`:
  `seedOrderIdSequence(db)` precedes the `SEED_ORDERS` block.
- AC-4/AC-5 (idempotent; existing rows and ids untouched; next id never lowered) — ID-03: row count
  is unchanged immediately after a second `seedOrderIdSequence(db)` call, and the next inserted id
  continues from where the sequence already was rather than resetting to 1001.
- Full `TDD-RESULT: 513 passed, 0 failed` — `tdd-test-result.md`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  85 passed (85)
      Tests  513 passed (513)
```

`bun run verify:full`'s E2E preflight reported Chromium is genuinely not installed in this
container; fell back to `bun run verify` per the repository's own notes on implementation
containers. This ticket has no user-visible surface (`PLAN.md` § Design reference: none applies)
and adds no `e2e/` spec.

## Notes

- No column, no migration, no route, no page — matches `PLAN.md`'s scope boundary. `db/schema.ts`
  was not touched.
