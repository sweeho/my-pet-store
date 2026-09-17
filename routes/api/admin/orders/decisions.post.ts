import { defineHandler, readBody, setResponseStatus } from "nitro/h3";

import {
  applyOrderDecisions,
  type DecisionBatchResult,
  type OrderDecision,
} from "../../../../admin/order-status";
import { isAdminError, requireAdmin } from "../../../../admin/request";
import type { AdminError } from "../../../../admin/types";
import type { ApprovalDecision } from "../../../../order/approval-types";

type DecisionsBody = {
  decisions?: unknown;
};

type Result = DecisionBatchResult | AdminError;

const DECISION_STATUSES: readonly ApprovalDecision[] = ["APPROVED", "DENIED"];

function isApprovalDecision(value: unknown): value is ApprovalDecision {
  return typeof value === "string" && (DECISION_STATUSES as readonly string[]).includes(value);
}

// Mirrors status.post.ts's parseOrderIds structure (PLAN.md step 3): one
// pass that either returns the typed array or the first error found.
// PENDING is a state an order is in, not a decision anyone commits, and the
// screen never sends one — it is refused here the same as any other
// unrecognized status (design.md § Spec discrepancies S7).
function parseDecisions(raw: unknown): OrderDecision[] | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "decisions must be a non-empty array" };
  }

  const decisions: OrderDecision[] = [];
  for (const value of raw) {
    if (typeof value !== "object" || value === null) {
      return { error: "each decision must be an object with orderId and status" };
    }

    const { orderId, status } = value as { orderId?: unknown; status?: unknown };

    if (typeof orderId !== "number" || !Number.isFinite(orderId)) {
      return { error: "each decision's orderId must be a number" };
    }

    if (!isApprovalDecision(status)) {
      return { error: `each decision's status must be one of ${DECISION_STATUSES.join(", ")}` };
    }

    decisions.push({ orderId, status });
  }

  return decisions;
}

// OrderApprovalMDB.onMessage() with the transport removed (design.md §
// Spec discrepancies S1): this route is the handler, the request body is
// the message, body validation is the selector, and
// applyOrderDecisions's db.transaction is the Required transaction
// attribute. Call requireAdmin first and return its error as-is (design.md
// D6) — the same shape status.post.ts and index.get.ts already use. The
// route holds no logic of its own beyond parsing (PLAN.md step 4); a
// skipped or unmatched order comes back in the response, not as an error
// (S8).
export default defineHandler(async (event): Promise<Result> => {
  const admin = requireAdmin(event);
  if (isAdminError(admin)) {
    return admin;
  }

  const body = await readBody<DecisionsBody>(event);

  const decisions = parseDecisions(body?.decisions);
  if ("error" in decisions) {
    setResponseStatus(event, 400);
    return { error: decisions.error };
  }

  return applyOrderDecisions(decisions);
});
