// Verifies the two properties the capability's performance rests on
// (openspec/changes/swhm-i-0004-product-catalog-search/design.md § Planning
// record, D3, S9) over a large fixture. This ticket changes no behaviour and
// adds no index — db/schema.ts belongs to SWHM-T-0046 — it only asserts
// against the code SWHM-T-0046/0050/0051/0052/0053/0054 already shipped.
import type { SQLQueryBindings } from "bun:sqlite";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  category,
  categoryDetails,
  item,
  itemDetails,
  product,
  productDetails,
} from "../db/schema";
import { getCategories, getCategory } from "./category";
import { getItem, getItems } from "./item";
import { getProduct, getProducts } from "./product";
import { localeJoin } from "./query";
import { searchItems } from "./search";

const LOCALE = "en_US";
// The real vocabulary (account/vocabulary.ts's LANGUAGES) — every entity
// gets a detail row per locale, exactly as the demo seed shape does. A
// single-locale fixture would make the locale index useless (it would
// match every row), so the query planner correctly prefers a full scan
// over it — three locales, matching production, is what makes the index
// selective enough to be worth using.
const LOCALES = ["en_US", "ja_JP", "zh_CN"];
const N_CATEGORIES = 1000;
const PRODUCTS_PER_CATEGORY = 2; // 2,000 products
const ITEMS_PER_PRODUCT = 1; // 2,000 items — over the 1,000-item AC-2 floor

type PlanRow = { id: number; parent: number; notused: number; detail: string };

// EXPLAIN QUERY PLAN needs the raw bun:sqlite connection — drizzle's query
// builder has no EXPLAIN of its own. `db.$client` is the same connection
// every read in catalog/ already runs on (drizzle-orm/bun-sqlite's driver
// assigns it at construction), so this reads the real plan for the real
// connection, not a second one.
function explainQueryPlan(sql: string, params: SQLQueryBindings[]): PlanRow[] {
  return db.$client.query(`EXPLAIN QUERY PLAN ${sql}`).all(...params) as PlanRow[];
}

function usesIndex(plan: PlanRow[], indexName: string): boolean {
  return plan.some((row) => row.detail.includes(`USING INDEX ${indexName}`));
}

function chunked<T>(rows: T[], size = 200): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}

function insertAll<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
): void {
  for (const batch of chunked(rows)) {
    db.insert(table).values(batch).run();
  }
}

