import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CARD_TYPES } from "../../account/vocabulary";
import type { Cart } from "../../cart/types";
import { Payment } from "./payment";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/enter-order-information.test.tsx: render the unwrapped
 * content component directly (no RequireSignOn gate), mock /api/cart,
 * /api/payment/authorize and /api/order, and assert against accessible
 * roles/labels. Built to
 * artifacts/SWHM-S-0016/design/mockup-checkout-payment-details.html and
 * .../mockup-checkout-payment-details-validation-and.html (States A/B/C).
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
  ],
  count: 1,
  subtotal: 199.99,
};

const PAYMENT_STATE = {
  billingAddress: {
    givenName: "Maya",
    familyName: "Chen",
    streetName1: "1150 Alder Street",
    streetName2: null,
    city: "San Francisco",
    state: "California",
    zipCode: "94117",
    country: "USA",
    telephone: "415-555-0132",
    email: "maya.chen@example.com",
  },
  shippingAddress: {
    givenName: "Maya",
    familyName: "Chen",
    streetName1: "88 Junction Row",
    streetName2: null,
    city: "Brooklyn",
    state: "New York",
    zipCode: "11222",
    country: "USA",
    telephone: "718-555-0117",
    email: "maya.chen+ship@example.com",
  },
};

const VALID_CARD = {
  "Cardholder name": "Maya Chen",
  "Card type": CARD_TYPES[0],
  "Card number": "4111111111111111",
  "Expiry month": "09",
};

const fetchMock = vi.fn();
const navigateMock = vi.fn();
let locationState: unknown = PAYMENT_STATE;

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({
      pathname: "/payment",
      search: "",
      hash: "",
      key: "t",
      state: locationState,
    }),
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <Payment />
    </MemoryRouter>,
  );
}

function mockFetch(handlers: {
  authorize?: ReturnType<typeof jsonResponse>;
  order?: ReturnType<typeof jsonResponse>;
}) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url === "/api/cart") return Promise.resolve(jsonResponse(POPULATED_CART));
    if (url === "/api/payment/authorize" && init?.method === "POST") {
      return Promise.resolve(handlers.authorize ?? jsonResponse({ status: "approved" }));
    }
    if (url === "/api/order" && init?.method === "POST") {
      return Promise.resolve(
        handlers.order ?? jsonResponse({ orderId: 1005, email: "maya.chen@example.com" }),
      );
    }
    throw new Error(`unexpected fetch: ${url} ${init?.method ?? "GET"}`);
  });
}

async function fillValidCard(userEvent: typeof import("@testing-library/user-event").default) {
  const section = within(screen.getByRole("region", { name: "Payment method" }));
  await userEvent.type(section.getByLabelText("Cardholder name"), VALID_CARD["Cardholder name"]);
  await userEvent.selectOptions(section.getByLabelText("Card type"), VALID_CARD["Card type"]);
  await userEvent.type(section.getByLabelText("Card number"), VALID_CARD["Card number"]);
  await userEvent.selectOptions(section.getByLabelText("Expiry month"), VALID_CARD["Expiry month"]);
  const years = within(section.getByLabelText("Expiry year"))
    .getAllByRole("option")
    .map((option) => option.getAttribute("value"))
    .filter((value): value is string => !!value);
  await userEvent.selectOptions(section.getByLabelText("Expiry year"), years[years.length - 1]!);
}

