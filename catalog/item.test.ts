import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, item, itemDetails, product, productDetails } from "../db/schema";
import { getItem, getItems } from "./item";
import { EMPTY_PAGE } from "./page";

describe("catalog/item", () => {
  db.insert(category).values({ catid: "IT-CAT" }).run();

  db.insert(product).values({ productid: "IT-PROD", catid: "IT-CAT" }).run();
  db.insert(productDetails)
    .values({
      productid: "IT-PROD",
      locale: "en_US",
      name: "Test Product",
      descn: "A test product",
    })
    .run();

  db.insert(item)
    .values({ itemid: "IT-1", productid: "IT-PROD", listPrice: 99.99, unitCost: 50.5 })
    .run();
  db.insert(itemDetails)
    .values({
      itemid: "IT-1",
      locale: "en_US",
      name: "Item One Name",
      image: "/images/it-1.jpg",
      descn: "Full description",
      attr1: "A1",
      attr2: "A2",
      attr3: "A3",
      attr4: "A4",
      attr5: "A5",
    })
    .run();

  // A second product with three items, named out of alphabetical order, to
  // prove getItems orders by the localized item name rather than insertion
  // or itemid order (design.md § Planning record, S10).
  db.insert(product).values({ productid: "IT-PROD-MULTI", catid: "IT-CAT" }).run();
  db.insert(productDetails)
    .values({ productid: "IT-PROD-MULTI", locale: "en_US", name: "Multi Product", descn: "..." })
    .run();
  db.insert(item)
    .values([
      { itemid: "IT-M1", productid: "IT-PROD-MULTI", listPrice: 10, unitCost: 5 },
      { itemid: "IT-M2", productid: "IT-PROD-MULTI", listPrice: 20, unitCost: 10 },
      { itemid: "IT-M3", productid: "IT-PROD-MULTI", listPrice: 30, unitCost: 15 },
    ])
    .run();
  db.insert(itemDetails)
    .values([
      { itemid: "IT-M1", locale: "en_US", name: "Charlie", image: "/c.jpg", descn: "c" },
      { itemid: "IT-M2", locale: "en_US", name: "Alpha", image: "/a.jpg", descn: "a" },
      { itemid: "IT-M3", locale: "en_US", name: "Bravo", image: "/b.jpg", descn: "b" },
    ])
    .run();

  // A product with no items, for the EMPTY_PAGE case.
  db.insert(product).values({ productid: "IT-PROD-EMPTY", catid: "IT-CAT" }).run();
  db.insert(productDetails)
    .values({ productid: "IT-PROD-EMPTY", locale: "en_US", name: "Empty Product", descn: "..." })
    .run();

  it("IT-01: getItem returns all 13 attributes, category and productName resolved through the product join", () => {
    const result = getItem("IT-1", "en_US");

    expect(result).toEqual({
      itemId: "IT-1",
      category: "IT-CAT",
      productId: "IT-PROD",
      productName: "Test Product",
      description: "Full description",
      imageLocation: "/images/it-1.jpg",
      attribute1: "A1",
      attribute2: "A2",
      attribute3: "A3",
      attribute4: "A4",
      attribute5: "A5",
      listPrice: 99.99,
      unitCost: 50.5,
    });
  });

  it("IT-02: prices are returned as numbers", () => {
    const result = getItem("IT-1", "en_US");

    expect(typeof result?.listPrice).toBe("number");
    expect(typeof result?.unitCost).toBe("number");
  });

  it("IT-03: a non-existent item id returns null", () => {
    expect(getItem("NO-SUCH-ITEM", "en_US")).toBeNull();
  });

  it("IT-04: an item with no detail row for the requested locale returns null", () => {
    expect(getItem("IT-1", "de_DE")).toBeNull();
  });

  it("IT-05: getItems returns a page of items for a product, ordered by localized item name", () => {
    const page = getItems("IT-PROD-MULTI", 0, 2, "en_US");

    expect(page).toEqual({
      objects: [
        expect.objectContaining({ itemId: "IT-M2", productName: "Multi Product" }),
        expect.objectContaining({ itemId: "IT-M3", productName: "Multi Product" }),
      ],
      start: 0,
      hasNext: true,
    });
  });

  it("IT-06: getItems returns the final page with hasNext=false", () => {
    const page = getItems("IT-PROD-MULTI", 2, 2, "en_US");

    expect(page).toEqual({
      objects: [expect.objectContaining({ itemId: "IT-M1" })],
      start: 2,
      hasNext: false,
    });
  });

  it("IT-07: a product with no items returns EMPTY_PAGE", () => {
    expect(getItems("IT-PROD-EMPTY", 0, 10, "en_US")).toEqual(EMPTY_PAGE);
  });
});
