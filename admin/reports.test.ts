import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  authUsers,
  category,
  categoryDetails,
  item,
  itemDetails,
  orderLineItem,
  orders,
  product,
  productDetails,
} from "../db/schema";
import { DEFAULT_LOCALE } from "../catalog/locale";
import { getRevenueReport, parseReportDates } from "./reports";
import type { DateRange } from "./types";

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function seedCategory(name: string): string {
  const catid = nextId("CAT");
  db.insert(category).values({ catid }).run();
  db.insert(categoryDetails).values({ catid, locale: DEFAULT_LOCALE, name, descn: name }).run();
  return catid;
}

function seedItem(catid: string, name: string): string {
  const productid = nextId("PROD");
  db.insert(product).values({ productid, catid }).run();
  db.insert(productDetails).values({ productid, locale: DEFAULT_LOCALE, name, descn: name }).run();

  const itemid = nextId("ITEM");
  db.insert(item).values({ itemid, productid, listPrice: 999, unitCost: 1 }).run();
  db.insert(itemDetails)
    .values({ itemid, locale: DEFAULT_LOCALE, name, image: "x.png", descn: name })
    .run();
  return itemid;
}

function seedSale(orderDate: Date, itemid: string, quantity: number, unitPrice: number): number {
  const userName = nextId("report-user");
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const orderAmount = quantity * unitPrice;
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate, orderAmount, status: "COMPLETED" })
    .returning({ orderId: orders.orderId })
    .get();
  db.insert(orderLineItem).values({ orderId, lineNumber: 1, itemid, quantity, unitPrice }).run();
  return orderId;
}

function asRange(result: DateRange | { error: string }): DateRange {
  if ("error" in result) throw new Error(`expected a DateRange, got error: ${result.error}`);
  return result;
}

describe("admin/reports parseReportDates", () => {
  it("RD-01: parses MM/dd/yyyy into a half-open range, endExclusive the day after end", () => {
    const range = asRange(parseReportDates("01/15/2023", "01/31/2023"));

    expect(range.start.toISOString()).toBe(new Date(Date.UTC(2023, 0, 15)).toISOString());
    expect(range.endExclusive.toISOString()).toBe(new Date(Date.UTC(2023, 1, 1)).toISOString());
  });

  it("RD-02: rejects a start date that isn't MM/dd/yyyy", () => {
    const result = parseReportDates("2023-01-15", "01/31/2023");

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-03: rejects an unparseable calendar date (e.g. month 13)", () => {
    const result = parseReportDates("13/01/2023", "01/31/2023");

    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RD-04: rejects an end date before the start date", () => {
    const result = parseReportDates("01/31/2023", "01/15/2023");

    expect(result).toEqual({ error: expect.any(String) });
  });
});

describe("admin/reports getRevenueReport", () => {
  it("RD-05: a sale exactly on the start date is included, one exactly on the end date is included, one the day after is excluded", () => {
    const catid = seedCategory("Boundary");
    const itemId = seedItem(catid, "Boundary Item");
    const range = asRange(parseReportDates("01/15/2023", "01/31/2023"));

    seedSale(new Date(Date.UTC(2023, 0, 15, 0, 0, 0)), itemId, 1, 10); // on start
    seedSale(new Date(Date.UTC(2023, 0, 31, 23, 59, 59)), itemId, 1, 20); // on end
    seedSale(new Date(Date.UTC(2023, 1, 1, 0, 0, 0)), itemId, 1, 999); // day after end — excluded

    const report = getRevenueReport(range);
    const row = report.rows.find((r) => r.id === catid);

    expect(row?.value).toBe(30);
    expect(report.totalSales).toBe(30);
  });

  it("RD-06: with no category filter, groups by category across all categories", () => {
    const catA = seedCategory("Cat A " + nextId(""));
    const itemA = seedItem(catA, "Item A");
    const catB = seedCategory("Cat B " + nextId(""));
    const itemB = seedItem(catB, "Item B");
    const range = asRange(parseReportDates("06/01/2024", "06/30/2024"));
    const day = new Date(Date.UTC(2024, 5, 15));

    seedSale(day, itemA, 2, 5); // 10
    seedSale(day, itemB, 1, 7); // 7

    const report = getRevenueReport(range);

    expect(report.groupedBy).toBe("Category");
    expect(report.rows.find((r) => r.id === catA)?.value).toBe(10);
    expect(report.rows.find((r) => r.id === catB)?.value).toBe(7);
  });

  it("RD-07: with a category filter, groups by item within that category, not by category", () => {
    const catid = seedCategory("Filtered " + nextId(""));
    const itemOne = seedItem(catid, "Item One");
    const itemTwo = seedItem(catid, "Item Two");
    const otherCat = seedCategory("Other " + nextId(""));
    const otherItem = seedItem(otherCat, "Other Item");
    const range = asRange(parseReportDates("07/01/2024", "07/31/2024"));
    const day = new Date(Date.UTC(2024, 6, 10));

    seedSale(day, itemOne, 1, 15);
    seedSale(day, itemTwo, 1, 25);
    seedSale(day, otherItem, 1, 500);

    const report = getRevenueReport(range, catid);

    expect(report.groupedBy).toBe("Item");
    const ids = report.rows.map((r) => r.id);
    expect(ids).toContain(itemOne);
    expect(ids).toContain(itemTwo);
    expect(ids).not.toContain(otherItem);
    expect(report.rows.find((r) => r.id === itemOne)?.value).toBe(15);
    expect(report.rows.find((r) => r.id === itemTwo)?.value).toBe(25);
  });

  it("RD-08: totalSales is the sum of the unrounded row values rounded once, not the sum of the rounded rows", () => {
    const catA = seedCategory("Round A " + nextId(""));
    const itemA = seedItem(catA, "Round Item A");
    const catB = seedCategory("Round B " + nextId(""));
    const itemB = seedItem(catB, "Round Item B");
    const range = asRange(parseReportDates("03/01/2024", "03/31/2024"));
    const day = new Date(Date.UTC(2024, 2, 10));

    // Each row's unrounded value is 10.004, which itself rounds to 10.00 for
    // display — but the true, unrounded total is 20.008, which rounds to
    // 20.01. Summing the rounded display rows (10.00 + 10.00 = 20.00) would
    // disagree with the total (PLAN.md step 4 / Gotchas).
    seedSale(day, itemA, 1, 10.004);
    seedSale(day, itemB, 1, 10.004);

    const report = getRevenueReport(range);

    expect(report.rows.find((r) => r.id === catA)?.value).toBe(10.0);
    expect(report.rows.find((r) => r.id === catB)?.value).toBe(10.0);
    expect(report.totalSales).toBe(20.01);
  });

  it("RD-09: an empty range (no sales) returns no rows and a zero total", () => {
    const range = asRange(parseReportDates("01/01/1999", "01/31/1999"));

    const report = getRevenueReport(range);

    expect(report.rows).toEqual([]);
    expect(report.totalSales).toBe(0);
  });
});
