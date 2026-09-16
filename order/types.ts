// Entity types, fixed in artifacts/SWHM-S-0014/SWHM-T-0153/PLAN.md § Fixed
// interface contracts (design.md D8). Written whole by this ticket —
// including fields only later tickets in this sprint persist (order id
// allocation, order creation, line item creation) — and never extended by a
// later ticket in this sprint.
import type { Address, ContactInfo } from "../account/types";
import type { OrderStatus } from "../admin/types";

// The order form's billing and shipping sections both ask for every
// ContactInfo field alongside every Address field (design.md § Spec
// discrepancies S6), so an order copies one of these per section rather than
// a bare Address.
export type OrderAddress = ContactInfo & Address;

export type LineItem = {
  orderId: number;
  lineNumber: number;
  itemid: string;
  catid: string;
  productid: string;
  quantity: number;
  quantityShipped: number;
  unitPrice: number;
};

export type Order = {
  orderId: number;
  userName: string;
  orderDate: Date;
  orderAmount: number;
  status: OrderStatus;
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  lineItems: LineItem[];
};
