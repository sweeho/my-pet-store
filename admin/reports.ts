// Revenue reporting, fixed in artifacts/SWHM-S-0012/SWHM-T-0120/PLAN.md §
// Fixed interface contracts. SWHM-T-0121 reuses parseReportDates and the
// Report/ReportRow shapes for order-count reporting.
import { and, eq, gte, lt, sql } from "drizzle-orm";

import { db } from "../db/client";
import {
  category,
  categoryDetails,
  item,
  itemDetails,
  orderLineItem,
  orders,
  product,
} from "../db/schema";
import { DEFAULT_LOCALE } from "../catalog/locale";
import type { AdminError, DateRange, Report, ReportRow } from "./types";

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

// Parses the components explicitly rather than handing MM/dd/yyyy to
// new Date(), whose behaviour on that format is unspecified and
// timezone-sensitive (PLAN.md Gotchas). Rejects a date whose components
// don't round-trip (e.g. 02/30/2023), which Date.UTC would otherwise
// silently roll into March.
function parseMDYDate(value: string): Date | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  const roundTrips =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return roundTrips ? date : null;
}

// Half-open [start, endExclusive): an inclusive end date would silently drop
// everything that happened on the last day (PLAN.md step 1).
export function parseReportDates(start: string, end: string): DateRange | AdminError {
  const startDate = parseMDYDate(start);
  if (!startDate) return { error: "start must be MM/dd/yyyy" };

  const endDate = parseMDYDate(end);
  if (!endDate) return { error: "end must be MM/dd/yyyy" };

  if (endDate < startDate) return { error: "end must not be before start" };

  const endExclusive = new Date(endDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return { start: startDate, endExclusive };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

type RawRow = { id: string; label: string; value: number };

// Rounds once at the boundary, from the unrounded per-group SQL sums
// (PLAN.md step 4): rounding each row and then summing the rounded values
// would make totalSales disagree with the rows it is supposed to total.
function buildReport(groupedBy: Report["groupedBy"], rawRows: RawRow[]): Report {
  const totalSales = round2(rawRows.reduce((total, row) => total + row.value, 0));
  const rows: ReportRow[] = rawRows.map((row) => ({
    id: row.id,
    label: row.label,
    value: round2(row.value),
  }));
  return { groupedBy, rows, totalSales };
}

// No round2 here (SWHM-T-0121 PLAN.md step 2, Gotchas): quantities are
// integers, and totalSales is a count, not money — rounding it would imply
// a precision this measure doesn't have.
function buildCountReport(groupedBy: Report["groupedBy"], rawRows: RawRow[]): Report {
  const totalSales = rawRows.reduce((total, row) => total + row.value, 0);
  const rows: ReportRow[] = rawRows.map((row) => ({
    id: row.id,
    label: row.label,
    value: row.value,
  }));
  return { groupedBy, rows, totalSales };
}

// Sums order_line_item.quantity * unit_price — the price PAID, never a join
// to item.list_price, which would restate history every time a price
// changes (design.md D4). With no catid, groups by category across all of
// them; with a catid, groups by item within that one — the exact
// conditional the two scenarios assert (PLAN.md step 2).
export function getRevenueReport(range: DateRange, catid?: string): Report {
  const revenue = sql<number>`sum(${orderLineItem.quantity} * ${orderLineItem.unitPrice})`;
  const inRange = and(gte(orders.orderDate, range.start), lt(orders.orderDate, range.endExclusive));

  if (catid === undefined) {
    const rows = db
      .select({ id: category.catid, label: categoryDetails.name, value: revenue })
      .from(orderLineItem)
      .innerJoin(orders, eq(orders.orderId, orderLineItem.orderId))
      .innerJoin(item, eq(item.itemid, orderLineItem.itemid))
      .innerJoin(product, eq(product.productid, item.productid))
      .innerJoin(category, eq(category.catid, product.catid))
      .innerJoin(
        categoryDetails,
        and(eq(categoryDetails.catid, category.catid), eq(categoryDetails.locale, DEFAULT_LOCALE)),
      )
      .where(inRange)
      .groupBy(category.catid, categoryDetails.name)
      .all();

    return buildReport("Category", rows);
  }

  const rows = db
    .select({ id: item.itemid, label: itemDetails.name, value: revenue })
    .from(orderLineItem)
    .innerJoin(orders, eq(orders.orderId, orderLineItem.orderId))
    .innerJoin(item, eq(item.itemid, orderLineItem.itemid))
    .innerJoin(product, eq(product.productid, item.productid))
    .innerJoin(
      itemDetails,
      and(eq(itemDetails.itemid, item.itemid), eq(itemDetails.locale, DEFAULT_LOCALE)),
    )
    .where(and(inRange, eq(product.catid, catid)))
    .groupBy(item.itemid, itemDetails.name)
    .all();

  return buildReport("Item", rows);
}

// Sums order_line_item.quantity — "order quantities" (the extracted
// scenario's wording): one line item for five units is five, not one row
// (PLAN.md Gotchas). Same join, same half-open range and the same
// category-or-item conditional as getRevenueReport — the only difference is
// the aggregate expression and skipping round2 (SWHM-T-0121 PLAN.md step 2).
export function getOrderCountReport(range: DateRange, catid?: string): Report {
  const quantitySum = sql<number>`sum(${orderLineItem.quantity})`;
  const inRange = and(gte(orders.orderDate, range.start), lt(orders.orderDate, range.endExclusive));

  if (catid === undefined) {
    const rows = db
      .select({ id: category.catid, label: categoryDetails.name, value: quantitySum })
      .from(orderLineItem)
      .innerJoin(orders, eq(orders.orderId, orderLineItem.orderId))
      .innerJoin(item, eq(item.itemid, orderLineItem.itemid))
      .innerJoin(product, eq(product.productid, item.productid))
      .innerJoin(category, eq(category.catid, product.catid))
      .innerJoin(
        categoryDetails,
        and(eq(categoryDetails.catid, category.catid), eq(categoryDetails.locale, DEFAULT_LOCALE)),
      )
      .where(inRange)
      .groupBy(category.catid, categoryDetails.name)
      .all();

    return buildCountReport("Category", rows);
  }

  const rows = db
    .select({ id: item.itemid, label: itemDetails.name, value: quantitySum })
    .from(orderLineItem)
    .innerJoin(orders, eq(orders.orderId, orderLineItem.orderId))
    .innerJoin(item, eq(item.itemid, orderLineItem.itemid))
    .innerJoin(product, eq(product.productid, item.productid))
    .innerJoin(
      itemDetails,
      and(eq(itemDetails.itemid, item.itemid), eq(itemDetails.locale, DEFAULT_LOCALE)),
    )
    .where(and(inRange, eq(product.catid, catid)))
    .groupBy(item.itemid, itemDetails.name)
    .all();

  return buildCountReport("Item", rows);
}
