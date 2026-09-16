// Access control mirrors every /api/admin route (F5, PLAN.md step 3).
// AC-3 in this product's terms (S8): the form submits the selected rows
// here, the endpoint that updates inventory — there is no
// RcvrRequestProcessor path.
import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import { isAdminError, requireAdmin } from "../../../../admin/request";
import type { AdminError } from "../../../../admin/types";
import { InvalidInventoryUpdateError } from "../../../../fulfillment/errors";
import { applyInventoryUpdates } from "../../../../fulfillment/inventory-admin";
import type { InventoryUpdate, InventoryUpdateResult } from "../../../../fulfillment/types";

type Body = { updates?: unknown };
type Result = InventoryUpdateResult | AdminError;

function isUpdateEntry(value: unknown): value is InventoryUpdate {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { itemid?: unknown }).itemid === "string" &&
    typeof (value as { quantity?: unknown }).quantity === "number"
  );
}

function parseUpdates(raw: unknown): InventoryUpdate[] | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "updates must be a non-empty array" };
  }

  for (const value of raw) {
    if (!isUpdateEntry(value)) {
      return { error: "each update must be { itemid: string, quantity: number }" };
    }
  }

  return raw as InventoryUpdate[];
}

export default defineHandler(async (event): Promise<Result> => {
  const admin = requireAdmin(event);
  if (isAdminError(admin)) {
    return admin;
  }

  const body = await readBody<Body>(event);
  const updates = parseUpdates(body?.updates);
  if ("error" in updates) {
    setResponseStatus(event, 400);
    return { error: updates.error };
  }

  try {
    return applyInventoryUpdates(updates);
  } catch (error) {
    if (!(error instanceof InvalidInventoryUpdateError)) throw error;
    setResponseStatus(event, 400);
    return { error: error.message };
  }
});
