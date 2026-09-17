// The pure auto-approval decision (design.md § Decisions D1): a function of
// locale and amount alone, reading no database, resolving no session and
// converting no currency. order_amount is a single real with no currency
// (§ Spec discrepancies S5), so the two thresholds are compared directly
// against it — this is not a currency conversion.
import type { ApprovalLocale } from "./approval-types";

// Keyed by the strings in account/vocabulary.ts's LANGUAGES. zh_CN carries
// no threshold and falls through the same lookup miss a null locale does —
// not a special case, the requirement's own "all other orders" branch.
const AUTO_APPROVAL_THRESHOLDS: Partial<Record<ApprovalLocale, number>> = {
  en_US: 500,
  ja_JP: 50000,
};

export function decideApproval(
  locale: ApprovalLocale | null,
  orderAmount: number,
): "APPROVED" | "PENDING" {
  const threshold = locale === null ? undefined : AUTO_APPROVAL_THRESHOLDS[locale];
  if (threshold === undefined) return "PENDING";

  return orderAmount < threshold ? "APPROVED" : "PENDING";
}
