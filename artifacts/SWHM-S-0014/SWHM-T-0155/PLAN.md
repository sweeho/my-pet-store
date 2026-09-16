---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0155
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0153/PLAN.md,
  ]
---

# PLAN — SWHM-T-0155: Order id allocation seeded at 1001

## Objective

Make the first order allocated in an empty `orders` table receive 1001, and every order after it the next integer.

## Steps

1. **Read design.md § Spec discrepancies S1 before writing anything.** The extracted specification describes a `UniqueIdGenerator` EJB with thread-safe allocation. There is no EJB container here, and `orders.order_id` is already `integer primary key autoincrement` (§ Codebase findings F5). The sequence _is_ the generator.
2. **Seed the sequence, do not build a generator.** SQLite allocates the id inside the insert, so there is no concurrent-allocation problem and nothing to make thread-safe — which is why § Decisions D3 forbids a `max(order_id) + 1` read-then-write. Two callers doing that race; the database does not. UUIDs are forbidden outright by `legacy-analysis/rebuild-guidance.md:90`.
3. **Put the seed in `db/client.ts`, beside the existing startup seeding**, rather than hand-editing a generated migration. The migrations under `drizzle/` stay generated-only, which is what makes regenerating them safe.
4. **Order matters within that file.** `db/client.ts` seeds six demo orders in development (`!process.env.VITEST`). The sequence seed goes _before_ that block, so a fresh development database gives 1001 to the first demo order rather than to a row that follows them (§ Codebase findings F6).
5. **Make it idempotent.** The seed runs on every startup, including against a database that already holds orders. It must never lower the next id below one already allocated, and must not touch existing rows. A database at id 1006 stays at 1006.
6. Tests: `order/id.test.ts` — the first order in an empty table is 1001, the next two are 1002 and 1003, and applying the seed to a populated table changes nothing. Under Vitest the demo orders are not seeded and the database is in-memory, so an empty table is the starting condition (§ Codebase findings F6).

## Scope boundary

No column, no migration, no route, no page. If the seeding is small enough to live in `db/client.ts` without its own module, put it there and say so in your work log — a module wrapping one statement is an abstraction for single-use code.

## On the literal 1001

§ Spec discrepancies S2 is the thing to understand here. "First order receives ID 1001" is only reproducible against an empty table. That is true at the unit tier and is where it is asserted. The browser tier must not assert the literal — SWHM-T-0162's plan says so explicitly. If you find yourself needing to delete rows to make an assertion pass, you are asserting it at the wrong tier.

## File/module ownership

Create or modify only: `order/id.ts`, `order/id.test.ts`, `db/client.ts`.

Nothing else. `db/schema.ts` is complete as of SWHM-T-0153.

## Design reference

None applies — no user-visible surface.

## Definition of Done

AC-1 through AC-5 on the ticket.
