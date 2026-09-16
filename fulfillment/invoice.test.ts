import { describe, expect, it } from "vitest";

import { InvoiceGenerationError } from "./errors";
import { createInvoice } from "./invoice";
import type { FulfillmentLine, InvoiceOrder } from "./types";

/**
 * UNIT TEST
 *
 * createInvoice is a pure string builder — no db, no clock (PLAN.md steps
 * 3, 6). Values are asserted by extracting each element's content, not by
 * checking the string is merely non-empty.
 */

function tagContent(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml);
  if (!match) {
    throw new Error(`<${tag}> not found in: ${xml}`);
  }
  return match[1];
}

const ORDER: InvoiceOrder = {
  orderId: 1001,
  userName: "alice",
  orderDate: new Date("2024-01-01T00:00:00.000Z"),
};
const SHIPPING_DATE = new Date("2024-01-02T00:00:00.000Z");

function line(overrides: Partial<FulfillmentLine> = {}): FulfillmentLine {
  return {
    orderId: 1001,
    lineNumber: 1,
    itemid: "1001",
    catid: "CATS",
    productid: "CAT-005",
    quantity: 2,
    quantityShipped: 2,
    unitPrice: 29.99,
    ...overrides,
  };
}

describe("fulfillment/invoice", () => {
  // AC "Invoice includes order metadata": poId, userId, poDate, current shipping date.
  it("VT-01: the invoice includes poId, userId, poDate and shippingDate (AC: invoice includes order metadata)", () => {
    const xml = createInvoice(ORDER, [line()], SHIPPING_DATE);

    expect(tagContent(xml, "poId")).toBe("1001");
    expect(tagContent(xml, "userId")).toBe("alice");
    expect(tagContent(xml, "poDate")).toBe(ORDER.orderDate.toISOString());
    expect(tagContent(xml, "shippingDate")).toBe(SHIPPING_DATE.toISOString());
  });

  // AC "Invoice is generated with line item details": the scenario's own figures.
  it("VT-02: the invoice includes every field of a fulfilled line item (AC: invoice is generated with line item details)", () => {
    const xml = createInvoice(
      ORDER,
      [
        line({
          itemid: "1001",
          catid: "CATS",
          productid: "CAT-005",
          lineNumber: 1,
          quantity: 2,
          unitPrice: 29.99,
        }),
      ],
      SHIPPING_DATE,
    );

    expect(tagContent(xml, "itemId")).toBe("1001");
    expect(tagContent(xml, "categoryId")).toBe("CATS");
    expect(tagContent(xml, "productId")).toBe("CAT-005");
    expect(tagContent(xml, "lineNumber")).toBe("1");
    expect(tagContent(xml, "quantity")).toBe("2");
    expect(tagContent(xml, "unitPrice")).toBe("29.99");
  });

  it("VT-03: shippingDate is the parameter's value, not a clock read", () => {
    const fixedShippingDate = new Date("2030-06-15T12:00:00.000Z");

    const xml = createInvoice(ORDER, [line()], fixedShippingDate);

    expect(tagContent(xml, "shippingDate")).toBe("2030-06-15T12:00:00.000Z");
  });

  it("VT-04: a null catid or productid is emitted as an empty element, not the string 'null'", () => {
    const xml = createInvoice(ORDER, [line({ catid: null, productid: null })], SHIPPING_DATE);

    expect(tagContent(xml, "categoryId")).toBe("");
    expect(tagContent(xml, "productId")).toBe("");
    expect(xml).not.toMatch(/null/);
  });

  it("VT-05: '&', '<', '>' and '\"' in an interpolated value are escaped", () => {
    const xml = createInvoice(
      { ...ORDER, userName: `Tom & Jerry <script>"x"</script>` },
      [line()],
      SHIPPING_DATE,
    );

    expect(tagContent(xml, "userId")).toBe(
      "Tom &amp; Jerry &lt;script&gt;&quot;x&quot;&lt;/script&gt;",
    );
    expect(xml).not.toContain("<script>");
  });

  it("VT-06: every fulfilled line appears in the document", () => {
    const xml = createInvoice(
      ORDER,
      [line({ lineNumber: 1, itemid: "1001" }), line({ lineNumber: 2, itemid: "1002" })],
      SHIPPING_DATE,
    );

    expect(xml).toContain("<itemId>1001</itemId>");
    expect(xml).toContain("<itemId>1002</itemId>");
  });

  it("VT-07: createInvoice throws InvoiceGenerationError when no line items were fulfilled", () => {
    expect(() => createInvoice(ORDER, [], SHIPPING_DATE)).toThrow(InvoiceGenerationError);
  });

  it("VT-08: createInvoice is deterministic given the same arguments (no clock, no database read)", () => {
    const first = createInvoice(ORDER, [line()], SHIPPING_DATE);
    const second = createInvoice(ORDER, [line()], SHIPPING_DATE);

    expect(first).toBe(second);
  });
});
