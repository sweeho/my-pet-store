export type AdminError = { error: string };

export type AdminContext = { userName: string };

// Fixed in artifacts/SWHM-S-0012/SWHM-T-0118/PLAN.md § Fixed interface
// contracts. SWHM-T-0119, SWHM-T-0120, SWHM-T-0121 and SWHM-T-0122 code
// against these — add to this file, do not restructure it.
export const ORDER_STATUSES = ["PENDING", "APPROVED", "COMPLETED", "DENIED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderSummary = {
  orderId: number;
  userId: string;
  orderDate: string;
  orderAmount: number;
  orderStatus: OrderStatus;
};

// A page plus hasNext, never a COUNT (ARCHITECTURE.md § Key Decisions) — a
// separate shape from catalog/types.ts's Page<T> because the admin screens'
// field name is `items`, not `objects` (PLAN.md's fixed response shape).
export type Page<T> = {
  items: T[];
  hasNext: boolean;
};
