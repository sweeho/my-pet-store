import type { OrderAddress } from "./types";

export type OrderAddressSection = "billing" | "shipping";

export type OrderSubmission = {
  billingAddress: Partial<OrderAddress>;
  shippingAddress: Partial<OrderAddress>;
};

export class OrderValidationError extends Error {
  constructor(
    message: string,
    readonly section: OrderAddressSection,
    readonly field: keyof OrderAddress,
  ) {
    super(message);
  }
}

// Every OrderAddress field is required except streetName2 (design.md §
// Order Information Form lists it as a second, optional address line — the
// mockup's shipping section ships it blank with an "Optional" placeholder).
const REQUIRED_FIELDS: { field: keyof OrderAddress; label: string }[] = [
  { field: "givenName", label: "first name" },
  { field: "familyName", label: "last name" },
  { field: "streetName1", label: "street address line 1" },
  { field: "city", label: "city" },
  { field: "state", label: "state" },
  { field: "zipCode", label: "postal code" },
  { field: "country", label: "country" },
  { field: "telephone", label: "telephone" },
  { field: "email", label: "email" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECTION_LABEL: Record<OrderAddressSection, string> = {
  billing: "Billing",
  shipping: "Shipping",
};

function validateSection(section: OrderAddressSection, address: Partial<OrderAddress>): void {
  for (const { field, label } of REQUIRED_FIELDS) {
    const value = address[field];
    if (value === undefined || value === null || value.trim() === "") {
      throw new OrderValidationError(
        `${SECTION_LABEL[section]} ${label} is required.`,
        section,
        field,
      );
    }
  }

  if (!EMAIL_PATTERN.test(address.email!)) {
    throw new OrderValidationError(
      `${SECTION_LABEL[section]} email must be a valid email address.`,
      section,
      "email",
    );
  }
}

// State and country are not enforced against a fixed vocabulary — any
// non-empty value passes, matching account/validation.ts's standing
// treatment of those same two fields (design.md § Codebase findings F9).
export function validateOrderSubmission(submission: OrderSubmission): void {
  validateSection("billing", submission.billingAddress ?? {});
  validateSection("shipping", submission.shippingAddress ?? {});
}
