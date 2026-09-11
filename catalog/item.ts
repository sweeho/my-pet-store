import { and, asc, eq } from "drizzle-orm";

import { db } from "../db/client";
import { item, itemDetails, product, productDetails } from "../db/schema";
import { localeJoin, paginatedQuery } from "./query";
import type { Item, Locale, Page } from "./types";

// The widest read in the capability: item + item_details for the id, prices
// and the localized name/description/image/attributes, joined to product +
// product_details for productId, the localized productName and the category
// id — resolved through the join, never a duplicated column on item
// (design.md § Planning record, D2).
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

// One SQL statement — inner joins drop the row entirely when the requested
// locale has no item_details or product_details row, which is how a missing
// locale becomes null rather than a partially-filled Item (D2, D4).
function itemQuery(locale: Locale) {
  return db
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
    );
}

export function getItem(itemId: string, locale: Locale): Item | null {
  const row = itemQuery(locale).where(eq(item.itemid, itemId)).get();

  return row ? toItem(row) : null;
}

// Ordered by the localized item name, ascending — the spec leaves this
// unspecified and an unordered page is not stable across requests (S10).
export function getItems(
  productId: string,
  start: number,
  count: number,
  locale: Locale,
): Page<Item> {
  const page = paginatedQuery<ItemRow>(
    (limit, offset) =>
      itemQuery(locale)
        .where(eq(item.productid, productId))
        .orderBy(asc(itemDetails.name))
        .limit(limit)
        .offset(offset)
        .all(),
    start,
    count,
  );

  return { ...page, objects: page.objects.map(toItem) };
}
