// Fixed in artifacts/SWHM-S-0017/SWHM-T-0189/PLAN.md § Fixed interface
// contracts (design.md § Decisions D7, § Spec discrepancies S7).
//
// No XML dependency exists in this product and none is added here — the
// document is built as a string with its own escaping. The format stays
// XML because that is what the requirement names; nothing displays,
// stores or transmits the result (D7), and nothing here reads a clock or
// a database — the shipping date is a parameter.
import { InvoiceGenerationError } from "./errors";
import type { FulfillmentLine, InvoiceOrder } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// catid/productid are nullable on the line (F1) — an empty element, not
// the string "null", is what a missing value renders as.
function lineItemXml(line: FulfillmentLine): string {
  return [
    "    <lineItem>",
    `      <lineNumber>${line.lineNumber}</lineNumber>`,
    `      <itemId>${escapeXml(line.itemid)}</itemId>`,
    `      <categoryId>${line.catid !== null ? escapeXml(line.catid) : ""}</categoryId>`,
    `      <productId>${line.productid !== null ? escapeXml(line.productid) : ""}</productId>`,
    `      <quantity>${line.quantity}</quantity>`,
    `      <unitPrice>${line.unitPrice}</unitPrice>`,
    "    </lineItem>",
  ].join("\n");
}

export function createInvoice(
  order: InvoiceOrder,
  fulfilledItems: FulfillmentLine[],
  shippingDate: Date,
): string {
  if (fulfilledItems.length === 0) {
    throw new InvoiceGenerationError("Cannot generate an invoice with no fulfilled line items.");
  }

  const lineItemsXml = fulfilledItems.map(lineItemXml).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<invoice>",
    `  <poId>${order.orderId}</poId>`,
    `  <userId>${escapeXml(order.userName)}</userId>`,
    `  <poDate>${order.orderDate.toISOString()}</poDate>`,
    `  <shippingDate>${shippingDate.toISOString()}</shippingDate>`,
    "  <lineItems>",
    lineItemsXml,
    "  </lineItems>",
    "</invoice>",
  ].join("\n");
}
