import { defineHandler, getQuery, setResponseStatus } from "nitro/h3";

import { isAdminError, requireAdmin } from "../../../../admin/request";
import { getOrderCountReport, parseReportDates } from "../../../../admin/reports";
import type { AdminError, Report } from "../../../../admin/types";

type Result = Report | AdminError;

// Mirrors routes/api/admin/reports/revenue.get.ts exactly — requireAdmin
// first and return its error as-is (design.md D6), same query parameters,
// same 400 conditions, same error shape. The only difference is which
// report function it calls (SWHM-T-0121 PLAN.md step 3).
export default defineHandler((event): Result => {
  const admin = requireAdmin(event);
  if (isAdminError(admin)) {
    return admin;
  }

  const query = getQuery(event);
  const start = typeof query.start === "string" ? query.start : "";
  const end = typeof query.end === "string" ? query.end : "";
  const category = typeof query.category === "string" ? query.category : undefined;

  const range = parseReportDates(start, end);
  if ("error" in range) {
    setResponseStatus(event, 400);
    return range;
  }

  return getOrderCountReport(range, category);
});
