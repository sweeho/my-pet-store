// The seam swhm-i-0008-order-submission-checkout calls at order placement,
// fixed in artifacts/SWHM-S-0013/SWHM-T-0140/PLAN.md § Fixed interface
// contracts. Built, tested and called by nobody yet (design.md S8) — order
// creation itself is that idea's, not this one's.
import { getItem } from "../catalog/item";
import { DEFAULT_LOCALE } from "../catalog/locale";
import { clearCart, getCart, UnknownItemError } from "./cart";

export type OrderLineItem = {
  itemid: string;
  quantity: number;
  unitPrice: number;
  lineNumber: number;
  catid: string;
  productid: string;
};

// unitPrice is the cart line's unitCost captured now, never a later
// reference back to item.unit_cost — a line item records the price paid,
// and re-reading the current price would silently restate history
// (design.md, PLAN.md step 2). lineNumber is assigned from 1 upward,
// matching the (order_id, line_number) key order_line_item declares;
// order_id belongs to the caller creating the order, not to this function.
// catid/productid are not on CartItem (the cart stores quantity only,
// design.md § Codebase findings F4) so this resolves them from the
// catalogue directly, same as unitPrice: stored at placement time rather
// than joined later (§ Decisions D5).
export function toOrderLineItems(sessionId: string): OrderLineItem[] {
  return getCart(sessionId).items.map((cartItem, index) => {
    const found = getItem(cartItem.itemId, DEFAULT_LOCALE);
    // getCart already dropped any cart line whose item the catalogue can't
    // resolve (cart/cart.ts's toCartItem), so this only fires if the item
    // was removed from the catalogue between that read and this one.
    if (!found) throw new UnknownItemError(`Unknown item: ${cartItem.itemId}`);

    return {
      itemid: cartItem.itemId,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unitCost,
      lineNumber: index + 1,
      catid: found.category,
      productid: found.productId,
    };
  });
}

// Named seam so the future order-placement caller has one thing to call;
// delegates to clearCart (SWHM-T-0137) rather than deleting rows itself, so
// the clearing rule stays in one place.
export function clearCartAfterOrder(sessionId: string): void {
  clearCart(sessionId);
}
