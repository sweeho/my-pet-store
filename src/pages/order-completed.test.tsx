import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrderCompleted } from "./order-completed";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/customer.test.tsx: render the unwrapped content component
 * directly (no RequireSignOn gate). Built to
 * artifacts/SWHM-S-0014/design/mockup-order-confirmation.html.
 *
 * The order id and email arrive as router navigation state — { orderId, email }
 * — the shape SWHM-T-0156's placement route returns (PLAN.md step 4); this
 * page issues no fetch to read an order back. design.md S13: the mockup
 * renders "Your order Id is" as a label above the number as a separate,
 * larger element, so the two are composed into one accessible name on the
 * wrapping group rather than asserted as one text node.
 *
 * The shared header (StoreHeader, SWHM-T-0237) fetches /api/signon/session
 * and /api/cart on every mount, so fetch is stubbed for those two even
 * though this page itself still issues no fetch of its own.
 */
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const SIGNED_OUT_SESSION = {
  j_signon: false,
  j_signon_username: null,
  original_url: null,
  role: null,
};
const EMPTY_CART = { items: [], count: 0, subtotal: 0 };

const fetchMock = vi.fn();

function renderWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/order-completed", state }]}>
      <OrderCompleted />
    </MemoryRouter>,
  );
}

describe("OrderCompleted (/order-completed)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/signon/session") return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the shared header carrying the store mark, a catalogue link and a cart link (AC-1)", async () => {
    renderWithState({ orderId: 1005, email: "user@example.com" });

    expect(screen.getByRole("link", { name: "My Pet Store" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/catalog");
    // Exact name, not /cart/i — this page's own breadcrumb also links to
    // /cart under the name "Shopping Cart".
    expect(screen.getByRole("link", { name: "Cart" })).toHaveAttribute("href", "/cart");
  });

  it("OC-01: composes the order id label and number into one accessible group naming the scenario's exact sentence", () => {
    renderWithState({ orderId: 1005, email: "user@example.com" });

    expect(screen.getByRole("group", { name: "Your order Id is 1005" })).toBeInTheDocument();
  });

  it("OC-02: shows the order id visually as its own larger element, not fused into the label text", () => {
    renderWithState({ orderId: 1005, email: "user@example.com" });

    expect(screen.getByText("Your order Id is")).toBeInTheDocument();
    expect(screen.getByText("1005")).toBeInTheDocument();
  });

  it("OC-03: a different order id renders correctly (not a hard-coded 1005)", () => {
    renderWithState({ orderId: 2042, email: "user@example.com" });

    expect(screen.getByRole("group", { name: "Your order Id is 2042" })).toBeInTheDocument();
  });

  it("OC-04: renders a Continue Shopping control that returns to the catalogue", () => {
    renderWithState({ orderId: 1005, email: "user@example.com" });

    expect(screen.getByRole("link", { name: "Continue Shopping" })).toHaveAttribute(
      "href",
      "/catalog",
    );
  });

  it("OC-05: renders without crashing and without an order id block when no navigation state is present", () => {
    renderWithState(undefined);

    expect(screen.queryByRole("group", { name: /Your order Id is/ })).not.toBeInTheDocument();
    expect(screen.getByText("Thank you, your order has been submitted.")).toBeInTheDocument();
  });

  it("OC-06: tells the shopper a confirmation e-mail is coming, interpolating the address the order was placed with", () => {
    renderWithState({ orderId: 1005, email: "priya.k@example.com" });

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            "You should receive a confirmation e-mail soon at priya.k@example.com.",
      ),
    ).toBeInTheDocument();
  });

  it("OC-07: a different email address is what gets interpolated, not a hard-coded one", () => {
    renderWithState({ orderId: 2042, email: "someone.else@example.org" });

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            "You should receive a confirmation e-mail soon at someone.else@example.org.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/priya\.k@example\.com/)).not.toBeInTheDocument();
  });

  it("OC-08: no confirmation e-mail message is shown when no navigation state is present", () => {
    renderWithState(undefined);

    expect(screen.queryByText(/confirmation e-mail/)).not.toBeInTheDocument();
  });
});
