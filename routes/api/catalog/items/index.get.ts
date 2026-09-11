import { defineHandler, getQuery, setResponseStatus } from "nitro/h3";

import { getItems, type Item, type Page } from "../../../../catalog/catalog";

type Result = Page<Item> | { error: string };

function parsePagination(
  query: Record<string, unknown>,
): { start?: number; count?: number } | { error: string } {
  const start = query.start === undefined ? undefined : Number(query.start);
  if (start !== undefined && !Number.isFinite(start)) {
    return { error: "start must be a number" };
  }

  const count = query.count === undefined ? undefined : Number(query.count);
  if (count !== undefined && (!Number.isFinite(count) || count < 1 || count > 100)) {
    return { error: "count must be a number between 1 and 100" };
  }

  return { start, count };
}

// Public — no session is read here (design.md § Planning record, D6).
export default defineHandler((event): Result => {
  const query = getQuery(event);
  const productId = typeof query.productId === "string" ? query.productId : undefined;
  if (!productId) {
    setResponseStatus(event, 400);
    return { error: "productId is required" };
  }

  const parsed = parsePagination(query);
  if ("error" in parsed) {
    setResponseStatus(event, 400);
    return { error: parsed.error };
  }

  const locale = typeof query.locale === "string" ? query.locale : undefined;
  return getItems(productId, parsed.start, parsed.count, locale);
});
