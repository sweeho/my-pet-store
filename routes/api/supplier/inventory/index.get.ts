// Access control mirrors every /api/admin route (F5, PLAN.md step 3): call
// requireAdmin first and return its error as-is; the path-level decision
// already ran in middleware/signon.ts against the /api/supplier entry
// (SWHM-T-0193).
import { defineHandler } from "nitro/h3";

import { isAdminError, requireAdmin } from "../../../../admin/request";
import type { AdminError } from "../../../../admin/types";
import { listInventory } from "../../../../fulfillment/inventory-admin";
import type { InventoryRow } from "../../../../fulfillment/types";

type Result = { items: InventoryRow[] } | AdminError;

export default defineHandler((event): Result => {
  const admin = requireAdmin(event);
  if (isAdminError(admin)) {
    return admin;
  }

  return { items: listInventory() };
});
