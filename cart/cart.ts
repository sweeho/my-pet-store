// Add + read, fixed in artifacts/SWHM-S-0013/SWHM-T-0134/PLAN.md § Fixed
// interface contracts. Appended to by SWHM-T-0135, SWHM-T-0136 and
// SWHM-T-0137 in that order — leave this module easy to extend.
import { db } from "../db/client";
import { getItem } from "../catalog/item";
import { DEFAULT_LOCALE } from "../catalog/locale";
import { deleteAllCartRows, deleteCartRow, readCartRows, upsertCartRow } from "./repository";
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

// A no-op for an item the cart does not hold — the delete matches zero rows,
// so there is nothing to probe for first (design.md, PLAN.md step 2).
export function removeItem(sessionId: string, itemId: string): Cart {
  deleteCartRow(sessionId, itemId);
  return getCart(sessionId);
}

// The zero-or-less removal rule lives here and nowhere else (design.md D7):
// every caller — including updateItems below — passes through this
// function rather than pre-filtering, so the rule cannot drift.
export function updateItem(sessionId: string, itemId: string, quantity: number): Cart {
  if (quantity <= 0) return removeItem(sessionId, itemId);

  upsertCartRow(sessionId, itemId, quantity);
  return getCart(sessionId);
}

// One db.transaction for the whole batch: a write failing partway leaves
// every quantity at its original value rather than a cart the shopper never
// asked for (design.md D7, PLAN.md step 2).
export function updateItems(
  sessionId: string,
  updates: { itemId: string; quantity: number }[],
): Cart {
  return db.transaction(() => {
    for (const update of updates) {
      updateItem(sessionId, update.itemId, update.quantity);
    }
    return getCart(sessionId);
  });
}

// An explicit call, never a database cascade (design.md D4, F4) — the two
// callers are the order-placement seam (SWHM-T-0140) and logout
// (SWHM-T-0141). Deliberately has no HTTP surface: nothing a shopper does
// empties a whole cart in one step.
export function clearCart(sessionId: string): void {
  deleteAllCartRows(sessionId);
}
