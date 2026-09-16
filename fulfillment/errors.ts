// Written whole by this ticket (design.md § Decisions D6) — four error
// classes, one per fulfilment failure mode, each setting its own `name` so
// a caller mapping errors to responses can switch on it rather than on
// message text. No behaviour beyond a message, matching order/errors.ts's
// ShoppingCartEmptyOrderError.

// The request-validation counterpart to a JMS message selector (design.md
// § Spec discrepancies S11): a fulfilment request body that is not
// { orderId: number } is refused here rather than accepted and failing later.
export class InvalidFulfillmentMessageError extends Error {
  constructor(message: string = "Fulfilment request is invalid.") {
    super(message);
    this.name = "InvalidFulfillmentMessageError";
  }
}

// Raised when a fulfilment request or an invoice names an order id this
// database does not hold.
export class OrderNotFoundError extends Error {
  constructor(message: string = "Order not found.") {
    super(message);
    this.name = "OrderNotFoundError";
  }
}

// The XMLDocumentException counterpart (design.md § Spec discrepancies S7):
// raised when an invoice cannot be produced for a fulfilled order.
export class InvoiceGenerationError extends Error {
  constructor(message: string = "Invoice generation failed.") {
    super(message);
    this.name = "InvoiceGenerationError";
  }
}

// Raised when an inventory update submission is malformed — not for an
// unknown item id, which InventoryUpdateResult.notFound already reports
// without failing the whole batch.
export class InvalidInventoryUpdateError extends Error {
  constructor(message: string = "Inventory update is invalid.") {
    super(message);
    this.name = "InvalidInventoryUpdateError";
  }
}
