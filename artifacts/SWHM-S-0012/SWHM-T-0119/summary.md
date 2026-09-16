---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0119
branch: vortex/feat/SWHM-T-0119-batch-order-status-update-c17d88df
upstream: [artifacts/SWHM-S-0012/SWHM-T-0119/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0119: Batch order status update

## What changed

Added `updateOrderStatus(orderIds, newStatus)` in `admin/order-status.ts`: one `db.transaction`
wrapping a per-order `UPDATE`, reporting which ids moved (`updated`) and which matched no row
(`notFound`) rather than dropping unknown ids (design.md D5). Added `POST /api/admin/orders/status`,
which runs `requireAdmin`, validates the body and the target status against `ORDER_STATUSES`, and
delegates to `updateOrderStatus`. Per design.md S5, there is no `AsyncSender` EJB and no queue — the
transaction is what gives the atomicity the acceptance criteria actually assert.

## Files

- `admin/order-status.ts` — new: `updateOrderStatus` + `StatusUpdateResult`.
- `admin/order-status.test.ts` — new: batch move, mixed known/unknown ids, all-unknown batch, transactional rollback (asserted against the real in-memory db, not a mock).
- `routes/api/admin/orders/status.post.ts` — new: `POST /api/admin/orders/status`.
- `routes/api/admin/orders/status.post.test.ts` — new: guard 401/403, body/status validation, success and partial-match response shapes.

## AC coverage

- AC-1 (send `UPDATESTATUS` with all orders and new status, delegate to `AsyncSender`) — resolved per `PLAN.md`'s Definition of Done as: one request moves every listed order to the given status. `admin/order-status.ts`, `routes/api/admin/orders/status.post.ts`; covered by `US-01`, `RS-08`.
- AC-2 (`OrderApproval` XML sent via `AsyncSender` EJB, i.e. asynchronous/reliable processing) — resolved per `PLAN.md` and design.md S5 as: the batch is atomic — a write failing partway leaves every order at its original status. `admin/order-status.ts`'s `db.transaction`; covered by `US-04`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  66 passed (66)
      Tests  386 passed (386)
```

Full detail (including the red→green proof for this ticket's 13 new tests) in
`tdd-test-result.md` — `TDD-RESULT: 386 passed, 0 failed`. `bun run verify:full`'s E2E tier could not
run in this container (Chromium genuinely not installed, per AGENTS.md's notes for this sprint); it
runs at INTEGRATION_QA and in CI.

## Notes

- The rollback test (`US-04`) injects a real, single-call write failure with `vi.spyOn(db, "update")`
  so the first order's `UPDATE` actually executes inside the (uncommitted) transaction before the
  second one throws — this is the only way to prove a _prior_ successful write in the same batch gets
  rolled back. The assertion itself re-reads the real rows afterward, per `PLAN.md`'s gotcha against
  asserting rollback against a mock.
- Approve/deny thresholds and the approval workflow are explicitly out of scope (`swhm-i-0011`); this
  route accepts any valid `OrderStatus` transition with no workflow rules, per `PLAN.md` step 5.
