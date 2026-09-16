// Order retrieval by status, fixed in artifacts/SWHM-S-0012/SWHM-T-0118/PLAN.md
// § Fixed interface contracts. Four later capabilities extend the orders/
// order_line_item tables this reads rather than redefining them (design.md D1).
import { desc, inArray } from "drizzle-orm";

import { db } from "../db/client";
import { orders } from "../db/schema";
import type { OrderStatus, OrderSummary, Page } from "./types";

export { ORDER_STATUSES } from "./types";
export type { OrderStatus, OrderSummary, Page } from "./types";

const DEFAULT_START = 0;
const DEFAULT_COUNT = 50;
const EMPTY_PAGE: Page<never> = { items: [], hasNext: false };

type OrderRow = typeof orders.$inferSelect;

function toOrderSummary(row: OrderRow): OrderSummary {
  return {
    orderId: row.orderId,
    userId: row.userName,
    orderDate: row.orderDate.toISOString(),
    orderAmount: row.orderAmount,
    orderStatus: row.status as OrderStatus,
  };
}

// Sorted newest first by order_date, with order_id breaking ties between
// orders sharing a date — order_date alone is not a deterministic sort, and
// an indeterminate sort can repeat a row across a page boundary.
export function getOrdersByStatus(
  status: OrderStatus | OrderStatus[],
  start: number = DEFAULT_START,
  count: number = DEFAULT_COUNT,
): Page<OrderSummary> {
  if (start < 0 || count < 1) {
    return EMPTY_PAGE;
  }

  const statuses = Array.isArray(status) ? status : [status];
  const rows = db
    .select()
    .from(orders)
    .where(inArray(orders.status, statuses))
    .orderBy(desc(orders.orderDate), desc(orders.orderId))
    .limit(count + 1)
    .offset(start)
    .all();

  return {
    items: rows.slice(0, count).map(toOrderSummary),
    hasNext: rows.length > count,
  };
}
