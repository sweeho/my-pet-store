import { defineHandler, getQuery, getRouterParam, setResponseStatus } from "nitro/h3";

import { getItem, missingReason, type Item, type MissingReason } from "../../../../catalog/catalog";

type Result = Item | { error: string; reason: MissingReason };

// Public — no session is read here (design.md § Planning record, D6).
export default defineHandler((event): Result => {
  const itemId = getRouterParam(event, "itemId");
  const query = getQuery(event);
  const locale = typeof query.locale === "string" ? query.locale : undefined;

  const found = itemId ? getItem(itemId, locale) : null;
  if (!found) {
    setResponseStatus(event, 404);
    const reason = itemId ? missingReason("item", itemId) : "not-found";
    return { error: `Item not found: ${itemId ?? ""}`, reason };
  }

  return found;
});