describe("Payment (/payment)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    locationState = PAYMENT_STATE;
    mockFetch({});
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PAY-01: with no order data carried in navigation state, redirects back to /enter-order-information", () => {
    locationState = null;
    renderPage();

    expect(navigateMock).toHaveBeenCalledWith("/enter-order-information", { replace: true });
  });

  it("PAY-02: renders Order summary, Billing address and Payment method sections", () => {
    renderPage();

    expect(screen.getByRole("region", { name: "Order summary" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Billing address" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Payment method" })).toBeInTheDocument();
  });

  it("PAY-03: the card type dropdown offers exactly this store's accepted types, plus a placeholder", () => {
    renderPage();

    const section = within(screen.getByRole("region", { name: "Payment method" }));
    const options = within(section.getByLabelText("Card type"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(["— Select —", ...CARD_TYPES]);
  });

  it("PAY-04: renders the order summary from the cart once loaded, and the billing recap from navigation state", async () => {
    renderPage();

    expect(await screen.findByText("Persian")).toBeInTheDocument();
    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("maya.chen@example.com")).toBeInTheDocument();
  });

  it("PAY-05: renders a role=status indicator while the order summary is loading", () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/cart") return new Promise(() => {});
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderPage();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  describe("submitting payment", () => {
    it("PAY-06 (AC-1): an accepted card reaches authorization, then places the order and navigates to confirmation", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      renderPage();
      await screen.findByText("Persian");

      await fillValidCard(userEvent);
      await userEvent.click(screen.getByRole("button", { name: "Submit payment" }));

      await vi.waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith("/order-completed", {
          state: { orderId: 1005, email: "maya.chen@example.com" },
        });
      });

      const authorizeCall = fetchMock.mock.calls.find(([url]) => url === "/api/payment/authorize");
      expect(authorizeCall).toBeDefined();
      const orderCall = fetchMock.mock.calls.find(([url]) => url === "/api/order");
      expect(orderCall).toBeDefined();
      expect(JSON.parse((orderCall![1] as RequestInit).body as string)).toEqual({
        billingAddress: PAYMENT_STATE.billingAddress,
        shippingAddress: PAYMENT_STATE.shippingAddress,
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("PAY-07 (State A): a card refused by validation shows one form-level alert and marks the field invalid, and never calls /api/order", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      mockFetch({
        authorize: jsonResponse(
          {
            error: "Select an accepted card type.",
            field: "cardType",
            alert: "Check the highlighted fields before submitting.",
          },
          { ok: false, status: 400 },
        ),
      });
      renderPage();
      await screen.findByText("Persian");

      await fillValidCard(userEvent);
      await userEvent.click(screen.getByRole("button", { name: "Submit payment" }));

      const alerts = await screen.findAllByRole("alert");
      expect(alerts).toHaveLength(2);
      expect(
        screen.getByText("Check the highlighted fields before submitting."),
      ).toBeInTheDocument();
      const section = within(screen.getByRole("region", { name: "Payment method" }));
      expect(section.getByLabelText("Card type")).toHaveAttribute("aria-invalid", "true");
      expect(fetchMock.mock.calls.some(([url]) => url === "/api/order")).toBe(false);
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it("PAY-08 (State C): a declined card shows the decline alert and never calls /api/order", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      mockFetch({ authorize: jsonResponse({ status: "declined" }) });
      renderPage();
      await screen.findByText("Persian");

      await fillValidCard(userEvent);
      await userEvent.click(screen.getByRole("button", { name: "Submit payment" }));

      expect(
        await screen.findByText(
          "Payment was not authorized. No order was placed and the card was not charged.",
        ),
      ).toBeInTheDocument();
      expect(fetchMock.mock.calls.some(([url]) => url === "/api/order")).toBe(false);
      expect(navigateMock).not.toHaveBeenCalled();
    });

    it("PAY-09 (State B): while authorization is in flight, the submit control is disabled and reads Authorizing…, with a status line", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (url === "/api/cart") return Promise.resolve(jsonResponse(POPULATED_CART));
        if (url === "/api/payment/authorize") return new Promise(() => {});
        throw new Error(`unexpected fetch: ${url} ${init?.method ?? "GET"}`);
      });
      renderPage();
      await screen.findByText("Persian");

      await fillValidCard(userEvent);
      await userEvent.click(screen.getByRole("button", { name: "Submit payment" }));

      const submitButton = await screen.findByRole("button", { name: "Authorizing…" });
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole("status")).toHaveTextContent(/authorizing/i);
    });

    it("PAY-10: an empty-cart refusal from order placement sends the shopper to /cart flagged", async () => {
      const { default: userEvent } = await import("@testing-library/user-event");
      mockFetch({
        order: jsonResponse(
          {
            error: "Your shopping cart is empty. Please add items before ordering.",
            emptyCart: true,
          },
          { ok: false, status: 400 },
        ),
      });
      renderPage();
      await screen.findByText("Persian");

      await fillValidCard(userEvent);
      await userEvent.click(screen.getByRole("button", { name: "Submit payment" }));

      await vi.waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith("/cart", { state: { emptyCart: true } });
      });
    });
  });
});
