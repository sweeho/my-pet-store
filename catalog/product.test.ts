import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, product, productDetails } from "../db/schema";
import { EMPTY_PAGE } from "./page";
import { getProduct, getProducts } from "./product";

describe("getProduct", () => {
  db.insert(category)
    .values([{ catid: "GP-CATS" }])
    .run();
  db.insert(product)
    .values([
      { productid: "GP-FLUFFY", catid: "GP-CATS" },
      { productid: "GP-NOLOCALE", catid: "GP-CATS" },
    ])
    .run();
  db.insert(productDetails)
    .values([
      { productid: "GP-FLUFFY", locale: "en_US", name: "Fluffy Cat", descn: "A fluffy cat" },
      // GP-NOLOCALE has a detail row, but not for en_US — exercises AC-7.
      { productid: "GP-NOLOCALE", locale: "ja_JP", name: "モフモフ猫", descn: "モフモフな猫" },
    ])
    .run();

  it("GP-01: returns the product with its localized name, description and categoryId", () => {
    expect(getProduct("GP-FLUFFY", "en_US")).toEqual({
      id: "GP-FLUFFY",
      categoryId: "GP-CATS",
      name: "Fluffy Cat",
      description: "A fluffy cat",
    });
  });

  it("GP-02: a non-existent product id returns null", () => {
    expect(getProduct("GP-DOES-NOT-EXIST", "en_US")).toBeNull();
  });

  it("GP-03: a product with no detail row for the requested locale returns null", () => {
    expect(getProduct("GP-NOLOCALE", "en_US")).toBeNull();
  });
});

describe("getProducts", () => {
  // Two categories, so a dropped catid filter is observable — a
  // single-category fixture would pass whether or not the filter exists.
  db.insert(category)
    .values([{ catid: "GC-CATS" }, { catid: "GC-DOGS" }])
    .run();
  db.insert(product)
    .values([
      { productid: "GC-CATS-ANGORA", catid: "GC-CATS" },
      { productid: "GC-CATS-BENGAL", catid: "GC-CATS" },
      { productid: "GC-CATS-CALICO", catid: "GC-CATS" },
      { productid: "GC-DOGS-AKITA", catid: "GC-DOGS" },
      { productid: "GC-DOGS-BEAGLE", catid: "GC-DOGS" },
    ])
    .run();
  db.insert(productDetails)
    .values([
      { productid: "GC-CATS-ANGORA", locale: "en_US", name: "Angora Cat", descn: "..." },
      { productid: "GC-CATS-BENGAL", locale: "en_US", name: "Bengal Cat", descn: "..." },
      { productid: "GC-CATS-CALICO", locale: "en_US", name: "Calico Cat", descn: "..." },
      { productid: "GC-DOGS-AKITA", locale: "en_US", name: "Akita", descn: "..." },
      { productid: "GC-DOGS-BEAGLE", locale: "en_US", name: "Beagle", descn: "..." },
    ])
    .run();

  it("GC-01: returns the category's products ordered by localized name", () => {
    const page = getProducts("GC-CATS", 0, 10, "en_US");

    expect(page.objects.map((p) => p.id)).toEqual([
      "GC-CATS-ANGORA",
      "GC-CATS-BENGAL",
      "GC-CATS-CALICO",
    ]);
    expect(page.start).toBe(0);
    expect(page.hasNext).toBe(false);
  });

  it("GC-02: never includes a product from a neighbouring category", () => {
    const page = getProducts("GC-CATS", 0, 10, "en_US");

    const ids = page.objects.map((p) => p.id);
    expect(ids).not.toContain("GC-DOGS-AKITA");
    expect(ids).not.toContain("GC-DOGS-BEAGLE");
    expect(page.objects.every((p) => p.categoryId === "GC-CATS")).toBe(true);
  });

  it("GC-03: a smaller count still scopes to the category and paginates", () => {
    const page = getProducts("GC-CATS", 0, 2, "en_US");

    expect(page.objects.map((p) => p.id)).toEqual(["GC-CATS-ANGORA", "GC-CATS-BENGAL"]);
    expect(page.hasNext).toBe(true);
  });

  it("GC-04: a category with no products returns EMPTY_PAGE", () => {
    db.insert(category).values({ catid: "GC-EMPTY" }).run();

    expect(getProducts("GC-EMPTY", 0, 10, "en_US")).toEqual(EMPTY_PAGE);
  });
});
