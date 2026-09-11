import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { category, item, itemDetails, product, productDetails } from "../../../db/schema";
import search from "./search.get";

/**
 * INTEGRATION TEST
 *
 * Public — no cookie is ever sent (design.md § Planning record, D6).
 */
describe("GET /api/catalog/search", () => {
  db.insert(category).values({ catid: "RT-BIRDS" }).run();
  db.insert(product).values({ productid: "RT-PARROTS", catid: "RT-BIRDS" }).run();
  db.insert(productDetails)
    .values({ productid: "RT-PARROTS", locale: "en_US", name: "Parrots", descn: "Colorful birds" })
    .run();
  db.insert(item)
    .values({ itemid: "RT-EST-3", productid: "RT-PARROTS", listPrice: 260, unitCost: 100 })
    .run();
  db.insert(itemDetails)
    .values({
      itemid: "RT-EST-3",
      locale: "en_US",
      name: "African Grey Parrot",
      image: "/images/parrots/african.jpg",
      descn: "Highly intelligent",
      attr1: "Large",
      attr2: null,
      attr3: null,
      attr4: null,
      attr5: null,
    })
    .run();

  it("SR-01: matches items across name, product name, category id and description", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/search?q=african"));

    const result = await search(event);

    expect(result).toEqual({
      objects: [
        {
          itemId: "RT-EST-3",
          category: "RT-BIRDS",
          productId: "RT-PARROTS",
          productName: "Parrots",
          description: "Highly intelligent",
          imageLocation: "/images/parrots/african.jpg",
          attribute1: "Large",
          attribute2: null,
          attribute3: null,
          attribute4: null,
          attribute5: null,
          listPrice: 260,
          unitCost: 100,
        },
      ],
      start: 0,
      hasNext: false,
    });
  });

  it("SR-02: a missing q answers 400 with a plain error body", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/search"));

    const result = await search(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: "q is required" });
  });
});
