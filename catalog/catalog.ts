// The single entry point routes/ imports from. The legacy's two access paths
// — a transactional CatalogEJB and a read-only GenericCatalogDAO fast lane —
// collapse to one function call each: there is no container, no remote
// call, and so no choice between an EJB and a DAO path to make (design.md §
// Planning record, S2). Every operation here applies the same defaults —
// start=0, count=25, locale=en_US — so a caller that omits them and a
// caller that states them get the same page.
import { getCategories as queryCategories, getCategory as queryCategory } from "./category";
import { getItem as queryItem, getItems as queryItems } from "./item";
import { resolveLocale } from "./locale";
import { getProduct as queryProduct, getProducts as queryProducts } from "./product";
import { searchItems as querySearchItems } from "./search";
import type { Category, Item, Locale, Page, Product } from "./types";

// Re-exported so routes/ never needs a second import path into catalog/ —
// this module is the only one it imports from (AC-1).
export type { Category, Item, Locale, Page, Product } from "./types";

export const DEFAULT_START = 0;
export const DEFAULT_COUNT = 25;

export function getCategory(categoryId: string, locale?: Locale): Category | null {
  return queryCategory(categoryId, resolveLocale(locale));
}

export function getCategories(start?: number, count?: number, locale?: Locale): Page<Category> {
  return queryCategories(start ?? DEFAULT_START, count ?? DEFAULT_COUNT, resolveLocale(locale));
}

export function getProduct(productId: string, locale?: Locale): Product | null {
  return queryProduct(productId, resolveLocale(locale));
}

export function getProducts(
  categoryId: string,
  start?: number,
  count?: number,
  locale?: Locale,
): Page<Product> {
  return queryProducts(
    categoryId,
    start ?? DEFAULT_START,
    count ?? DEFAULT_COUNT,
    resolveLocale(locale),
  );
}

export function getItem(itemId: string, locale?: Locale): Item | null {
  return queryItem(itemId, resolveLocale(locale));
}

export function getItems(
  productId: string,
  start?: number,
  count?: number,
  locale?: Locale,
): Page<Item> {
  return queryItems(
    productId,
    start ?? DEFAULT_START,
    count ?? DEFAULT_COUNT,
    resolveLocale(locale),
  );
}

export function searchItems(
  query: string,
  start?: number,
  count?: number,
  locale?: Locale,
): Page<Item> {
  return querySearchItems(
    query,
    start ?? DEFAULT_START,
    count ?? DEFAULT_COUNT,
    resolveLocale(locale),
  );
}
