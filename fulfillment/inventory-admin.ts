// Fixed in artifacts/SWHM-S-0017/SWHM-T-0195/PLAN.md § Fixed interface
// contracts (design.md D5, D9; F6). A different concern from
// fulfillment/inventory.ts's checkInventory/reduceQuantity, which serve the
// fulfilment pass, not this screen — hence a separate module and a
// separate caller.
import { asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { inventory, item } from "../db/schema";
import { InvalidInventoryUpdateError } from "./errors";
import type { InventoryRow, InventoryUpdate, InventoryUpdateResult } from "./types";

// A left join, not a read of `inventory` alone — a catalogue item with no
// inventory row must still appear, showing 0 (D5), or the screen that
// exists to stock a never-stocked item can never show it.
export function listInventory(): InventoryRow[] {
  return db
    .select({ itemid: item.itemid, quantity: inventory.quantity })
    .from(item)
    .leftJoin(inventory, eq(inventory.itemid, item.itemid))
    .orderBy(asc(item.itemid))
    .all()
    .map((row) => ({ itemid: row.itemid, quantity: row.quantity ?? 0 }));
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 0;
}

// Writes inside one db.transaction and reports unknown item ids rather
// than dropping them, following admin/order-status.ts's established
// { updated, notFound } shape (F6). Only a row ticked by the caller ever
// appears in `updates` (D9) — this module does not decide that; it writes
// whatever batch it is given.
export function applyInventoryUpdates(updates: InventoryUpdate[]): InventoryUpdateResult {
  for (const update of updates) {
    if (!isValidQuantity(update.quantity)) {
      throw new InvalidInventoryUpdateError(
        `quantity for ${update.itemid} must be a non-negative integer`,
      );
    }
  }

  return db.transaction(() => {
    const updated: string[] = [];
    const notFound: string[] = [];

    for (const update of updates) {
      const exists = db
        .select({ itemid: item.itemid })
        .from(item)
        .where(eq(item.itemid, update.itemid))
        .get();

      if (!exists) {
        notFound.push(update.itemid);
        continue;
      }

      // Upsert: a never-stocked item gets its first inventory row here
      // (D5), a stocked one is overwritten.
      db.insert(inventory)
        .values({ itemid: update.itemid, quantity: update.quantity })
        .onConflictDoUpdate({ target: inventory.itemid, set: { quantity: update.quantity } })
        .run();
      updated.push(update.itemid);
    }

    return { updated, notFound };
  });
}
