import { defineHandler, getQuery, getRouterParam, setResponseStatus } from "nitro/h3";

import {
  getProduct,
  missingReason,
  type Product,
  type MissingReason,
} from "../../../../catalog/catalog";

type Result = Product | { error: string; reason: MissingReason };

// Public — no session is read here (design.md § Planning record, D6).
export default defineHandler((event): Result => {
  const productId = getRouterParam(event, "productId");
  const query = getQuery(event);
  const locale = typeof query.locale === "string" ? query.locale : undefined;

  const found = productId ? getProduct(productId, locale) : null;
  if (!found) {
    setResponseStatus(event, 404);
    const reason = productId ? missingReason("product", productId) : "not-found";
    return { error: `Product not found: ${productId ?? ""}`, reason };
  }

  return found;
});
