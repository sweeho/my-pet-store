import { defineHandler, getQuery, getRouterParam, setResponseStatus } from "nitro/h3";

import { getItem, type Item } from "../../../../catalog/catalog";

type Result = Item | { error: string };

// Public — no session is read here (design.md § Planning record, D6).
export default defineHandler((event): Result => {
  const itemId = getRouterParam(event, "itemId");
  const query = getQuery(event);
  const locale = typeof query.locale === "string" ? query.locale : undefined;

  const found = itemId ? getItem(itemId, locale) : null;
  if (!found) {
    setResponseStatus(event, 404);
    return { error: `Item not found: ${itemId ?? ""}` };
  }

  return found;
});
