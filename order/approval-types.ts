// Written whole by the first ticket in this sprint (design.md § Decisions
// D10) — SWHM-T-0205 through SWHM-T-0213 all import from this file and do
// not append to it. OrderStatus is not moved here; it stays in
// admin/types.ts, which order/, fulfillment/ and the screens already import
// from (D10).
import type { OrderStatus } from "../admin/types";
import type { OrderAddress } from "./types";

// The product's locale vocabulary (account/vocabulary.ts LANGUAGES),
// restated as the type the decision keys off — not java.util.Locale, which
// has no counterpart here (design.md § Spec discrepancies S4).
export type ApprovalLocale = "en_US" | "ja_JP" | "zh_CN";

export type ApprovalDecision = "APPROVED" | "DENIED";

// The three-way shape one decision resolves to (design.md § Decisions D3):
// applied when the order was PENDING, skipped when it was already terminal
// (the guard reports a skip rather than raising), notFound when the id
// matches no order at all.
export type DecisionOutcome =
  | { orderId: number; result: "applied"; status: ApprovalDecision }
  | { orderId: number; result: "skipped"; status: OrderStatus }
  | { orderId: number; result: "notFound" };

// Two rows, not a document (design.md § Decisions D4). supplier_po carries
// the order id, the PO date and the shipping address snapshot copied at
// approval time, the same way the order itself copies from the account
// rather than joining back to it at read time.
export type SupplierPurchaseOrder = {
  orderId: number;
  poDate: Date;
  shippingAddress: OrderAddress;
};

// One row per line item, copied from order_line_item at approval time
// rather than joined back to it at read time (design.md § Decisions D4).
export type SupplierPoLine = {
  orderId: number;
  lineNumber: number;
  catid: string | null;
  productid: string | null;
  itemid: string;
  quantity: number;
  unitPrice: number;
};

// A notification is a row recording what is owed; nothing sends it —
// swhm-i-0012 owns delivery (design.md § Decisions D5).
export type NotificationKind = "APPROVAL" | "DENIAL";
