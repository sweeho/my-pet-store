// Add + read, fixed in artifacts/SWHM-S-0013/SWHM-T-0134/PLAN.md § Fixed
// interface contracts. Appended to by SWHM-T-0135, SWHM-T-0136 and
// SWHM-T-0137 in that order — leave this module easy to extend.
import { getItem } from "../catalog/item";
import { DEFAULT_LOCALE } from "../catalog/locale";
import { readCartRows, upsertCartRow } from "./repository";
import type { Cart, CartItem } from "./types";

export class UnknownItemError extends Error {}

// A row whose item the catalogue no longer has resolves to null (getItem's
// inner joins drop it, catalog/item.ts F6) and is left out of the cart
// rather than crashing the read.
function toCartItem(itemId: string, quantity: number): CartItem | null {
  const found = getItem(itemId, DEFAULT_LOCALE);
  if (!found) return null;

  return {
    itemId: found.itemId,
    productName: found.productName,
    description: found.description,
    unitCost: found.unitCost,
    quantity,
    lineTotal: found.unitCost * quantity,
  };
}

// count and subtotal are derived on read, never stored (design.md D6);
// count is the number of distinct lines, not the sum of quantities
// (design.md D5, S7).
export function getCart(sessionId: string): Cart {
  const items = readCartRows(sessionId)
    .map((row) => toCartItem(row.itemid, row.quantity))
    .filter((cartItem): cartItem is CartItem => cartItem !== null);

  return {
    items,
    count: items.length,
    subtotal: items.reduce((sum, cartItem) => sum + cartItem.lineTotal, 0),
  };
}

export function addItem(sessionId: string, itemId: string, quantity = 1): Cart {
  if (!getItem(itemId, DEFAULT_LOCALE)) {
    throw new UnknownItemError(`Unknown item: ${itemId}`);
  }

  const existing = readCartRows(sessionId).find((row) => row.itemid === itemId);
  upsertCartRow(sessionId, itemId, (existing?.quantity ?? 0) + quantity);

  return getCart(sessionId);
}
