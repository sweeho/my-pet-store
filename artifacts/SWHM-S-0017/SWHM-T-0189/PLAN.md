# PLAN — SWHM-T-0189

**Task group:** `## 5. Invoice Generation` (checkboxes 5.1–5.7)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirement:** Generate XML invoices for fulfilled items (ADDED)

## Objective

Build the invoice document for the lines a fulfilment run shipped. **Read `design.md` first**, from `## Codebase findings` down — S7 is the whole shape of this ticket: there is no XML dependency in this product (F13), `TPAInvoiceXDE` does not exist, and the format stays XML because that is what the requirement names (D7).

## Design reference

`artifacts/SWHM-S-0017/design/` — see `MANIFEST.md`. No screen shows an invoice; neither mockup renders one, and nothing displays, stores or sends the document (D7). It is a return value.

## Steps

1. **Write `fulfillment/invoice.ts`** with the one export fixed below. Build the document as a string — no dependency is added (S7).
2. **Escape every interpolated value.** A category id, an item id or a username reaching the document unescaped produces a document that is not XML, which is a defect no type catches. One small private `escapeXml` in this module, covered by its own assertion, including `&`, `<`, `>` and `"`.
3. **Carry the order metadata the scenario names**: `poId` (the order id), `userId` (the order's username), `poDate` (the order date) and the shipping date. The shipping date is a **parameter**, not `new Date()` read inside the function — a function that reads the clock cannot be asserted against a fixed document.
4. **Carry every field of every fulfilled line**: `categoryId`, `productId`, `itemId`, `lineNumber`, `quantity`, `unitPrice`. `catid` and `productid` are nullable on the line (F1); emit an empty element rather than the string `null`.
5. **Throw `InvoiceGenerationError`** (from `fulfillment/errors.ts`, SWHM-T-0187) where a document cannot be built — this is 5.7's `XMLDocumentException` counterpart (S7). Do not invent a second error type.
6. **Assert the document, not its length.** Parse or match the produced string for each required value; an assertion that only checks the string is non-empty passes on a broken document.

## Fixed interface contracts

```ts
export function createInvoice(
  order: InvoiceOrder,
  fulfilledItems: FulfillmentLine[],
  shippingDate: Date,
): string;
```

`InvoiceOrder` and `FulfillmentLine` come from `fulfillment/types.ts` (SWHM-T-0187). The caller decides whether an invoice is produced at all — a run that fulfils nothing never calls this function (SWHM-T-0192).

## File / module ownership

Create or modify only:

- `fulfillment/invoice.ts` (new)
- `fulfillment/invoice.test.ts` (new)

Do not modify `fulfillment/types.ts`, `fulfillment/errors.ts`, or any other `fulfillment/` module — three sibling tickets are writing theirs in parallel. Add no dependency to `package.json`.

## Definition of Done

- AC-1 and AC-2 hold, each evidenced by the assertion that carries it. AC-1's figures are the scenario's: `itemId=1001`, `categoryId=CATS`, `productId=CAT-005`, `lineNumber=1`, `quantity=2`, `unitPrice=29.99`.
- Every value interpolated into the document is escaped, asserted on a value containing `&` and `<`.
- The function reads no clock and no database.
