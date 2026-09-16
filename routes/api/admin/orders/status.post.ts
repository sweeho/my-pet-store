import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { isAdminError, requireAdmin } from "../../../../admin/request";
import { updateOrderStatus, type StatusUpdateResult } from "../../../../admin/order-status";
import { ORDER_STATUSES, type AdminError, type OrderStatus } from "../../../../admin/types";

type StatusUpdateBody = {
  orderIds?: unknown;
  status?: unknown;
};

type Result = StatusUpdateResult | AdminError;

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

function parseOrderIds(raw: unknown): number[] | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "orderIds must be a non-empty array" };
  }

  const orderIds: number[] = [];
  for (const value of raw) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { error: "orderIds must contain only numbers" };
    }
    orderIds.push(value);
  }
  return orderIds;
}

// Call requireAdmin first and return its error as-is (design.md D6): the
// path-level decision already ran in middleware/signon.ts, this route's
// only job is to read a typed username or refuse the same way every other
// admin route does.
export default defineHandler(async (event): Promise<Result> => {
  const admin = requireAdmin(event);
  if (isAdminError(admin)) {
    return admin;
  }

  const body = await readBody<StatusUpdateBody>(event);

  const orderIds = parseOrderIds(body?.orderIds);
  if ("error" in orderIds) {
    setResponseStatus(event, 400);
    return { error: orderIds.error };
  }

  if (!isOrderStatus(body?.status)) {
    setResponseStatus(event, 400);
    return { error: `status must be one of ${ORDER_STATUSES.join(", ")}` };
  }

  return updateOrderStatus(orderIds, body.status);
});
