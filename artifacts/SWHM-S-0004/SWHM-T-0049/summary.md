---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0049
branch: vortex/feat/SWHM-T-0049-read-transaction-consistency-for-catalog-84bea8cc
upstream: [artifacts/SWHM-S-0004/SWHM-T-0049/PLAN.md]
downstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Summary — SWHM-T-0049: Read-transaction consistency for catalog reads

## What changed

Added `catalog/transaction.ts` exporting `readConsistent<T>(fn: () => T): T`, a thin wrapper over the drizzle `db.transaction()` API. It runs `fn` inside one BEGIN/COMMIT on `db/client.ts`'s single bun:sqlite connection and returns its value. Applies to nothing yet — `catalog/query.ts` (SWHM-T-0050) is the only intended caller and owns that call site.

## Files

- `catalog/transaction.ts` — `readConsistent`.
- `catalog/transaction.test.ts` — commit/rollback/error-propagation/composite-read assertions.

## AC coverage

- AC-1 (fixed signature, runs callback in one transaction, returns its value) — `catalog/transaction.ts`; `transaction.test.ts › TT-01`.
- AC-2 (row absent after throw, present after return) — `transaction.test.ts › TT-02` (rollback), `› TT-03` (commit).
- AC-3 (error propagates unchanged) — `transaction.test.ts › TT-05` asserts the caught error is the exact thrown object (`toBe`, not just `toThrow`), proving nothing rewraps or swallows it.
- AC-4 (single-snapshot composite read) — `transaction.test.ts › TT-04` reads a category and its locale detail row inside one `readConsistent` call and asserts they belong together.

## Verification

```
$ bun run test -- catalog/transaction.test.ts   # red, before transaction.ts existed
Test Files  1 failed (1)
     Tests  no tests

$ bun run verify   # green, full gate
Test Files  32 passed (32)
     Tests  154 passed (154)
```

See `tdd-test-result.md` — `TDD-RESULT: 154 passed, 0 failed`.

`bun run test:e2e` / `bun run verify:full` were not run: this container's E2E preflight reports Chromium genuinely missing (documented in `AGENTS.md`'s Notes from previous agents). This ticket adds no route or page, so there is no new E2E surface; CI runs the full pipeline including E2E before the DONE transition.

## Notes

Per S5 (design.md § Spec discrepancies) and the PLAN's own note: task group 9's legacy framing (`trans-attribute: Required`, an EJB deployment descriptor, and a concurrent-writer isolation test) has no counterpart on an embedded, single-connection bun:sqlite database — there is no second connection to race against. `TT-04` tests the property that does survive: a read made of more than one statement, issued synchronously inside the callback, sees a single consistent view. No concurrent-writer test was written, because none can be produced in-process; this is the same conclusion the design doc already recorded, not a gap introduced here.
