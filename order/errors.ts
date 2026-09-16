// The empty-cart guard's error (design.md § Spec discrepancies S5): the
// extracted specification names a Java exception type; here it is an error
// class the route maps to a response, exactly as order/validation.ts's
// OrderValidationError already does for field validation. Kept in its own
// module rather than beside OrderValidationError — the two guard different
// things (cart state vs. submitted field shape) and share no fields. Named
// ShoppingCartEmptyOrderError, matching the specification's exception name,
// so the requirement it serves stays traceable from the code.
export const EMPTY_CART_MESSAGE = "Your shopping cart is empty. Please add items before ordering.";

export class ShoppingCartEmptyOrderError extends Error {
  constructor(message: string = EMPTY_CART_MESSAGE) {
    super(message);
  }
}
