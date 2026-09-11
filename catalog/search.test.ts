import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, item, itemDetails, product, productDetails } from "../db/schema";
import { EMPTY_PAGE } from "./page";
import { searchItems, tokenize } from "./search";

describe("tokenize", () => {
  it("TK-01: splits on single spaces", () => {
    expect(tokenize("large african parrot")).toEqual(["large", "african", "parrot"]);
  });

  it("TK-02: runs of spaces, tabs and newlines behave as one separator", () => {
    expect(tokenize("large  \t african\n\nparrot")).toEqual(["large", "african", "parrot"]);
  });

  it("TK-03: an empty query yields no keywords", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("TK-04: a whitespace-only query yields no keywords", () => {
    expect(tokenize("   \t\n  ")).toEqual([]);
  });

  it("TK-05: leading/trailing whitespace does not produce empty tokens", () => {
    expect(tokenize("  parrot  ")).toEqual(["parrot"]);
  });
});

describe("searchItems", () => {
  // Two categories and three products so every one of the four searchable
  // fields (item name, product name, category id, item description) has at
  // least one keyword that matches through it alone.
  db.insert(category)
    .values([{ catid: "SR-BIRDS" }, { catid: "SR-DOGS" }, { catid: "SR-EXOTIC" }])
    .run();
  db.insert(product)
    .values([
      { productid: "SR-P-PARROTS", catid: "SR-BIRDS" },
      { productid: "SR-P-DOGS", catid: "SR-DOGS" },
      { productid: "SR-P-MACAWS", catid: "SR-EXOTIC" },
    ])
    .run();
  db.insert(productDetails)
    .values([
      { productid: "SR-P-PARROTS", locale: "en_US", name: "Parrots", descn: "..." },
      { productid: "SR-P-DOGS", locale: "en_US", name: "Retrievers", descn: "..." },
      { productid: "SR-P-MACAWS", locale: "en_US", name: "Macaw Collection", descn: "..." },
    ])
    .run();
  db.insert(item)
    .values([
      { itemid: "SR-I-LARGE", productid: "SR-P-PARROTS", listPrice: 10, unitCost: 5 },
      { itemid: "SR-I-SMALL", productid: "SR-P-PARROTS", listPrice: 10, unitCost: 5 },
      { itemid: "SR-I-DOG", productid: "SR-P-DOGS", listPrice: 10, unitCost: 5 },
      { itemid: "SR-I-RIO", productid: "SR-P-MACAWS", listPrice: 10, unitCost: 5 },
    ])
    .run();
  db.insert(itemDetails)
    .values([
      {
        itemid: "SR-I-LARGE",
        locale: "en_US",
        name: "Large African Grey Parrot",
        image: "/img/1.jpg",
        descn: "A large intelligent bird",
      },
      {
        itemid: "SR-I-SMALL",
        locale: "en_US",
        name: "Amazon Parrot",
        image: "/img/2.jpg",
        descn: "Colorful and social bird",
      },
      {
        itemid: "SR-I-DOG",
        locale: "en_US",
        name: "Golden Retriever Puppy",
        image: "/img/3.jpg",
        descn: "Friendly and loyal companion",
      },
      {
        itemid: "SR-I-RIO",
        locale: "en_US",
        name: "Rio Blue Bird",
        image: "/img/4.jpg",
        descn: "A playful companion from south america",
      },
    ])
    .run();

  function ids(query: string, start = 0, count = 25) {
    return searchItems(query, start, count, "en_US")
      .objects.map((i) => i.itemId)
      .sort();
  }

  it("AC-1/AC-7: AND across keywords — only the item matching both survives", () => {
    expect(ids("large african")).toEqual(["SR-I-LARGE"]);
  });

  it("AC-7: an item matching one keyword but not another is absent from a two-keyword result", () => {
    // SR-I-SMALL matches "parrot" but not "african" — it must not appear here,
    // which is what distinguishes AND across keywords from OR.
    const results = ids("parrot african");
    expect(results).toEqual(["SR-I-LARGE"]);
    expect(results).not.toContain("SR-I-SMALL");
  });

  it("AC-3: single keyword matches via item name, description, or category", () => {
    expect(ids("parrot")).toEqual(["SR-I-LARGE", "SR-I-SMALL"]);
  });

  it("matches via product name alone", () => {
    // "macaw" is in the product name ("Macaw Collection") but not in
    // SR-I-RIO's own item name or description.
    expect(ids("macaw")).toEqual(["SR-I-RIO"]);
  });

  it("matches via category id alone", () => {
    // "exotic" is in the category id ("SR-EXOTIC") but nowhere else in this fixture.
    expect(ids("exotic")).toEqual(["SR-I-RIO"]);
  });

  it("matches via item description alone", () => {
    // "loyal" is only in SR-I-DOG's description.
    expect(ids("loyal")).toEqual(["SR-I-DOG"]);
  });

  it("AC-6: matching is case-insensitive", () => {
    expect(ids("PARROT")).toEqual(ids("parrot"));
  });

  it("AC-6: matching is partial — a keyword in the middle of a word still matches", () => {
    expect(ids("rrot")).toEqual(["SR-I-LARGE", "SR-I-SMALL"]);
  });

  it("AC-5: an empty query returns EMPTY_PAGE, not the whole catalogue", () => {
    expect(searchItems("", 0, 25, "en_US")).toEqual(EMPTY_PAGE);
  });

  it("AC-5: a whitespace-only query returns EMPTY_PAGE", () => {
    expect(searchItems("   \t  ", 0, 25, "en_US")).toEqual(EMPTY_PAGE);
  });

  it("a query with no matches returns an empty (not EMPTY_PAGE-shaped-by-accident) page", () => {
    const page = searchItems("nonexistentkeyword", 0, 25, "en_US");
    expect(page.objects).toEqual([]);
  });
});

describe("searchItems pagination", () => {
  // AC-2: 25 items per page, over a 30-item fixture that all match one keyword.
  db.insert(category).values({ catid: "SR-BULK-CAT" }).run();
  db.insert(product).values({ productid: "SR-BULK-PROD", catid: "SR-BULK-CAT" }).run();
  db.insert(productDetails)
    .values({ productid: "SR-BULK-PROD", locale: "en_US", name: "Bulk Product", descn: "..." })
    .run();

  const bulkIds = Array.from({ length: 30 }, (_, i) => `SR-BULK-${String(i).padStart(2, "0")}`);
  db.insert(item)
    .values(
      bulkIds.map((itemid) => ({ itemid, productid: "SR-BULK-PROD", listPrice: 10, unitCost: 5 })),
    )
    .run();
  db.insert(itemDetails)
    .values(
      bulkIds.map((itemid, i) => ({
        itemid,
        locale: "en_US",
        name: `Bulk Item ${String(i).padStart(2, "0")}`,
        image: "/img/bulk.jpg",
        descn: "filler",
      })),
    )
    .run();

  it("AC-2: the first page has 25 items and hasNext=true", () => {
    const page = searchItems("bulk", 0, 25, "en_US");

    expect(page.objects).toHaveLength(25);
    expect(page.start).toBe(0);
    expect(page.hasNext).toBe(true);
    expect(page.objects[0].itemId).toBe("SR-BULK-00");
    expect(page.objects[24].itemId).toBe("SR-BULK-24");
  });

  it("AC-2: the second page has the remaining 5 items and hasNext=false", () => {
    const page = searchItems("bulk", 25, 25, "en_US");

    expect(page.objects).toHaveLength(5);
    expect(page.hasNext).toBe(false);
    expect(page.objects.map((i) => i.itemId)).toEqual([
      "SR-BULK-25",
      "SR-BULK-26",
      "SR-BULK-27",
      "SR-BULK-28",
      "SR-BULK-29",
    ]);
  });
});
