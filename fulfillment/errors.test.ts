import { describe, expect, it } from "vitest";

import {
  InvalidFulfillmentMessageError,
  InvalidInventoryUpdateError,
  InvoiceGenerationError,
  OrderNotFoundError,
} from "./errors";

/**
 * UNIT TEST
 *
 * Each class is Error, sets its own `name`, and carries a message with no
 * further behaviour (PLAN.md step 4).
 */
describe("fulfillment/errors", () => {
  it("ET-01: InvalidFulfillmentMessageError is an Error named for itself", () => {
    const error = new InvalidFulfillmentMessageError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("InvalidFulfillmentMessageError");
    expect(error.message.length).toBeGreaterThan(0);
  });

  it("ET-02: OrderNotFoundError is an Error named for itself", () => {
    const error = new OrderNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("OrderNotFoundError");
    expect(error.message.length).toBeGreaterThan(0);
  });

  it("ET-03: InvoiceGenerationError is an Error named for itself", () => {
    const error = new InvoiceGenerationError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("InvoiceGenerationError");
    expect(error.message.length).toBeGreaterThan(0);
  });

  it("ET-04: InvalidInventoryUpdateError is an Error named for itself", () => {
    const error = new InvalidInventoryUpdateError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("InvalidInventoryUpdateError");
    expect(error.message.length).toBeGreaterThan(0);
  });

  it("ET-05: each class accepts a custom message", () => {
    expect(new OrderNotFoundError("order 1001 not found").message).toBe("order 1001 not found");
  });
});
