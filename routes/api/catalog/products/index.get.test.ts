import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { category, product, productDetails } from "../../../../db/schema";
import listProducts from "./index.get";

/**
 * INTEGRATION TEST
 *
 * Public — no cookie is ever sent (design.md § Planning record, D6).
 */
describe("GET /api/catalog/products", () => {
  db.insert(category).values({ catid: "RT-BIRDS" }).run();
  db.insert(product).values({ productid: "RT-PARROTS", catid: "RT-BIRDS" }).run();
  db.insert(productDetails)
    .values({ productid: "RT-PARROTS", locale: "en_US", name: "Parrots", descn: "Colorful birds" })
    .run();

  it("PI-01: returns the products for the given category in the default locale", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/catalog/products?categoryId=RT-BIRDS"),
    );

    const result = await listProducts(event);

    expect(result).toEqual({
      objects: [
        {
          id: "RT-PARROTS",
          categoryId: "RT-BIRDS",
          name: "Parrots",
          description: "Colorful birds",
        },
      ],
      start: 0,
      hasNext: false,
    });
  });

  it("PI-02: a missing categoryId answers 400 with a plain error body", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/products"));

    const result = await listProducts(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: "categoryId is required" });
  });
});
