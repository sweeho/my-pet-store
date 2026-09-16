// Fixed in artifacts/SWHM-S-0017/SWHM-T-0187/PLAN.md § Fixed interface
// contracts (design.md § Decisions D6). Written whole by this ticket and
// never extended by a later ticket in this sprint — add nothing here.
import type { OrderStatus } from "../admin/types";

export type FulfillmentLine = {
  orderId: number;
  lineNumber: number;
  itemid: string;
  catid: string | null;
  productid: string | null;
  quantity: number;
  quantityShipped: number;
  unitPrice: number;
};

export type InvoiceOrder = { orderId: number; userName: string; orderDate: Date };

export type InventoryRow = { itemid: string; quantity: number };
export type InventoryUpdate = { itemid: string; quantity: number };
export type InventoryUpdateResult = { updated: string[]; notFound: string[] };

export type FulfillmentRequest = { orderId: number };
export type FulfillmentResponse = { orderId: number; invoice: string | null; status: OrderStatus };
