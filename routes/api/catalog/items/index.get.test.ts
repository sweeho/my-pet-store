import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { category, item, itemDetails, product, productDetails } from "../../../../db/schema";
import listItems from "./index.get";

/**
 * INTEGRATION TEST
 *
 * Public — no cookie is ever sent (design.md § Planning record, D6).
 */
describe("GET /api/catalog/items", () => {
  db.insert(category).values({ catid: "RT-BIRDS" }).run();
  db.insert(product).values({ productid: "RT-PARROTS", catid: "RT-BIRDS" }).run();
  db.insert(productDetails)
    .values({ productid: "RT-PARROTS", locale: "en_US", name: "Parrots", descn: "Colorful birds" })
    .run();
  db.insert(item)
    .values({ itemid: "RT-EST-1", productid: "RT-PARROTS", listPrice: 190, unitCost: 90 })
    .run();
  db.insert(itemDetails)
    .values({
      itemid: "RT-EST-1",
      locale: "en_US",
      name: "Amazon Parrot",
      image: "/images/parrots/amazon.jpg",
      descn: "Great companion",
      attr1: "Green",
      attr2: null,
      attr3: null,
      attr4: null,
      attr5: null,
    })
    .run();

  it("II-01: returns the items for the given product in the default locale", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/catalog/items?productId=RT-PARROTS"),
    );

    const result = await listItems(event);

    expect(result).toEqual({
      objects: [
        {
          itemId: "RT-EST-1",
          category: "RT-BIRDS",
          productId: "RT-PARROTS",
          productName: "Parrots",
          description: "Great companion",
          imageLocation: "/images/parrots/amazon.jpg",
          attribute1: "Green",
          attribute2: null,
          attribute3: null,
          attribute4: null,
          attribute5: null,
          listPrice: 190,
          unitCost: 90,
        },
      ],
      start: 0,
      hasNext: false,
    });
  });

  it("II-02: a missing productId answers 400 with a plain error body", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/items"));

    const result = await listItems(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: "productId is required" });
  });
});
