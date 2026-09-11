import { describe, expect, it } from "vitest";

import { buildPage, EMPTY_PAGE, hasPrevious } from "./page";

// A 100-row fixture, matching the spec's "catalog with 100 categories" scenarios.
const HUNDRED_ROWS = Array.from({ length: 100 }, (_, i) => `row-${i}`);

describe("buildPage", () => {
  it("AC-1: first page of 100 rows with count=25 has hasNext=true and start=0", () => {
    // Caller asks the DB for count+1=26 rows starting at 0.
    const rows = HUNDRED_ROWS.slice(0, 26);

    const page = buildPage(rows, 0, 25);

    expect(page.start).toBe(0);
    expect(page.objects).toHaveLength(25);
    expect(page.objects).toEqual(HUNDRED_ROWS.slice(0, 25));
    expect(page.hasNext).toBe(true);
  });

  it("AC-2: last page (start=75, count=25) of 100 rows has hasNext=false", () => {
    // Only 25 rows remain from row 75, so the DB returns 25 (< count+1).
    const rows = HUNDRED_ROWS.slice(75, 100);

    const page = buildPage(rows, 75, 25);

    expect(page.start).toBe(75);
    expect(page.objects).toHaveLength(25);
    expect(page.objects).toEqual(HUNDRED_ROWS.slice(75, 100));
    expect(page.hasNext).toBe(false);
  });

  it("drops the extra (count+1-th) row from objects", () => {
    const rows = ["a", "b", "c"]; // count=2, so 3 rows = count+1

    const page = buildPage(rows, 0, 2);

    expect(page.objects).toEqual(["a", "b"]);
    expect(page.hasNext).toBe(true);
  });

  it("boundary: count larger than the result set", () => {
    const rows = ["a", "b", "c"]; // count=10 -> DB returns only 3 rows total

    const page = buildPage(rows, 0, 10);

    expect(page.objects).toEqual(["a", "b", "c"]);
    expect(page.hasNext).toBe(false);
  });

  it("boundary: count equal to the result set", () => {
    const rows = ["a", "b", "c"]; // count=3, result set has exactly 3 -> DB returns 3 (no extra row)

    const page = buildPage(rows, 0, 3);

    expect(page.objects).toEqual(["a", "b", "c"]);
    expect(page.hasNext).toBe(false);
  });

  it("boundary: count one less than the result set", () => {
    const rows = ["a", "b", "c"]; // count=2, result set has 3 -> DB returns count+1=3

    const page = buildPage(rows, 0, 2);

    expect(page.objects).toEqual(["a", "b"]);
    expect(page.hasNext).toBe(true);
  });

  it("boundary: start on the final row", () => {
    const rows = ["z"]; // start=99 of 100 rows, count=25 -> DB returns 1 row

    const page = buildPage(rows, 99, 25);

    expect(page.start).toBe(99);
    expect(page.objects).toEqual(["z"]);
    expect(page.hasNext).toBe(false);
  });

  it("a negative start yields EMPTY_PAGE", () => {
    const page = buildPage(["a", "b"], -1, 25);

    expect(page).toEqual(EMPTY_PAGE);
  });

  it("a start past the end of the result set (no rows) yields EMPTY_PAGE", () => {
    const page = buildPage([], 200, 25);

    expect(page).toEqual(EMPTY_PAGE);
  });

  it("count < 1 yields EMPTY_PAGE", () => {
    const page = buildPage(["a", "b"], 0, 0);

    expect(page).toEqual(EMPTY_PAGE);
  });
});

describe("EMPTY_PAGE", () => {
  it("has empty objects, start=0 and hasNext=false", () => {
    expect(EMPTY_PAGE).toEqual({ objects: [], start: 0, hasNext: false });
  });
});

describe("hasPrevious", () => {
  it("AC-3: is true when start > 0", () => {
    expect(hasPrevious({ objects: [], start: 25, hasNext: false })).toBe(true);
  });

  it("is false when start === 0", () => {
    expect(hasPrevious({ objects: [], start: 0, hasNext: true })).toBe(false);
  });
});
