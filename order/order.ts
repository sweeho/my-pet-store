// Order creation — writes the order row (design.md § Decisions D2, D4;
// § Spec discrepancies S6, S10, S11, S14), and (SWHM-T-0158) wraps the
// whole placement — order insert, line item inserts, cart clear — in one
// db.transaction() so a failure partway leaves neither a partial order nor
// a cleared cart behind (legacy-analysis/rebuild-guidance.md:98,
// design.md § Decisions D4).
import { eq } from "drizzle-orm";

import { getCart } from "../cart/cart";
import { clearCartAfterOrder, toOrderLineItems } from "../cart/checkout";
import { db } from "../db/client";
import { orderLineItem, orders, profiles } from "../db/schema";
import { decideApproval } from "./approval";
import type { ApprovalLocale } from "./approval-types";
import { ShoppingCartEmptyOrderError } from "./errors";
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

// preferredLanguage is validated at write time against account/vocabulary.ts's
// LANGUAGES (account/validation.ts), the exact set ApprovalLocale
// enumerates, so this narrows a validated column rather than trusting an
// unchecked value. A customer with no profile row resolves to null, which
// decideApproval treats as no threshold — stays PENDING (design.md §
// Decisions D2).
function resolvePlacementLocale(userName: string): ApprovalLocale | null {
  const profile = db
    .select({ preferredLanguage: profiles.preferredLanguage })
    .from(profiles)
    .where(eq(profiles.userName, userName))
    .get();

  return (profile?.preferredLanguage ?? null) as ApprovalLocale | null;
}

// userName comes from the caller (the route's resolved session), never from
// the submission body — an order placed on someone else's account is the
// failure this prevents (design.md § Steps 3). sessionId identifies the
// shopper's cart (cart_items is keyed on session id, never username) — the
// route's caller resolves it the same way it resolves userName, from the
// signed-on session.
//
// One db.transaction covers all three writes (PLAN.md step 3; F11
// precedent: cart/cart.ts's updateItems, admin/order-status.ts). If the
// order insert or a line item insert throws, the whole transaction rolls
// back — no partial order, no orphaned line item, and clearCartAfterOrder
// never runs, so a failed placement leaves the cart intact for a retry.
export function placeOrder(
  userName: string,
  submission: OrderSubmission,
  sessionId: string,
): PlaceOrderResult {
  // Checked before any write, so a refusal leaves orders/order_line_item
  // untouched (design.md § Spec discrepancies S5; PLAN.md step 2) — cheaper
  // than relying on the transaction below to roll back a write that never
  // needed to happen. count is derived on read (cart/cart.ts's getCart), so
  // there is no separate emptiness flag to consult.
  const cart = getCart(sessionId);
  if (cart.count === 0) {
    throw new ShoppingCartEmptyOrderError();
  }

  // The locale is copied from the profile at placement, never resolved at
  // decision time (design.md § Decisions D2), and the amount decided on is
  // the cart's subtotal — the same total createLineItems below writes onto
  // the row as order_amount (SWHM-T-0204 PLAN.md step 4).
  const locale = resolvePlacementLocale(userName);
  const status = decideApproval(locale, cart.subtotal);

  return db.transaction(() => {
    const { orderId } = db
      .insert(orders)
      .values({
        userName,
        orderDate: new Date(),
        orderAmount: ORDER_AMOUNT_PLACEHOLDER,
        status,
        locale,
        ...billingColumns(submission.billingAddress),
        ...shippingColumns(submission.shippingAddress),
      })
      .returning({ orderId: orders.orderId })
      .get();

    createLineItems(orderId, sessionId);

    // Cleared only after creation succeeds, and only through the cart
    // capability's own seam — order/ issues no delete against cart_items
    // of its own (§ Codebase findings F3; PLAN.md step 1).
    clearCartAfterOrder(sessionId);

    return { orderId, email: submission.billingAddress.email! };
  });
}

// Turns the cart into the order's line items and totals the order from
// them (design.md § Steps 2, 5; § Decisions D5, D9). Calls the seam
// cart/checkout.ts already exports rather than re-reading cart_items or
// reimplementing the mapping (PLAN.md step 1). Called by placeOrder inside
// its transaction, and kept independently exported and callable (as the
// createLineItems tests below exercise directly) — SWHM-T-0157's original
// design this ticket builds on rather than replaces.
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
