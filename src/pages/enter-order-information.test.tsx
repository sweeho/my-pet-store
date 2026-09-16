import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Cart } from "../../cart/types";
import { EnterOrderInformation } from "./enter-order-information";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/customer.test.tsx: render the unwrapped content
 * component directly (no RequireSignOn gate), mock /api/cart, and assert
 * against accessible roles/labels rather than DOM shape. Built to
 * artifacts/SWHM-S-0014/design/mockup-enter-order-information.html.
 *
 * Submission tests mock useNavigate the way
 * src/components/RequireSignOn.test.tsx does, since this page calls it on a
 * successful submit.
 */
function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const POPULATED_CART: Cart = {
  items: [
    {
      itemId: "CATS-LONGHAIR-1",
      productName: "Persian",
      description: "A long-haired cat",
      unitCost: 199.99,
      quantity: 1,
      lineTotal: 199.99,
    },
    {
      itemId: "FISH-ANGELFISH-1",
      productName: "Silver Angelfish",
      description: "A freshwater fish",
      unitCost: 14.99,
      quantity: 2,
      lineTotal: 29.98,
    },
  ],
  count: 2,
  subtotal: 229.97,
};

const fetchMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <EnterOrderInformation />
    </MemoryRouter>,
  );
}

// Only /api/cart is mocked unless a test also calls mockOrderResponse to
// answer a POST to /api/order — the two default tests here never submit.
function mockOrderResponse(response: ReturnType<typeof jsonResponse>) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url === "/api/cart") return Promise.resolve(jsonResponse(POPULATED_CART));
    if (url === "/api/order" && init?.method === "POST") return Promise.resolve(response);
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe("EnterOrderInformation (/enter-order-information)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/cart") return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const FIELD_LABELS = [
    "First name",
    "Last name",
    "Street address line 1",
    "Street address line 2",
    "City",
    "State / Province",
    "Postal code",
    "Country",
    "Telephone",
    "Email",
  ];

  it("EOI-01: renders a Billing Information section and a Shipping Information section", () => {
    renderPage();

    expect(screen.getByRole("region", { name: "Billing Information" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Shipping Information" })).toBeInTheDocument();
  });

  it("EOI-02: the Billing Information section shows every required field", () => {
    renderPage();

    const billing = within(screen.getByRole("region", { name: "Billing Information" }));
    for (const label of FIELD_LABELS) {
      expect(billing.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("EOI-03: the Shipping Information section shows the same fields as billing", () => {
    renderPage();

    const shipping = within(screen.getByRole("region", { name: "Shipping Information" }));
    for (const label of FIELD_LABELS) {
      expect(shipping.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("EOI-04: the state dropdown displays exactly California, New York and Texas in both sections", () => {
    renderPage();

    for (const sectionName of ["Billing Information", "Shipping Information"]) {
      const section = within(screen.getByRole("region", { name: sectionName }));
      const select = section.getByRole("combobox", { name: "State / Province" });
      const options = within(select)
        .getAllByRole("option")
        .map((option) => option.textContent);
      expect(options).toEqual(["California", "New York", "Texas"]);
    }
  });

  it("EOI-05: the country dropdown displays exactly USA, Canada, Japan and China in both sections", () => {
    renderPage();

    for (const sectionName of ["Billing Information", "Shipping Information"]) {
      const section = within(screen.getByRole("region", { name: sectionName }));
      const select = section.getByRole("combobox", { name: "Country" });
      const options = within(select)
        .getAllByRole("option")
        .map((option) => option.textContent);
      expect(options).toEqual(["USA", "Canada", "Japan", "China"]);
    }
  });

  it("EOI-06: the first name field in each section rejects input beyond 30 characters (maxlength=30)", () => {
    renderPage();

    for (const sectionName of ["Billing Information", "Shipping Information"]) {
      const section = within(screen.getByRole("region", { name: sectionName }));
      expect(section.getByLabelText("First name")).toHaveAttribute("maxlength", "30");
      expect(section.getByLabelText("Last name")).toHaveAttribute("maxlength", "30");
    }
  });

  it("EOI-07: the street address fields in each section reject input beyond 70 characters (maxlength=70)", () => {
    renderPage();

    for (const sectionName of ["Billing Information", "Shipping Information"]) {
      const section = within(screen.getByRole("region", { name: sectionName }));
      expect(section.getByLabelText("Street address line 1")).toHaveAttribute("maxlength", "70");
      expect(section.getByLabelText("Street address line 2")).toHaveAttribute("maxlength", "70");
    }
  });

  it("EOI-08: remaining fields carry the mockup's other length constraints", () => {
    renderPage();

    const billing = within(screen.getByRole("region", { name: "Billing Information" }));
    expect(billing.getByLabelText("City")).toHaveAttribute("maxlength", "30");
    expect(billing.getByLabelText("Postal code")).toHaveAttribute("maxlength", "20");
    expect(billing.getByLabelText("Telephone")).toHaveAttribute("maxlength", "20");
    expect(billing.getByLabelText("Email")).toHaveAttribute("maxlength", "50");
  });

  it("EOI-09: a field holds what is typed into it", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    renderPage();

    const billing = within(screen.getByRole("region", { name: "Billing Information" }));
    const firstName = billing.getByLabelText("First name");
    await userEvent.type(firstName, "Maya");

    expect(firstName).toHaveValue("Maya");
  });

  it("EOI-10: renders a role=status indicator while the order summary is loading", () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("EOI-11: renders the order summary from the cart once loaded", async () => {
    renderPage();

    expect(await screen.findByText("Persian")).toBeInTheDocument();
    expect(screen.getByText("Silver Angelfish")).toBeInTheDocument();
    expect(screen.getAllByText("$229.97")).toHaveLength(2);
  });

  it("EOI-12: renders a Return to Cart control that navigates back to /cart", async () => {
    renderPage();

    await screen.findByText("Persian");
    expect(screen.getByRole("link", { name: "Return to Cart" })).toHaveAttribute("href", "/cart");
  });

  describe("submitting the order", () => {
    it("EOI-13: an accepted submission reaches the placement path rather than the form's error branch, carrying the order id and email forward", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      mockOrderResponse(jsonResponse({ orderId: 1005, email: "maya.chen@example.com" }));
      renderPage();
      await screen.findByText("Persian");

      await userEvent.click(screen.getByRole("button", { name: "Submit Order" }));

      await vi.waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith("/order-completed", {
          state: { orderId: 1005, email: "maya.chen@example.com" },
        });
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("EOI-14: a refused submission shows one form-level alert and marks the offending field invalid with its own message", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      mockOrderResponse(
        jsonResponse(
          {
            error: "Shipping email must be a valid email address.",
            section: "shipping",
            field: "email",
          },
          { ok: false, status: 400 },
        ),
      );
      renderPage();
      await screen.findByText("Persian");

      const shipping = within(screen.getByRole("region", { name: "Shipping Information" }));
      const shippingEmail = shipping.getByLabelText("Email");
      await userEvent.type(shippingEmail, "maya.chen@example");

      await userEvent.click(screen.getByRole("button", { name: "Submit Order" }));

      const alerts = await screen.findAllByRole("alert");
      expect(alerts).toHaveLength(2);
      expect(
        screen.getByText("Please correct the highlighted field before submitting your order."),
      ).toBeInTheDocument();
      expect(shippingEmail).toHaveAttribute("aria-invalid", "true");
      const fieldAlert = screen.getByText("Shipping email must be a valid email address.");
      expect(fieldAlert).toHaveAttribute("role", "alert");
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it("EOI-16: an empty-cart refusal sends the shopper back to /cart flagged, rather than showing a form alert", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      mockOrderResponse(
        jsonResponse(
          {
            error: "Your shopping cart is empty. Please add items before ordering.",
            emptyCart: true,
          },
          { ok: false, status: 400 },
        ),
      );
      renderPage();
      await screen.findByText("Persian");

      await userEvent.click(screen.getByRole("button", { name: "Submit Order" }));

      await vi.waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith("/cart", { state: { emptyCart: true } });
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("EOI-15: a refused submission leaves every entered value intact", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      mockOrderResponse(
        jsonResponse(
          { error: "Billing first name is required.", section: "billing", field: "givenName" },
          { ok: false, status: 400 },
        ),
      );
      renderPage();
      await screen.findByText("Persian");

      const billing = within(screen.getByRole("region", { name: "Billing Information" }));
      const billingFamilyName = billing.getByLabelText("Last name");
      await userEvent.type(billingFamilyName, "Chen");

      await userEvent.click(screen.getByRole("button", { name: "Submit Order" }));
      await screen.findAllByRole("alert");

      expect(billingFamilyName).toHaveValue("Chen");
    });
  });
});
