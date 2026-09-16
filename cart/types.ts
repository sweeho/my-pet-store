// Entity types, fixed in artifacts/SWHM-S-0013/SWHM-T-0133/PLAN.md § Fixed
// interface contracts (design.md D8, S4). Written whole by this ticket —
// including the fields only the checkout seam (SWHM-T-0140) and the cart
// screen consume — and never extended by a later ticket in this sprint.
export type CartItem = {
  itemId: string;
  productName: string;
  description: string;
  unitCost: number;
  quantity: number;
  lineTotal: number;
};

// count and subtotal are derived on read, never stored (design.md D6):
// count is the number of distinct line items, not the sum of quantities
// (design.md D5, S7).
export type Cart = {
  items: CartItem[];
  count: number;
  subtotal: number;
};
