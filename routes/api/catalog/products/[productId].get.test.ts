import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { category, product, productDetails } from "../../../../db/schema";
import getProduct from "./[productId].get";

/**
 * INTEGRATION TEST
 *
 * Public — no cookie is ever sent (design.md § Planning record, D6).
 */
describe("GET /api/catalog/products/:productId", () => {
  db.insert(category).values({ catid: "RT-DOGS" }).run();
  db.insert(product).values({ productid: "RT-BULLDOGS", catid: "RT-DOGS" }).run();
  db.insert(productDetails)
    .values({ productid: "RT-BULLDOGS", locale: "en_US", name: "Bulldogs", descn: "Friendly dogs" })
    .run();

  it("PD-01: returns the product in the default locale", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/products/RT-BULLDOGS"), {
      params: { productId: "RT-BULLDOGS" },
    });

    const result = await getProduct(event);

    expect(result).toEqual({
      id: "RT-BULLDOGS",
      categoryId: "RT-DOGS",
      name: "Bulldogs",
      description: "Friendly dogs",
    });
  });

  it("PD-02: a product that does not exist answers 404 with a plain error body, never a 200 carrying null", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/catalog/products/RT-NOT-A-PRODUCT"),
      { params: { productId: "RT-NOT-A-PRODUCT" } },
    );

    const result = await getProduct(event);

    expect(event.res.status).toBe(404);
    expect(result).toEqual({ error: "Product not found: RT-NOT-A-PRODUCT" });
  });
});
