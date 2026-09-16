// Row-level access only, fixed in artifacts/SWHM-S-0013/SWHM-T-0133/PLAN.md
// § Fixed interface contracts. No price lookup, no derivation, no session
// resolution — those belong to cart/cart.ts (SWHM-T-0134) and the routes.
// upsertCartRow sets the quantity rather than adding to it; "adding a
// duplicate raises the quantity" is addItem's rule, not this module's.
import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { cartItems } from "../db/schema";

export function readCartRows(sessionId: string): { itemid: string; quantity: number }[] {
  return db
    .select({ itemid: cartItems.itemid, quantity: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.sessionId, sessionId))
    .all();
}

export function upsertCartRow(sessionId: string, itemId: string, quantity: number): void {
  db.insert(cartItems)
    .values({ sessionId, itemid: itemId, quantity })
    .onConflictDoUpdate({
      target: [cartItems.sessionId, cartItems.itemid],
      set: { quantity },
    })
    .run();
}

export function deleteCartRow(sessionId: string, itemId: string): void {
  db.delete(cartItems)
    .where(and(eq(cartItems.sessionId, sessionId), eq(cartItems.itemid, itemId)))
    .run();
}

export function deleteAllCartRows(sessionId: string): void {
  db.delete(cartItems).where(eq(cartItems.sessionId, sessionId)).run();
}