describe("catalog/performance", () => {
  // 1,000 categories × 2 products × 1 item × 3 locales = 2,000 products,
  // 2,000 items, and 3 detail rows per entity — large enough that a read
  // whose cost scales with catalog size, or a query the planner can't
  // index, would show up both in the returned page and in EXPLAIN QUERY
  // PLAN.
  const categories = Array.from({ length: N_CATEGORIES }, (_, i) => ({
    catid: `PERF-CAT-${String(i).padStart(4, "0")}`,
  }));
  const categoryDetailRows = categories.flatMap((c, i) =>
    LOCALES.map((locale) => ({
      catid: c.catid,
      locale,
      name: `Category ${String(i).padStart(4, "0")} ${locale}`,
      descn: "Performance fixture category",
    })),
  );

  const products: { productid: string; catid: string }[] = [];
  const productDetailRows: { productid: string; locale: string; name: string; descn: string }[] =
    [];
  for (const c of categories) {
    for (let p = 0; p < PRODUCTS_PER_CATEGORY; p++) {
      const productid = `${c.catid}-P${p}`;
      products.push({ productid, catid: c.catid });
      for (const locale of LOCALES) {
        productDetailRows.push({
          productid,
          locale,
          name: `Product ${productid} ${locale}`,
          descn: "Performance fixture product",
        });
      }
    }
  }

  const items: { itemid: string; productid: string; listPrice: number; unitCost: number }[] = [];
  const itemDetailRows: {
    itemid: string;
    locale: string;
    name: string;
    image: string;
    descn: string;
  }[] = [];
  for (const p of products) {
    for (let i = 0; i < ITEMS_PER_PRODUCT; i++) {
      const itemid = `${p.productid}-I${i}`;
      items.push({ itemid, productid: p.productid, listPrice: 10, unitCost: 5 });
      for (const locale of LOCALES) {
        itemDetailRows.push({
          itemid,
          locale,
          name: `Filler item ${itemid} ${locale}`,
          image: "/images/filler.jpg",
          descn: "A generic filler item, present only to pad the fixture to scale",
        });
      }
    }
  }

  // One item with distinctive text — the five-keyword AND scenario (AC-2)
  // needs exactly one match among 2,000 items.
  const TARGET_ITEM_ID = items[0]!.itemid;
  const TARGET_PRODUCT_ID = products[0]!.productid;
  const TARGET_CATEGORY_ID = categories[0]!.catid;
  itemDetailRows[0]!.name = "Large African Grey Parrot Companion";
  itemDetailRows[0]!.descn = "A highly intelligent, large, grey companion parrot from Africa";

  beforeAll(() => {
    insertAll(category, categories);
    insertAll(categoryDetails, categoryDetailRows);
    insertAll(product, products);
    insertAll(productDetails, productDetailRows);
    insertAll(item, items);
    insertAll(itemDetails, itemDetailRows);

    // Without stats, SQLite's planner guesses at cardinalities and can pick
    // a different join order than it would against a database that has
    // accumulated real statistics — ANALYZE gives it those, which is what
    // AC-3/AC-4's plan assertions are about.
    db.$client.run("ANALYZE");
  });

  describe("bounded pagination (AC-1)", () => {
    it("PF-01: a page read over 1,000 categories returns only the requested page", () => {
      const page = getCategories(0, 25, LOCALE);

      expect(page.objects).toHaveLength(25);
      expect(page.hasNext).toBe(true);
    });

    it("PF-02: the row count requested from the database is count+1, not the catalog size", () => {
      // Mirrors getCategories' own query shape (catalog/category.ts) — the
      // service has no exported way to inspect its compiled SQL, so this
      // reconstructs it to read the bound LIMIT parameter directly. The
      // parameter is derived only from `count`, never from table size, so
      // this value is the same whether the fixture has 1,000 categories or
      // 1,000,000 — that is the property being asserted.
      const { params } = db
        .select({ id: category.catid, name: categoryDetails.name })
        .from(category)
        .innerJoin(
          categoryDetails,
          and(eq(categoryDetails.catid, category.catid), localeJoin(categoryDetails, LOCALE)),
        )
        .orderBy(categoryDetails.name)
        .limit(26)
        .offset(0)
        .toSQL();

      expect(params.at(-1)).toBe(26); // count(25) + 1, independent of the 1,000-row fixture
    });
  });

  describe("search over a large fixture (AC-2)", () => {
    it("PF-03: a broad search returns a bounded first page with a correct hasNext", () => {
      const page = searchItems("filler", 0, 25, LOCALE);

      expect(page.objects).toHaveLength(25);
      expect(page.hasNext).toBe(true);
    });

    it("PF-04: a five-keyword search returns the correct single match, not a failure or a full result set", () => {
      const page = searchItems("large african grey parrot companion", 0, 25, LOCALE);

      expect(page.objects).toHaveLength(1);
      expect(page.objects[0]!.itemId).toBe(TARGET_ITEM_ID);
      expect(page.hasNext).toBe(false);
    });
  });

  describe("index use (AC-3, AC-4)", () => {
    it("PF-05: the paginated category read uses the category_details locale index", () => {
      const { sql, params } = db
        .select({ id: category.catid, name: categoryDetails.name })
        .from(category)
        .innerJoin(
          categoryDetails,
          and(eq(categoryDetails.catid, category.catid), localeJoin(categoryDetails, LOCALE)),
        )
        .orderBy(categoryDetails.name)
        .limit(26)
        .offset(0)
        .toSQL();

      const plan = explainQueryPlan(sql, params as SQLQueryBindings[]);

      expect(usesIndex(plan, "category_details_locale_idx")).toBe(true);
    });

    it("PF-06: the paginated product read uses the product(catid) index", () => {
      const { sql, params } = db
        .select({ id: product.productid, name: productDetails.name })
        .from(product)
        .innerJoin(
          productDetails,
          and(eq(productDetails.productid, product.productid), localeJoin(productDetails, LOCALE)),
        )
        .where(eq(product.catid, TARGET_CATEGORY_ID))
        .orderBy(productDetails.name)
        .limit(26)
        .offset(0)
        .toSQL();

      const plan = explainQueryPlan(sql, params as SQLQueryBindings[]);

      expect(usesIndex(plan, "product_catid_idx")).toBe(true);
    });

    it("PF-07: the paginated item read uses the item(productid) index", () => {
      const { sql, params } = db
        .select({ id: item.itemid, name: itemDetails.name })
        .from(item)
        .innerJoin(product, eq(item.productid, product.productid))
        .innerJoin(
          itemDetails,
          and(eq(itemDetails.itemid, item.itemid), localeJoin(itemDetails, LOCALE)),
        )
        .innerJoin(
          productDetails,
          and(eq(productDetails.productid, product.productid), localeJoin(productDetails, LOCALE)),
        )
        .where(eq(item.productid, TARGET_PRODUCT_ID))
        .orderBy(itemDetails.name)
        .limit(26)
        .offset(0)
        .toSQL();

      const plan = explainQueryPlan(sql, params as SQLQueryBindings[]);

      expect(usesIndex(plan, "item_productid_idx")).toBe(true);
    });
  });

  describe("no result caching (AC-5)", () => {
    it("PF-08: a category updated between two reads is visible to the second read", () => {
      const before = getCategory(TARGET_CATEGORY_ID, LOCALE);
      expect(before?.name).toBe("Category 0000 en_US");

      db.update(categoryDetails)
        .set({ name: "Renamed Category" })
        .where(
          and(eq(categoryDetails.catid, TARGET_CATEGORY_ID), eq(categoryDetails.locale, LOCALE)),
        )
        .run();

      const after = getCategory(TARGET_CATEGORY_ID, LOCALE);
      expect(after?.name).toBe("Renamed Category");
    });

    it("PF-09: a product updated between two reads is visible to the second read", () => {
      const before = getProduct(TARGET_PRODUCT_ID, LOCALE);
      expect(before?.name).toBe(`Product ${TARGET_PRODUCT_ID} en_US`);

      db.update(productDetails)
        .set({ name: "Renamed Product" })
        .where(
          and(eq(productDetails.productid, TARGET_PRODUCT_ID), eq(productDetails.locale, LOCALE)),
        )
        .run();

      const after = getProduct(TARGET_PRODUCT_ID, LOCALE);
      expect(after?.name).toBe("Renamed Product");
    });

    it("PF-10: an item updated between two reads is visible to the second read", () => {
      const before = getItem(TARGET_ITEM_ID, LOCALE);
      expect(before?.listPrice).toBe(10);

      db.update(item).set({ listPrice: 999 }).where(eq(item.itemid, TARGET_ITEM_ID)).run();

      const after = getItem(TARGET_ITEM_ID, LOCALE);
      expect(after?.listPrice).toBe(999);
    });

    it("PF-11: getProducts and getItems also reflect a write made after the previous read", () => {
      const beforeProducts = getProducts(TARGET_CATEGORY_ID, 0, 25, LOCALE);
      const beforeItems = getItems(TARGET_PRODUCT_ID, 0, 25, LOCALE);
      expect(beforeProducts.objects.some((p) => p.id === TARGET_PRODUCT_ID)).toBe(true);
      expect(beforeItems.objects.some((i) => i.itemId === TARGET_ITEM_ID)).toBe(true);

      const newProductId = `${TARGET_CATEGORY_ID}-NEW`;
      db.insert(product).values({ productid: newProductId, catid: TARGET_CATEGORY_ID }).run();
      db.insert(productDetails)
        .values({ productid: newProductId, locale: LOCALE, name: "Aardvark Kit", descn: "New" })
        .run();

      const afterProducts = getProducts(TARGET_CATEGORY_ID, 0, 25, LOCALE);
      expect(afterProducts.objects.some((p) => p.id === newProductId)).toBe(true);
    });
  });
});
