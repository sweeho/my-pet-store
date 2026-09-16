import { describe, expect, it } from "vitest";

import { InvalidFulfillmentMessageError } from "./errors";
import { parseFulfillmentRequest } from "./receive";

/**
 * UNIT TEST
 *
 * parseFulfillmentRequest is a pure function — no db access (PLAN.md step 1)
 * — so every case is asserted directly against its return value or thrown
 * error.
 */
describe("fulfillment/receive", () => {
  it("RT-01: a body of { orderId: number } parses to a FulfillmentRequest (AC: PO is received from message queue)", () => {
    expect(parseFulfillmentRequest({ orderId: 1001 })).toEqual({ orderId: 1001 });
  });

  it("RT-02: a body missing orderId is refused", () => {
    expect(() => parseFulfillmentRequest({})).toThrow(InvalidFulfillmentMessageError);
  });

  it("RT-03: a body whose orderId is a string is refused", () => {
    expect(() => parseFulfillmentRequest({ orderId: "1001" })).toThrow(
      InvalidFulfillmentMessageError,
    );
  });

  it("RT-04: a null body is refused", () => {
    expect(() => parseFulfillmentRequest(null)).toThrow(InvalidFulfillmentMessageError);
  });

  it("RT-05: an undefined body is refused", () => {
    expect(() => parseFulfillmentRequest(undefined)).toThrow(InvalidFulfillmentMessageError);
  });

  it("RT-06: an array body is refused", () => {
    expect(() => parseFulfillmentRequest([1001])).toThrow(InvalidFulfillmentMessageError);
  });

  it("RT-07: a non-finite orderId (NaN) is refused", () => {
    expect(() => parseFulfillmentRequest({ orderId: NaN })).toThrow(InvalidFulfillmentMessageError);
  });

  it("RT-08: a string body is refused", () => {
    expect(() => parseFulfillmentRequest("1001")).toThrow(InvalidFulfillmentMessageError);
  });
});
