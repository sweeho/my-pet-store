import { and, eq, like } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

import { db } from "../db/client";
import { category, categoryDetails, item, itemDetails, product } from "../db/schema";
import { EMPTY_PAGE } from "./page";
import { localeJoin, paginatedQuery, searchPredicate } from "./query";

describe("paginatedQuery", () => {
  // A 5-row fixture in the category table, ordered by catid.
  const ROWS = ["PG-A", "PG-B", "PG-C", "PG-D", "PG-E"];
  db.insert(category)
    .values(ROWS.map((catid) => ({ catid })))
    .run();

  // Vitest collects every describe() body (and its top-level inserts) before
  // running any test, so all three describe blocks' fixture rows already
  // exist in the shared in-memory db by the time any `it` runs — the `PG-%`
  // filter keeps this block's pagination assertions scoped to its own rows.
  function fetchPage(limit: number, offset: number) {
    return db
      .select({ catid: category.catid })
      .from(category)
      .where(like(category.catid, "PG-%"))
      .orderBy(category.catid)
      .limit(limit)
      .offset(offset)
      .all();
  }

  it("PQ-01: first page returns count rows with hasNext=true", () => {
    const page = paginatedQuery(fetchPage, 0, 2);

    expect(page).toEqual({
      objects: [{ catid: "PG-A" }, { catid: "PG-B" }],
      start: 0,
      hasNext: true,
    });
  });

  it("PQ-02: middle page returns the next count rows with hasNext=true", () => {
    const page = paginatedQuery(fetchPage, 2, 2);

    expect(page).toEqual({
      objects: [{ catid: "PG-C" }, { catid: "PG-D" }],
      start: 2,
      hasNext: true,
    });
  });

  it("PQ-03: final page returns the remainder with hasNext=false", () => {
    const page = paginatedQuery(fetchPage, 4, 2);

    expect(page).toEqual({
      objects: [{ catid: "PG-E" }],
      start: 4,
      hasNext: false,
    });
  });

  it("PQ-04: an out-of-range start returns EMPTY_PAGE", () => {
    const page = paginatedQuery(fetchPage, 10, 2);

    expect(page).toEqual(EMPTY_PAGE);
  });

  it("PQ-05: a negative start returns EMPTY_PAGE without querying", () => {
    const build = vi.fn(fetchPage);

    const page = paginatedQuery(build, -1, 2);

    expect(page).toEqual(EMPTY_PAGE);
    expect(build).not.toHaveBeenCalled();
  });

  it("PQ-06: requests exactly count+1 rows via limit/offset, in one call", () => {
    const build = vi.fn(() => [{ catid: "PG-A" }, { catid: "PG-B" }, { catid: "PG-C" }]);

    paginatedQuery(build, 5, 2);

    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(3, 5);
  });
});

describe("localeJoin", () => {
  db.insert(category).values({ catid: "LJ-A" }).run();
  db.insert(categoryDetails)
    .values([
      { catid: "LJ-A", locale: "en_US", name: "English name", descn: "English descn" },
      { catid: "LJ-A", locale: "ja_JP", name: "日本語名", descn: "日本語の説明" },
    ])
    .run();

  it("LJ-01: filters to the requested locale's row only", () => {
    const row = db
      .select()
      .from(categoryDetails)
      .where(and(eq(categoryDetails.catid, "LJ-A"), localeJoin(categoryDetails, "en_US")))
      .get();

    expect(row?.name).toBe("English name");
  });

  it("LJ-02: a different locale argument selects a different row", () => {
    const row = db
      .select()
      .from(categoryDetails)
      .where(and(eq(categoryDetails.catid, "LJ-A"), localeJoin(categoryDetails, "ja_JP")))
      .get();

    expect(row?.name).toBe("日本語名");
  });

  it("LJ-03: an unsupported/missing locale matches no row", () => {
    const row = db
      .select()
      .from(categoryDetails)
      .where(and(eq(categoryDetails.catid, "LJ-A"), localeJoin(categoryDetails, "de_DE")))
      .get();

    expect(row).toBeUndefined();
  });
});

describe("searchPredicate", () => {
  db.insert(category).values({ catid: "SP-CAT" }).run();
  db.insert(product).values({ productid: "SP-PROD", catid: "SP-CAT" }).run();
  db.insert(item)
    .values([
      { itemid: "SP-1", productid: "SP-PROD", listPrice: 10, unitCost: 5 },
      { itemid: "SP-2", productid: "SP-PROD", listPrice: 10, unitCost: 5 },
      { itemid: "SP-3", productid: "SP-PROD", listPrice: 10, unitCost: 5 },
      { itemid: "SP-4", productid: "SP-PROD", listPrice: 10, unitCost: 5 },
      { itemid: "SP-5", productid: "SP-PROD", listPrice: 10, unitCost: 5 },
    ])
    .run();
  db.insert(itemDetails)
    .values([
      {
        itemid: "SP-1",
        locale: "en_US",
        name: "Amazon Parrot",
        image: "/img/1.jpg",
        descn: "Great companion bird",
      },
      {
        itemid: "SP-2",
        locale: "en_US",
        name: "African Grey Parrot",
        image: "/img/2.jpg",
        descn: "Highly intelligent bird",
      },
      {
        itemid: "SP-3",
        locale: "en_US",
        name: "Persian Cat",
        image: "/img/3.jpg",
        descn: "100% pure breed",
      },
      {
        itemid: "SP-4",
        locale: "en_US",
        name: "Fish_2024",
        image: "/img/4.jpg",
        descn: "literal underscore in the name",
      },
      {
        itemid: "SP-5",
        locale: "en_US",
        name: "FishX2024",
        image: "/img/5.jpg",
        descn: "no underscore, would falsely match an unescaped wildcard",
      },
    ])
    .run();

  function search(keywords: string[]) {
    return db
      .select({ itemid: itemDetails.itemid })
      .from(itemDetails)
      .where(searchPredicate(keywords, [itemDetails.name, itemDetails.descn]))
      .all()
      .map((r) => r.itemid)
      .sort();
  }

  it("SQ-01: AND across keywords — both must match, on any field", () => {
    expect(search(["parrot", "african"])).toEqual(["SP-2"]);
  });

  it("SQ-02: OR across fields — a keyword found only in the description still matches", () => {
    expect(search(["intelligent"])).toEqual(["SP-2"]);
  });

  it("SQ-03: a single keyword matches every row containing it, case-insensitively", () => {
    expect(search(["PARROT"])).toEqual(["SP-1", "SP-2"]);
  });

  it("SQ-04: a keyword containing '%' matches literally, not as a wildcard", () => {
    expect(search(["100%"])).toEqual(["SP-3"]);
  });

  it("SQ-05: a keyword containing '_' matches literally, not as a single-char wildcard", () => {
    expect(search(["Fish_2024"])).toEqual(["SP-4"]);
  });
});
