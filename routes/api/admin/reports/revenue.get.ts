import { defineHandler, getQuery, setResponseStatus } from "nitro/h3";

import { isAdminError, requireAdmin } from "../../../../admin/request";
import { getRevenueReport, parseReportDates } from "../../../../admin/reports";
import type { AdminError, Report } from "../../../../admin/types";

type Result = Report | AdminError;

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
  const start = typeof query.start === "string" ? query.start : "";
  const end = typeof query.end === "string" ? query.end : "";
  const category = typeof query.category === "string" ? query.category : undefined;

  const range = parseReportDates(start, end);
  if ("error" in range) {
    setResponseStatus(event, 400);
    return range;
  }

  return getRevenueReport(range, category);
});
