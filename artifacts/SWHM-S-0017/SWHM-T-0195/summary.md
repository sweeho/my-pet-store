---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0017
ticket: SWHM-T-0195
branch: vortex/feat/SWHM-T-0195-inventory-management-screen-113d9c6f
upstream: [artifacts/SWHM-S-0017/SWHM-T-0195/PLAN.md]
downstream: [artifacts/SWHM-S-0017/qa-test-report.md]
---

# Summary — SWHM-T-0195: Inventory management screen

## What changed

Added the `/supplier/inventory` screen and its two endpoints: `fulfillment/inventory-admin.ts`
(`listInventory`, a left join over `item`/`inventory` so a never-stocked item still shows 0;
`applyInventoryUpdates`, a batch write in one `db.transaction` reporting unknown item ids rather
than dropping them), `routes/api/supplier/inventory/index.{get,post}.ts` (both guarded by the
existing `requireAdmin`), and `src/pages/supplier/inventory.tsx` (built from
`mockup-inventory-update.html`: the four-column table, a text input and checkbox per row, one
Update Inventory control outside the table).

## Files

- `fulfillment/inventory-admin.ts` — new; `listInventory`, `applyInventoryUpdates`.
- `fulfillment/inventory-admin.test.ts` — new; see `tdd-test-result.md`.
- `routes/api/supplier/inventory/index.get.ts` — new; `requireAdmin` guard, returns `{ items }`.
- `routes/api/supplier/inventory/index.post.ts` — new; `requireAdmin` guard, request-shape
  validation, delegates to `applyInventoryUpdates`.
- `routes/api/supplier/inventory/index.{get,post}.test.ts` — new; see `tdd-test-result.md`.
- `src/pages/supplier/inventory.tsx` — new; `RequireAdmin` + `AdminShell` + `Table` primitives,
  native inputs with `src/pages/customer.tsx`'s shared input class (F8: no input primitive exists).
- `src/pages/supplier/inventory.test.tsx` — new; see `tdd-test-result.md`.

## AC coverage

- AC-1 (screen displays item ID, existing quantity, new-quantity input, update checkbox) —
  `inventory.tsx`'s table; `inventory-admin.test.ts › IA-01`, `inventory.test.tsx › IT-02/03`.
- AC-2 (form tracks which items are selected) — `rows` state's `checked` field, filtered at submit;
  `inventory-admin.test.ts › IA-04`, `inventory.test.tsx › IT-05`.
- AC-3 (form posts to the correct endpoint) — in this product's terms (PLAN.md's Definition of
  Done, design.md S8): the form POSTs to `/api/supplier/inventory`, not a `RcvrRequestProcessor`
  path; `inventory.test.tsx › IT-05/06` assert the actual request.
- AC-4 (administrator-only access) — `RequireAdmin` at the page, `requireAdmin` at both routes (no
  second role check written); `index.get.test.ts › IG-01/02`, `index.post.test.ts › IP-01/02`.
- AC-5 (an unticked row keeps its existing quantity whatever was typed) — the `checked` filter at
  submit; `inventory.test.tsx › IT-05`.
- AC-6 (a never-stocked item shows 0 and can be given a quantity) — `listInventory`'s left join;
  `inventory-admin.test.ts › IA-02/05`, route `IG-03`, page `IT-03`.

## Verification

```
$ bun --bun vitest run fulfillment/inventory-admin.test.ts routes/api/supplier/inventory/ src/pages/supplier/inventory.test.tsx
 Test Files  4 passed (4)
      Tests  26 passed (26)

$ bun run verify
✓ lint  ✓ typecheck
 Test Files  111 passed (111)
      Tests  716 passed (716)
```

`bun run verify:full` also ran; its `test:e2e` step fails only at the Chromium preflight (container
has no browser installed — the same limitation prior tickets in this sprint recorded in
`AGENTS.md`), not retried per that note. Full detail and the red→green proof are in
`tdd-test-result.md`.

## Notes

`AdminShell` is reused unmodified (ownership forbids touching `src/components/`), so the rendered
header reads "· Administration" rather than the mockup's "Supplier" nav tag — PLAN.md step 4
explicitly directs this reuse, and `design.md` F7 records the same precedent for the existing admin
orders screen. Everything the mockup fixes for the screen's own content — the four columns in
order, the per-row input/checkbox, the hint text, and the Update Inventory control outside the
table — is built as shown.

No new shared component, no new design token, and no second role check were added, per PLAN.md's
Definition of Done.
