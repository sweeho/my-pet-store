// Product retrieval, fixed in artifacts/SWHM-S-0004/INTERFACES.md § Retrieval
// services. Reads compose through catalog/query.ts (paginatedQuery,
// localeJoin) rather than each service building its own SQL (design.md §
// Planning record, D5).
import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { product, productDetails } from "../db/schema";
import { localeJoin, paginatedQuery } from "./query";
import type { Locale, Page, Product } from "./types";

const SELECTION = {
  id: product.productid,
  categoryId: product.catid,
  name: productDetails.name,
  description: productDetails.descn,
};

export function getProduct(productId: string, locale: Locale): Product | null {
  const row = db
    .select(SELECTION)
    .from(product)
    .innerJoin(
      productDetails,
      and(eq(productDetails.productid, product.productid), localeJoin(productDetails, locale)),
    )
    .where(eq(product.productid, productId))
    .get();

  return row ?? null;
}

export function getProducts(
  categoryId: string,
  start: number,
  count: number,
  locale: Locale,
): Page<Product> {
  return paginatedQuery(
    (limit, offset) =>
      db
        .select(SELECTION)
        .from(product)
        .innerJoin(
          productDetails,
          and(eq(productDetails.productid, product.productid), localeJoin(productDetails, locale)),
        )
        .where(eq(product.catid, categoryId))
        .orderBy(productDetails.name)
        .limit(limit)
        .offset(offset)
        .all(),
    start,
    count,
  );
}
