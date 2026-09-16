// Order creation — writes the order row (design.md § Decisions D2, D4;
// § Spec discrepancies S6, S10, S11, S14). Leave this module easy to
// extend: SWHM-T-0157 appends line item creation and SWHM-T-0158 appends
// cart clearing, both inside the transaction that arrives with SWHM-T-0158
// (§ Scope boundary — no partial transaction here).
import { eq } from "drizzle-orm";

import { toOrderLineItems } from "../cart/checkout";
import { db } from "../db/client";
import { orderLineItem, orders } from "../db/schema";
import type { OrderAddress } from "./types";
import type { OrderSubmission } from "./validation";

export type PlaceOrderResult = {
  orderId: number;
  email: string;
};

// order_amount is NOT NULL with no default; SWHM-T-0157 overwrites this
// placeholder once it totals the line items (§ Steps 8 — do not assert 0
// here, that value is not this ticket's to own).
const ORDER_AMOUNT_PLACEHOLDER = 0;

function billingColumns(address: Partial<OrderAddress>) {
  return {
    billingGivenName: address.givenName ?? null,
    billingFamilyName: address.familyName ?? null,
    billingTelephone: address.telephone ?? null,
    billingEmail: address.email ?? null,
    billingStreetName1: address.streetName1 ?? null,
    billingStreetName2: address.streetName2 ?? null,
    billingCity: address.city ?? null,
    billingState: address.state ?? null,
    billingZipCode: address.zipCode ?? null,
    billingCountry: address.country ?? null,
  };
}

function shippingColumns(address: Partial<OrderAddress>) {
  return {
    shippingGivenName: address.givenName ?? null,
    shippingFamilyName: address.familyName ?? null,
    shippingTelephone: address.telephone ?? null,
    shippingEmail: address.email ?? null,
    shippingStreetName1: address.streetName1 ?? null,
    shippingStreetName2: address.streetName2 ?? null,
    shippingCity: address.city ?? null,
    shippingState: address.state ?? null,
    shippingZipCode: address.zipCode ?? null,
    shippingCountry: address.country ?? null,
  };
}

// userName comes from the caller (the route's resolved session), never from
// the submission body — an order placed on someone else's account is the
// failure this prevents (design.md § Steps 3).
export function placeOrder(userName: string, submission: OrderSubmission): PlaceOrderResult {
  const { orderId } = db
    .insert(orders)
    .values({
      userName,
      orderDate: new Date(),
      orderAmount: ORDER_AMOUNT_PLACEHOLDER,
      status: "PENDING",
      ...billingColumns(submission.billingAddress),
      ...shippingColumns(submission.shippingAddress),
    })
    .returning({ orderId: orders.orderId })
    .get();

  return { orderId, email: submission.billingAddress.email! };
}

// Turns the cart into the order's line items and totals the order from
// them (design.md § Steps 2, 5; § Decisions D5, D9). Calls the seam
// cart/checkout.ts already exports rather than re-reading cart_items or
// reimplementing the mapping (PLAN.md step 1); the caller still owns
// wrapping this with placeOrder and clearing the cart in one transaction
// (SWHM-T-0158 — § Scope boundary, no partial transaction here).
export function createLineItems(orderId: number, sessionId: string): void {
  const lines = toOrderLineItems(sessionId);

  if (lines.length > 0) {
    db.insert(orderLineItem)
      .values(
        lines.map((line) => ({
          orderId,
          lineNumber: line.lineNumber,
          itemid: line.itemid,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          catid: line.catid,
          productid: line.productid,
        })),
      )
      .run();
  }

  // order_amount is the cart's subtotal at the moment of placement — the
  // same quantity × unitPrice arithmetic cart/cart.ts's getCart already
  // does for the cart's own subtotal (§ Decisions D9: money stays `real`,
  // this ticket does not settle a representation).
  const orderAmount = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  db.update(orders).set({ orderAmount }).where(eq(orders.orderId, orderId)).run();
}
