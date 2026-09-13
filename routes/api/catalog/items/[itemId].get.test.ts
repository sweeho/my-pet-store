import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { category, item, itemDetails, product, productDetails } from "../../../../db/schema";
import getItem from "./[itemId].get";

/**
 * INTEGRATION TEST
 *
 * Public — no cookie is ever sent (design.md § Planning record, D6).
 */
describe("GET /api/catalog/items/:itemId", () => {
  db.insert(category).values({ catid: "RT-CATS" }).run();
  db.insert(product).values({ productid: "RT-PERSIAN", catid: "RT-CATS" }).run();
  db.insert(productDetails)
    .values({
      productid: "RT-PERSIAN",
      locale: "en_US",
      name: "Persian",
      descn: "Long-haired cats",
    })
    .run();
  db.insert(item)
    .values({ itemid: "RT-EST-2", productid: "RT-PERSIAN", listPrice: 500, unitCost: 250 })
    .run();
  db.insert(itemDetails)
    .values({
      itemid: "RT-EST-2",
      locale: "en_US",
      name: "Adult Persian Cat",
      image: "/images/cats/persian.jpg",
      descn: "Gentle and quiet",
      attr1: null,
      attr2: null,
      attr3: null,
      attr4: null,
      attr5: null,
    })
    .run();

  it("ID-01: returns the item with all 13 attributes in the default locale", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/items/RT-EST-2"), {
      params: { itemId: "RT-EST-2" },
    });

    const result = await getItem(event);

    expect(result).toEqual({
      itemId: "RT-EST-2",
      category: "RT-CATS",
      productId: "RT-PERSIAN",
      productName: "Persian",
      description: "Gentle and quiet",
      imageLocation: "/images/cats/persian.jpg",
      attribute1: null,
      attribute2: null,
      attribute3: null,
      attribute4: null,
      attribute5: null,
      listPrice: 500,
      unitCost: 250,
    });
  });

  it("ID-02: an item that does not exist answers 404 with reason not-found", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/items/RT-NOT-AN-ITEM"), {
      params: { itemId: "RT-NOT-AN-ITEM" },
    });

    const result = await getItem(event);

    expect(event.res.status).toBe(404);
    expect(result).toEqual({ error: "Item not found: RT-NOT-AN-ITEM", reason: "not-found" });
  });

  it("ID-03: an item with no content in the requested locale answers 404 with reason missing-translation, distinct from an unknown id under the same locale", async () => {
    const knownItem = new H3Event(
      new Request("http://localhost/api/catalog/items/RT-EST-2?locale=RT-NO-SUCH-LOCALE"),
      { params: { itemId: "RT-EST-2" } },
    );
    const unknownItem = new H3Event(
      new Request("http://localhost/api/catalog/items/RT-NOT-AN-ITEM?locale=RT-NO-SUCH-LOCALE"),
      { params: { itemId: "RT-NOT-AN-ITEM" } },
    );

    const knownResult = await getItem(knownItem);
    const unknownResult = await getItem(unknownItem);

    expect(knownItem.res.status).toBe(404);
    expect(knownResult).toEqual({
      error: "Item not found: RT-EST-2",
      reason: "missing-translation",
    });
    expect(unknownItem.res.status).toBe(404);
    expect(unknownResult).toEqual({
      error: "Item not found: RT-NOT-AN-ITEM",
      reason: "not-found",
    });
  });
});
