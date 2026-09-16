// Fixed in artifacts/SWHM-S-0017/SWHM-T-0188/PLAN.md § Fixed interface
// contracts (design.md § Decisions D3, D5). No transaction is opened here —
// processOrder (SWHM-T-0192) wraps the whole fulfilment pass in one
// db.transaction, and a nested one buys nothing (catalog/transaction.ts
// records the same reasoning for a read).
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { inventory } from "../db/schema";
import type { FulfillmentLine } from "./types";

// D5: a missing row means zero, not an error — an item nobody has stocked
// is never fulfilled.
export function getInventoryQuantity(itemid: string): number {
  const row = db.select().from(inventory).where(eq(inventory.itemid, itemid)).get();
  return row?.quantity ?? 0;
}

// checkInventory and reduceQuantity are one call, matching the legacy
// checkInventory shape (design.md § Fulfillment Processing): a successful
// check reduces the stock as its side effect; a failed one writes nothing.
// This is deliberate, not an oversight — a reader expecting a pure
// predicate is the failure this comment prevents.
export function checkInventory(line: FulfillmentLine): boolean {
  const held = getInventoryQuantity(line.itemid);

  if (held < line.quantity) {
    return false;
  }

  reduceQuantity(line.itemid, line.quantity);
  return true;
}

export function reduceQuantity(itemid: string, quantity: number): void {
  db.update(inventory)
    .set({ quantity: getInventoryQuantity(itemid) - quantity })
    .where(eq(inventory.itemid, itemid))
    .run();
}
