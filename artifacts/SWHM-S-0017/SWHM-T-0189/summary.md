---
ticket: SWHM-T-0189
title: Invoice generation
---

## What changed

Added `fulfillment/invoice.ts`, the module fixed by `PLAN.md` § Fixed interface
contracts: `createInvoice(order, fulfilledItems, shippingDate)`, a pure string
builder producing an XML document with order metadata (`poId`, `userId`, `poDate`,
`shippingDate`) and every field of each fulfilled line (`categoryId`, `productId`,
`itemId`, `lineNumber`, `quantity`, `unitPrice`). No XML dependency was added
(design.md § S7) — the document is assembled and escaped by hand. `shippingDate` is
a parameter, never a clock read. A `null` `catid`/`productid` renders as an empty
element rather than the string `"null"`. Calling with an empty `fulfilledItems`
array throws `InvoiceGenerationError` (the `XMLDocumentException` counterpart) since
no document can be built with no lines.

## Files touched

- `fulfillment/invoice.ts` (new) — `createInvoice` and the private `escapeXml`/
  `lineItemXml` helpers.
- `fulfillment/invoice.test.ts` (new) — 8 unit tests.
- `artifacts/SWHM-S-0017/SWHM-T-0189/tdd-test-result.md` (new)
- `artifacts/SWHM-S-0017/SWHM-T-0189/summary.md` (new)

No other file was modified — `fulfillment/types.ts`, `fulfillment/errors.ts`, other
`fulfillment/` modules, and `package.json` are untouched, per the ticket's ownership
boundary.

## Acceptance criteria coverage

- AC "Invoice includes order metadata" (poId, userId, poDate, shipping date): VT-01.
- AC "Invoice is generated with line item details" (using the scenario's own
  figures: itemId=1001, categoryId=CATS, productId=CAT-005, lineNumber=1,
  quantity=2, unitPrice=29.99): VT-02.

## Verification

```
$ bun run test -- fulfillment/invoice.test.ts   → 1 file, 8 tests passed
$ bun run verify:full
  lint     → pass
  typecheck→ pass
  test     → 103 files, 655 tests passed
  test:e2e → Chromium not installed in this container (documented gap, see
             AGENTS.md § Notes from previous agents); not retried, runs in CI/QA
```

## Notes

- `escapeXml` and `lineItemXml` are private — the module exports only
  `createInvoice`, per the fixed interface contract. Escaping is exercised
  through `createInvoice`'s output (VT-04, VT-05), not tested directly.
- The XML element shape (`<invoice><poId>…</poId>…<lineItems><lineItem>…`) is
  invented for this ticket, since no legacy schema (`TPAInvoiceXDE`) exists in
  this product (design.md § S7) — nothing parses or displays this document, so
  no schema is fixed elsewhere it must match.
