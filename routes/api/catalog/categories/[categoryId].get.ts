import { defineHandler, getQuery, getRouterParam, setResponseStatus } from "nitro/h3";

import { getCategory, type Category } from "../../../../catalog/catalog";

type Result = Category | { error: string };

// Public — no session is read here (design.md § Planning record, D6).
export default defineHandler((event): Result => {
  const categoryId = getRouterParam(event, "categoryId");
  const query = getQuery(event);
  const locale = typeof query.locale === "string" ? query.locale : undefined;

  const found = categoryId ? getCategory(categoryId, locale) : null;
  if (!found) {
    setResponseStatus(event, 404);
    return { error: `Category not found: ${categoryId ?? ""}` };
  }

  return found;
});
