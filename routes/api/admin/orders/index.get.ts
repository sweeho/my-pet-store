import { defineHandler, getQuery, setResponseStatus } from "nitro/h3";

import { isAdminError, requireAdmin } from "../../../../admin/request";
import {
  getOrdersByStatus,
  ORDER_STATUSES,
  type OrderStatus,
  type OrderSummary,
  type Page,
} from "../../../../admin/orders";
import type { AdminError } from "../../../../admin/types";

type Result = Page<OrderSummary> | AdminError;

function parsePagination(
  query: Record<string, unknown>,
): { start?: number; count?: number } | { error: string } {
  const start = query.start === undefined ? undefined : Number(query.start);
  if (start !== undefined && !Number.isFinite(start)) {
    return { error: "start must be a number" };
  }

  const count = query.count === undefined ? undefined : Number(query.count);
  if (count !== undefined && (!Number.isFinite(count) || count < 1 || count > 100)) {
    return { error: "count must be a number between 1 and 100" };
  }

  return { start, count };
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

function parseStatuses(raw: unknown): OrderStatus[] | { error: string } {
  const values = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  if (values.length === 0) {
    return { error: "status is required" };
  }

  const statuses: OrderStatus[] = [];
  for (const value of values) {
    if (!isOrderStatus(value)) {
      return { error: `status must be one of ${ORDER_STATUSES.join(", ")}` };
    }
    statuses.push(value);
  }
  return statuses;
}

// Call requireAdmin first and return its error as-is (design.md D6): the
// path-level decision already ran in middleware/signon.ts, this route's
// only job is to read a typed username or refuse the same way every other
// admin route does.
export default defineHandler((event): Result => {
  const admin = requireAdmin(event);
  if (isAdminError(admin)) {
    return admin;
  }

  const query = getQuery(event);

  const statuses = parseStatuses(query.status);
  if ("error" in statuses) {
    setResponseStatus(event, 400);
    return { error: statuses.error };
  }

  const pagination = parsePagination(query);
  if ("error" in pagination) {
    setResponseStatus(event, 400);
    return { error: pagination.error };
  }

  return getOrdersByStatus(statuses, pagination.start, pagination.count);
});
