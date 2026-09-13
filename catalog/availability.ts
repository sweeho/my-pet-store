// Answers, for an entity kind and id, whether the entity row exists —
// locale-independent, because that is the one fact the entity table alone
// can settle (PLAN.md § Steps 1, D1). Callers get the discriminated reason
// itself, not a boolean, so the not-found/missing-translation mapping has
// exactly one definition.
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { category, item, product } from "../db/schema";

export type MissingReason = "not-found" | "missing-translation";

export function missingReason(kind: "category" | "product" | "item", id: string): MissingReason {
  const exists = ((): boolean => {
    switch (kind) {
      case "category":
        return (
          db.select({ id: category.catid }).from(category).where(eq(category.catid, id)).get() !==
          undefined
        );
      case "product":
        return (
          db
            .select({ id: product.productid })
            .from(product)
            .where(eq(product.productid, id))
            .get() !== undefined
        );
      case "item":
        return (
          db.select({ id: item.itemid }).from(item).where(eq(item.itemid, id)).get() !== undefined
        );
    }
  })();

  return exists ? "missing-translation" : "not-found";
}
