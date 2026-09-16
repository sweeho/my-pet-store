// The seam swhm-i-0008-order-submission-checkout calls at order placement,
// fixed in artifacts/SWHM-S-0013/SWHM-T-0140/PLAN.md § Fixed interface
// contracts. Built, tested and called by nobody yet (design.md S8) — order
// creation itself is that idea's, not this one's.
import { clearCart, getCart } from "./cart";

export type OrderLineItem = {
  itemid: string;
  quantity: number;
  unitPrice: number;
  lineNumber: number;
};

// unitPrice is the cart line's unitCost captured now, never a later
// reference back to item.unit_cost — a line item records the price paid,
// and re-reading the current price would silently restate history
// (design.md, PLAN.md step 2). lineNumber is assigned from 1 upward,
// matching the (order_id, line_number) key order_line_item declares;
// order_id belongs to the caller creating the order, not to this function.
export function toOrderLineItems(sessionId: string): OrderLineItem[] {
  return getCart(sessionId).items.map((cartItem, index) => ({
    itemid: cartItem.itemId,
    quantity: cartItem.quantity,
    unitPrice: cartItem.unitCost,
    lineNumber: index + 1,
  }));
}

// Named seam so the future order-placement caller has one thing to call;
// delegates to clearCart (SWHM-T-0137) rather than deleting rows itself, so
// the clearing rule stays in one place.
export function clearCartAfterOrder(sessionId: string): void {
  clearCart(sessionId);
}
