import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

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
 * page issues no fetch to read an order back. design.md § Spec discrepancies
 * S13: the mockup renders "Your order Id is" as a label above the number as
 * a separate, larger element, so the two are composed into one accessible
 * name on the wrapping group rather than asserted as one text node.
 */
function renderWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/order-completed", state }]}>
      <OrderCompleted />
    </MemoryRouter>,
  );
}

describe("OrderCompleted (/order-completed)", () => {
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
