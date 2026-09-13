import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, item, product } from "../db/schema";
import { missingReason } from "./availability";

// missingReason answers a locale-independent question — does the entity row
// exist — so fixtures here never insert a details row at all (D1,
// PLAN.md § Steps 1).
describe("catalog/availability", () => {
  db.insert(category).values({ catid: "AV-CATEGORY" }).run();
  db.insert(product).values({ productid: "AV-PRODUCT", catid: "AV-CATEGORY" }).run();
  db.insert(item)
    .values({ itemid: "AV-ITEM", productid: "AV-PRODUCT", listPrice: 10, unitCost: 5 })
    .run();

  it("AV-01: a category row that exists reports missing-translation", () => {
    expect(missingReason("category", "AV-CATEGORY")).toBe("missing-translation");
  });

  it("AV-02: a category id with no row reports not-found", () => {
    expect(missingReason("category", "AV-NO-SUCH-CATEGORY")).toBe("not-found");
  });

  it("AV-03: a product row that exists reports missing-translation", () => {
    expect(missingReason("product", "AV-PRODUCT")).toBe("missing-translation");
  });

  it("AV-04: a product id with no row reports not-found", () => {
    expect(missingReason("product", "AV-NO-SUCH-PRODUCT")).toBe("not-found");
  });

  it("AV-05: an item row that exists reports missing-translation", () => {
    expect(missingReason("item", "AV-ITEM")).toBe("missing-translation");
  });

  it("AV-06: an item id with no row reports not-found", () => {
    expect(missingReason("item", "AV-NO-SUCH-ITEM")).toBe("not-found");
  });
});
