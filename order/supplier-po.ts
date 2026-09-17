// Supplier PO generation on approval (design.md § Decisions D4, D6, D7;
// § Spec discrepancies S2). Two rows, not an XML document — no XML
// dependency and no queue exist in this product, and none is introduced
// here; the PO record existing where fulfilment reads it is what "sent to
// the supplier queue" means (S2). No transaction is opened here — the
// caller's covers it, the same shape order/status.ts and
// fulfillment/status.ts use for reads on this table.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { orderLineItem, orders, supplierPo, supplierPoLineItem } from "../db/schema";
import type { SupplierPurchaseOrder } from "./approval-types";
import type { OrderAddress } from "./types";

// poDate defaults to the moment of the call so a test can fix it —
// fulfillment/fulfillment.ts's shippingDate parameter is the same pattern.
export function createSupplierPo(
  orderId: number,
  poDate: Date = new Date(),
): SupplierPurchaseOrder {
  // The caller (order/decision.ts) only reaches this after confirming the
  // order exists and is PENDING, so an unmatched id here would be a defect
  // in the caller, not a case this module needs to handle.
  const order = db
    .select({
      shippingGivenName: orders.shippingGivenName,
      shippingFamilyName: orders.shippingFamilyName,
      shippingTelephone: orders.shippingTelephone,
      shippingEmail: orders.shippingEmail,
      shippingStreetName1: orders.shippingStreetName1,
      shippingStreetName2: orders.shippingStreetName2,
      shippingCity: orders.shippingCity,
      shippingState: orders.shippingState,
      shippingZipCode: orders.shippingZipCode,
      shippingCountry: orders.shippingCountry,
    })
    .from(orders)
    .where(eq(orders.orderId, orderId))
    .get()!;

  const shippingAddress: OrderAddress = {
    givenName: order.shippingGivenName,
    familyName: order.shippingFamilyName,
    telephone: order.shippingTelephone,
    email: order.shippingEmail,
    streetName1: order.shippingStreetName1,
    streetName2: order.shippingStreetName2,
    city: order.shippingCity,
    state: order.shippingState,
    zipCode: order.shippingZipCode,
    country: order.shippingCountry,
  };

  db.insert(supplierPo)
    .values({
      orderId,
      poDate,
      shippingGivenName: shippingAddress.givenName,
      shippingFamilyName: shippingAddress.familyName,
      shippingTelephone: shippingAddress.telephone,
      shippingEmail: shippingAddress.email,
      shippingStreetName1: shippingAddress.streetName1,
      shippingStreetName2: shippingAddress.streetName2,
      shippingCity: shippingAddress.city,
      shippingState: shippingAddress.state,
      shippingZipCode: shippingAddress.zipCode,
      shippingCountry: shippingAddress.country,
    })
    .run();

  const lines = db
    .select({
      lineNumber: orderLineItem.lineNumber,
      catid: orderLineItem.catid,
      productid: orderLineItem.productid,
      itemid: orderLineItem.itemid,
      quantity: orderLineItem.quantity,
      unitPrice: orderLineItem.unitPrice,
    })
    .from(orderLineItem)
    .where(eq(orderLineItem.orderId, orderId))
    .all();

  if (lines.length > 0) {
    db.insert(supplierPoLineItem)
      .values(
        lines.map((line) => ({
          orderId,
          lineNumber: line.lineNumber,
          catid: line.catid,
          productid: line.productid,
          itemid: line.itemid,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      )
      .run();
  }

  return { orderId, poDate, shippingAddress };
}
