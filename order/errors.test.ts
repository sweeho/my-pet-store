import { describe, expect, it } from "vitest";

import { EMPTY_CART_MESSAGE, ShoppingCartEmptyOrderError } from "./errors";

describe("ShoppingCartEmptyOrderError", () => {
  it("ERR-01: is an Error carrying the fixed empty-cart message by default", () => {
    const error = new ShoppingCartEmptyOrderError();

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(EMPTY_CART_MESSAGE);
  });

  it("ERR-02: is named ShoppingCartEmptyOrderError, so the requirement it serves is traceable from the code", () => {
    const error = new ShoppingCartEmptyOrderError();

    expect(error.constructor.name).toBe("ShoppingCartEmptyOrderError");
    expect(error).toBeInstanceOf(ShoppingCartEmptyOrderError);
  });

  it("ERR-03: accepts a custom message without losing its type", () => {
    const error = new ShoppingCartEmptyOrderError("custom message");

    expect(error.message).toBe("custom message");
    expect(error).toBeInstanceOf(ShoppingCartEmptyOrderError);
  });
});
