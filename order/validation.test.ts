import { describe, expect, it } from "vitest";

import { OrderValidationError, validateOrderSubmission } from "./validation";
import type { OrderSubmission } from "./validation";

const VALID_ADDRESS = {
  givenName: "Maya",
  familyName: "Chen",
  streetName1: "1150 Alder Street",
  streetName2: "Apartment 4B",
  city: "San Francisco",
  state: "California",
  zipCode: "94117",
  country: "USA",
  telephone: "415-555-0132",
  email: "maya.chen@example.com",
};

type AddressOverrides = Partial<Record<keyof typeof VALID_ADDRESS, string | null>>;

function submission(
  overrides: { billing?: AddressOverrides; shipping?: AddressOverrides } = {},
): OrderSubmission {
  return {
    billingAddress: { ...VALID_ADDRESS, ...overrides.billing },
    shippingAddress: { ...VALID_ADDRESS, ...overrides.shipping },
  };
}

describe("order/validation", () => {
  it("OV-01: a fully populated billing and shipping submission passes", () => {
    expect(() => validateOrderSubmission(submission())).not.toThrow();
  });

  it.each([
    ["givenName", "first name"],
    ["familyName", "last name"],
    ["streetName1", "street address line 1"],
    ["city", "city"],
    ["state", "state"],
    ["zipCode", "postal code"],
    ["country", "country"],
    ["telephone", "telephone"],
    ["email", "email"],
  ] as const)("OV-02-%s: a missing billing %s is rejected naming the field", (field, label) => {
    expect(() => validateOrderSubmission(submission({ billing: { [field]: null } }))).toThrow(
      new OrderValidationError(`Billing ${label} is required.`, "billing", field),
    );
  });

  it("OV-03: a missing shipping field is rejected naming the shipping section", () => {
    expect(() => validateOrderSubmission(submission({ shipping: { city: "" } }))).toThrow(
      new OrderValidationError("Shipping city is required.", "shipping", "city"),
    );
  });

  it("OV-04: a missing streetName2 (line 2) passes — it is optional", () => {
    expect(() =>
      validateOrderSubmission(submission({ billing: { streetName2: null } })),
    ).not.toThrow();
  });

  it("OV-05: an invalid billing email is rejected", () => {
    expect(() =>
      validateOrderSubmission(submission({ billing: { email: "not-an-email" } })),
    ).toThrow(
      new OrderValidationError("Billing email must be a valid email address.", "billing", "email"),
    );
  });

  it("OV-06: a valid email passes", () => {
    expect(() =>
      validateOrderSubmission(submission({ billing: { email: "maya@example.com" } })),
    ).not.toThrow();
  });

  it("OV-07: any non-empty state value passes without vocabulary enforcement", () => {
    expect(() =>
      validateOrderSubmission(submission({ billing: { state: "Nowhereland" } })),
    ).not.toThrow();
  });

  it("OV-08: any non-empty country value passes without vocabulary enforcement", () => {
    expect(() =>
      validateOrderSubmission(submission({ shipping: { country: "Atlantis" } })),
    ).not.toThrow();
  });

  it("OV-09: the error class carries the offending section and field", () => {
    try {
      validateOrderSubmission(submission({ shipping: { telephone: null } }));
      expect.unreachable("expected validateOrderSubmission to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(OrderValidationError);
      expect((error as OrderValidationError).section).toBe("shipping");
      expect((error as OrderValidationError).field).toBe("telephone");
    }
  });
});
