import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { CATEGORIES } from "../account/vocabulary";
import { db } from "../db/client";
import { category, categoryDetails, item, itemDetails, product } from "../db/schema";
import { CATALOG_SEED, seedCatalog } from "./seed";

describe("catalog/seed", () => {
  // Vitest keeps one module (and one in-memory db) per test file, so seedCatalog
  // runs once for the whole suite rather than once per test — otherwise the
  // second call would violate the category table's primary key.
  beforeAll(() => {
    seedCatalog();
  });

  it("ST-01: seeds every category from CATEGORIES", () => {
    const rows = db.select().from(category).all();

    expect(rows.map((r) => r.catid).sort()).toEqual([...CATEGORIES].sort());
  });

  it("ST-02: DOGS is localized as Dogs (en_US) and 犬 (ja_JP)", () => {
    const en = db
      .select()
      .from(categoryDetails)
      .where(and(eq(categoryDetails.catid, "DOGS"), eq(categoryDetails.locale, "en_US")))
      .get();
    const ja = db
      .select()
      .from(categoryDetails)
      .where(and(eq(categoryDetails.catid, "DOGS"), eq(categoryDetails.locale, "ja_JP")))
      .get();

    expect(en?.name).toBe("Dogs");
    expect(ja?.name).toBe("犬");
  });

  it("ST-03: every category has en_US, ja_JP and zh_CN detail rows", () => {
    for (const catid of CATEGORIES) {
      const locales = db
        .select()
        .from(categoryDetails)
        .where(eq(categoryDetails.catid, catid))
        .all()
        .map((r) => r.locale)
        .sort();

      expect(locales).toEqual(["en_US", "ja_JP", "zh_CN"]);
    }
  });

  it("ST-04: every category has at least two products, each with at least two items", () => {
    for (const seedCategory of CATALOG_SEED) {
      expect(seedCategory.products.length).toBeGreaterThanOrEqual(2);
      for (const seedProduct of seedCategory.products) {
        expect(seedProduct.items.length).toBeGreaterThanOrEqual(2);
      }
    }

    const products = db.select().from(product).all();
    const items = db.select().from(item).all();

    expect(products.length).toBeGreaterThanOrEqual(CATEGORIES.length * 2);
    expect(items.length).toBeGreaterThanOrEqual(CATEGORIES.length * 4);
  });

  it("ST-05: an African Grey item matches both 'large' and 'african' in its searchable text", () => {
    const rows = db.select().from(itemDetails).where(eq(itemDetails.locale, "en_US")).all();
    const match = rows.find(
      (r) => r.name.toLowerCase().includes("african") && r.descn.toLowerCase().includes("large"),
    );

    expect(match).toBeDefined();
  });

  it("ST-06: a second parrot item matches 'parrot' but not 'african'", () => {
    const rows = db.select().from(itemDetails).where(eq(itemDetails.locale, "en_US")).all();
    const match = rows.find(
      (r) => r.name.toLowerCase().includes("parrot") && !r.name.toLowerCase().includes("african"),
    );

    expect(match).toBeDefined();
  });

  it("ST-07: no de_DE row exists for any entity", () => {
    expect(
      db.select().from(categoryDetails).where(eq(categoryDetails.locale, "de_DE")).all(),
    ).toEqual([]);
    expect(db.select().from(itemDetails).where(eq(itemDetails.locale, "de_DE")).all()).toEqual([]);
  });
});
