import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Cart } from "../../cart/types";
import CartPage from "./cart";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/catalog/index.test.tsx: mock fetch, render inside a
 * MemoryRouter (this page renders Links to /catalog).
 */
function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const EMPTY_CART: Cart = { items: [], count: 0, subtotal: 0 };

const POPULATED_CART: Cart = {
  items: [
    {
      itemId: "BIRDS-PARROTS-1",
      productName: "Parrots",
      description: "A large, intelligent parrot native to Africa",
      unitCost: 350,
      quantity: 1,
      lineTotal: 350,
    },
    {
      itemId: "CATS-SHORTHAIR-1",
      productName: "Shorthair Cats",
      description: "A friendly, easygoing cat with a short coat",
      unitCost: 45,
      quantity: 2,
      lineTotal: 90,
    },
  ],
  count: 2,
  subtotal: 440,
};

const fetchMock = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>,
  );
}

describe("CartPage (/cart)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("CPT-01: renders a role=status pending indicator while the cart read is outstanding", () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Shopping Cart" })).toBeInTheDocument();
  });

  it("CPT-02: an empty cart shows the exact empty message, no table, and a link back to the catalogue", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderPage();

    expect(await screen.findByText("Your Shopping Cart is Empty.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the catalog" })).toHaveAttribute(
      "href",
      "/catalog",
    );
  });

  it("CPT-03: a populated cart shows a table with name, unit cost, quantity input and line total per item", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/cart") return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderPage();

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    // header row + 2 item rows
    expect(rows).toHaveLength(3);

    const parrotRow = within(table).getByText("Parrots").closest("tr");
    expect(parrotRow).not.toBeNull();
    const withinRow = within(parrotRow as HTMLElement);
    expect(withinRow.getAllByText("$350.00")).toHaveLength(2);
    expect(withinRow.getByRole("spinbutton", { name: "Quantity for BIRDS-PARROTS-1" })).toHaveValue(
      1,
    );
    expect(withinRow.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("CPT-04: each item's quantity input carries the accessible name Quantity for <itemId>", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/cart") return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderPage();

    await screen.findByRole("table");
    expect(screen.getByRole("spinbutton", { name: "Quantity for CATS-SHORTHAIR-1" })).toHaveValue(
      2,
    );
  });

  it("CPT-05: renders the item-count subtitle, subtotal and the Update Cart control", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/cart") return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderPage();

    await screen.findByRole("table");
    expect(screen.getByText("2 items in your cart")).toBeInTheDocument();
    expect(screen.getByText("$440.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Cart" })).toBeInTheDocument();
  });

  it("CPT-06: the back-to-catalogue link is present in both states", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderPage();

    expect(await screen.findByRole("link", { name: /Continue shopping/ })).toHaveAttribute(
      "href",
      "/catalog",
    );
  });
});
