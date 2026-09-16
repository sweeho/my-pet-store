// Order creation — writes the order row (design.md § Decisions D2, D4;
// § Spec discrepancies S6, S10, S11, S14). Leave this module easy to
// extend: SWHM-T-0157 appends line item creation and SWHM-T-0158 appends
// cart clearing, both inside the transaction that arrives with SWHM-T-0158
// (§ Scope boundary — no partial transaction here).
import { db } from "../db/client";
import { orders } from "../db/schema";
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
