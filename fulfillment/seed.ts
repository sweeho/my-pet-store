// Development stock (design.md § Spec discrepancies S14; § Codebase
// findings F14). Every catalogue item gets the same starting quantity —
// the figure is demo data, not a product decision — so a development
// database built from empty holds non-zero stock for everything the
// catalogue seed created. Called from db/client.ts behind the same
// !process.env.VITEST guard and emptiness check the catalogue seed uses,
// so a database built under Vitest gains no inventory rows (D5: a missing
// row already reads as zero, so tests never need one).
import { db } from "../db/client";
import { inventory, item } from "../db/schema";

const STARTING_QUANTITY = 100;

export function seedInventory(): void {
  const items = db.select({ itemid: item.itemid }).from(item).all();

  if (items.length === 0) {
    return;
  }

  db.insert(inventory)
    .values(items.map((i) => ({ itemid: i.itemid, quantity: STARTING_QUANTITY })))
    .run();
}
