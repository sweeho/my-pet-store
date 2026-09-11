// Category retrieval, fixed in artifacts/SWHM-S-0004/INTERFACES.md §
// Retrieval services. Reads compose through catalog/query.ts (paginatedQuery,
// localeJoin) rather than building their own pagination or locale join
// (design.md § Planning record, D5).
import { and, eq } from "drizzle-orm";

import { db } from "../db/client";
import { category, categoryDetails } from "../db/schema";
import { localeJoin, paginatedQuery } from "./query";
import type { Category, Locale, Page } from "./types";

const SELECTION = {
  id: category.catid,
  name: categoryDetails.name,
  description: categoryDetails.descn,
};

// A missing category and a category with no content in the requested locale
// answer the same way — the entity/detail split is what makes that a data
// fact rather than a code branch (design.md § Planning record, D2, D4).
export function getCategory(categoryId: string, locale: Locale): Category | null {
  const row = db
    .select(SELECTION)
    .from(category)
    .innerJoin(
      categoryDetails,
      and(eq(categoryDetails.catid, category.catid), localeJoin(categoryDetails, locale)),
    )
    .where(eq(category.catid, categoryId))
    .get();

  return row ?? null;
}

export function getCategories(start: number, count: number, locale: Locale): Page<Category> {
  return paginatedQuery(
    (limit, offset) =>
      db
        .select(SELECTION)
        .from(category)
        .innerJoin(
          categoryDetails,
          and(eq(categoryDetails.catid, category.catid), localeJoin(categoryDetails, locale)),
        )
        .orderBy(categoryDetails.name)
        .limit(limit)
        .offset(offset)
        .all(),
    start,
    count,
  );
}
