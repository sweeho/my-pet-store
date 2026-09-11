import { defineHandler, getQuery, getRouterParam, setResponseStatus } from "nitro/h3";

import { getProduct, type Product } from "../../../../catalog/catalog";

type Result = Product | { error: string };

// Public — no session is read here (design.md § Planning record, D6).
export default defineHandler((event): Result => {
  const productId = getRouterParam(event, "productId");
  const query = getQuery(event);
  const locale = typeof query.locale === "string" ? query.locale : undefined;

  const found = productId ? getProduct(productId, locale) : null;
  if (!found) {
    setResponseStatus(event, 404);
    return { error: `Product not found: ${productId ?? ""}` };
  }

  return found;
});
