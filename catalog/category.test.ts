import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, categoryDetails } from "../db/schema";
import { EMPTY_PAGE } from "./page";
import { getCategories, getCategory } from "./category";

// getCategories has no scoping parameter — it lists every category. Each
// scenario below uses its own private locale string as a namespace, so its
// fixture rows are the only ones an inner-join on that locale ever
// matches, keeping the scenarios independent in one shared in-memory db
// (module-level inserts run once per file, before any test — see
// query.test.ts's own comment on this).
describe("catalog/category", () => {
  db.insert(category).values({ catid: "CAT-BIRDS" }).run();
  db.insert(categoryDetails)
    .values({ catid: "CAT-BIRDS", locale: "loc-a", name: "Birds", descn: "Feathered pets" })
    .run();

  it("CT-01: getCategory returns the category with its localized name and description", () => {
    expect(getCategory("CAT-BIRDS", "loc-a")).toEqual({
      id: "CAT-BIRDS",
      name: "Birds",
      description: "Feathered pets",
    });
  });

  it("CT-02: a non-existent category id returns null", () => {
    expect(getCategory("CAT-DOES-NOT-EXIST", "loc-a")).toBeNull();
  });

  it("CT-03: a category with no detail row for the requested locale returns null", () => {
    expect(getCategory("CAT-BIRDS", "loc-a-missing")).toBeNull();
  });

  // The spec's own "Categories are ordered by name" scenario, reproduced with
  // its literal category names, inserted out of alphabetical order.
  db.insert(category)
    .values([
      { catid: "ORD-DOGS" },
      { catid: "ORD-BIRDS" },
      { catid: "ORD-CATS" },
      { catid: "ORD-FISH" },
      { catid: "ORD-REPTILES" },
    ])
    .run();
  db.insert(categoryDetails)
    .values([
      { catid: "ORD-DOGS", locale: "loc-b", name: "Dogs", descn: "..." },
      { catid: "ORD-BIRDS", locale: "loc-b", name: "Birds", descn: "..." },
      { catid: "ORD-CATS", locale: "loc-b", name: "Cats", descn: "..." },
      { catid: "ORD-FISH", locale: "loc-b", name: "Fish", descn: "..." },
      { catid: "ORD-REPTILES", locale: "loc-b", name: "Reptiles", descn: "..." },
    ])
    .run();

  it("CT-04: getCategories orders by localized name, ascending", () => {
    const page = getCategories(0, 10, "loc-b");

    expect(page).toEqual({
      objects: [
        { id: "ORD-BIRDS", name: "Birds", description: "..." },
        { id: "ORD-CATS", name: "Cats", description: "..." },
        { id: "ORD-DOGS", name: "Dogs", description: "..." },
        { id: "ORD-FISH", name: "Fish", description: "..." },
        { id: "ORD-REPTILES", name: "Reptiles", description: "..." },
      ],
      start: 0,
      hasNext: false,
    });
  });

  // 12 categories, named so "loc-c-en"'s alphabetical order is the exact
  // reverse of catid suffix order and "loc-c-ja"'s matches it — proving
  // getCategories orders by the localized name, not by id or insertion
  // order, and that the SAME categories order differently per locale (AC-7).
  const PAGE_IDS = Array.from({ length: 12 }, (_, i) => `PG-${String(i + 1).padStart(2, "0")}`);
  const EN_NAMES = [
    "Zebra",
    "Yak",
    "Xerus",
    "Wolf",
    "Vulture",
    "Tiger",
    "Snake",
    "Rabbit",
    "Quail",
    "Panda",
    "Otter",
    "Newt",
  ];
  const JA_NAMES = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ", "し"];

  db.insert(category)
    .values(PAGE_IDS.map((catid) => ({ catid })))
    .run();
  db.insert(categoryDetails)
    .values(
      PAGE_IDS.map((catid, i) => ({
        catid,
        locale: "loc-c-en",
        name: EN_NAMES[i],
        descn: "...",
      })),
    )
    .run();
  db.insert(categoryDetails)
    .values(
      PAGE_IDS.map((catid, i) => ({
        catid,
        locale: "loc-c-ja",
        name: JA_NAMES[i],
        descn: "...",
      })),
    )
    .run();

  it("CT-05: the first page returns count categories ordered by name, with hasNext=true", () => {
    const page = getCategories(0, 10, "loc-c-en");

    expect(page.objects.map((c) => c.id)).toEqual([
      "PG-12",
      "PG-11",
      "PG-10",
      "PG-09",
      "PG-08",
      "PG-07",
      "PG-06",
      "PG-05",
      "PG-04",
      "PG-03",
    ]);
    expect(page.start).toBe(0);
    expect(page.hasNext).toBe(true);
  });

  it("CT-06: the final page returns the remainder with hasNext=false", () => {
    const page = getCategories(10, 10, "loc-c-en");

    expect(page.objects.map((c) => c.id)).toEqual(["PG-02", "PG-01"]);
    expect(page.hasNext).toBe(false);
  });

  it("CT-07: the same categories order differently in a locale whose names sort differently", () => {
    const enOrder = getCategories(0, 5, "loc-c-en").objects.map((c) => c.id);
    const jaOrder = getCategories(0, 5, "loc-c-ja").objects.map((c) => c.id);

    expect(jaOrder).toEqual(["PG-01", "PG-02", "PG-03", "PG-04", "PG-05"]);
    expect(enOrder).not.toEqual(jaOrder);
  });

  it("CT-08: a locale with no detail rows for any category returns EMPTY_PAGE", () => {
    expect(getCategories(0, 10, "loc-never-used")).toEqual(EMPTY_PAGE);
  });
});
