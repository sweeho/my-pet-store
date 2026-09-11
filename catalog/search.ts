// Full-text search of items, fixed in artifacts/SWHM-S-0004/INTERFACES.md §
// Retrieval services. The four searchable fields are the requirement text's
// own list — item name, product name, category id, item description — a
// superset of the legacy extraction's example SQL (design.md § Planning
// record, S7). tokenize replaces StringTokenizer and searchPredicate
// replaces the legacy's string-concatenated LIKE clauses (S6).
import { and, asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { item, itemDetails, product, productDetails } from "../db/schema";
import { EMPTY_PAGE } from "./page";
import { localeJoin, paginatedQuery, searchPredicate } from "./query";
import type { Item, Locale, Page } from "./types";

const ITEM_COLUMNS = {
  itemid: item.itemid,
  catid: product.catid,
  productid: product.productid,
  productName: productDetails.name,
  descn: itemDetails.descn,
  image: itemDetails.image,
  attr1: itemDetails.attr1,
  attr2: itemDetails.attr2,
  attr3: itemDetails.attr3,
  attr4: itemDetails.attr4,
  attr5: itemDetails.attr5,
  listPrice: item.listPrice,
  unitCost: item.unitCost,
};

type ItemRow = {
  itemid: string;
  catid: string;
  productid: string;
  productName: string;
  descn: string;
  image: string;
  attr1: string | null;
  attr2: string | null;
  attr3: string | null;
  attr4: string | null;
  attr5: string | null;
  listPrice: number;
  unitCost: number;
};

function toItem(row: ItemRow): Item {
  return {
    itemId: row.itemid,
    category: row.catid,
    productId: row.productid,
    productName: row.productName,
    description: row.descn,
    imageLocation: row.image,
    attribute1: row.attr1,
    attribute2: row.attr2,
    attribute3: row.attr3,
    attribute4: row.attr4,
    attribute5: row.attr5,
    listPrice: row.listPrice,
    unitCost: row.unitCost,
  };
}

// Whitespace-run splitting: consecutive spaces/tabs/newlines are one
// separator, and a leading/trailing/whitespace-only query yields no tokens.
export function tokenize(query: string): string[] {
  return query.split(/\s+/).filter((token) => token.length > 0);
}

export function searchItems(
  query: string,
  start: number,
  count: number,
  locale: Locale,
): Page<Item> {
  const keywords = tokenize(query);
  if (keywords.length === 0) {
    // An empty keyword list would otherwise build a predicate that matches
    // every item in the catalogue (design.md PLAN.md step 3).
    return EMPTY_PAGE;
  }

  const predicate = searchPredicate(keywords, [
    itemDetails.name,
    productDetails.name,
    product.catid,
    itemDetails.descn,
  ]);

  const page = paginatedQuery<ItemRow>(
    (limit, offset) =>
      db
        .select(ITEM_COLUMNS)
        .from(item)
        .innerJoin(product, eq(item.productid, product.productid))
        .innerJoin(
          itemDetails,
          and(eq(itemDetails.itemid, item.itemid), localeJoin(itemDetails, locale)),
        )
        .innerJoin(
          productDetails,
          and(eq(productDetails.productid, product.productid), localeJoin(productDetails, locale)),
        )
        .where(predicate)
        // Ordered by the localized item name, ascending — the spec leaves
        // search-result order unspecified and an unordered page is not
        // stable across requests (S10).
        .orderBy(asc(itemDetails.name))
        .limit(limit)
        .offset(offset)
        .all(),
    start,
    count,
  );

  return { ...page, objects: page.objects.map(toItem) };
}
