---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0049
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0049/summary.md]
---

# Plan — SWHM-T-0049: Read-transaction consistency for catalog reads

## Objective

A read made of more than one statement sees one snapshot. `readConsistent` is a thin, tested wrapper over a drizzle transaction that `catalog/query.ts` puts every paginated read inside, so a page's rows and its `hasNext` flag can never come from two different views of the table.

## Steps

1. Create `catalog/transaction.ts` exporting `readConsistent<T>(fn: () => T): T` with the signature fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Transaction.
2. Implement it over the drizzle transaction API on the existing `db` from `db/client.ts`. Return the callback's value; let an error thrown inside propagate unchanged so a caller sees its own failure, not a wrapper's.
3. Write `catalog/transaction.test.ts`. The rollback assertion is the point: a row written inside the callback must be absent after the callback throws and present after it returns. A wrapper that merely calls its argument passes every other test and fails this one.
4. Do not apply the wrapper to anything yet — `catalog/query.ts` (SWHM-T-0050) is the only caller, and it owns that call site.

Read `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, S5 before starting: this group's legacy framing is an EJB deployment descriptor and a concurrent-writer scenario that an embedded single-connection database cannot produce, and the scoped-down property above is what survives of it. This group carries no delta-spec scenario.

## File/module ownership

- `catalog/transaction.ts`
- `catalog/transaction.test.ts`

## Definition of Done

- AC-1 — the exported signature against § Transaction.
- AC-2 — the rollback and commit assertions.
- AC-3 — error propagation.
- AC-4 — the single-snapshot composite read.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
