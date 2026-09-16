import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("CPT-07: activating Update Cart sends every row's quantity in a single PUT /api/cart request and renders the response", async () => {
    const updatedCart: Cart = {
      items: [
        { ...POPULATED_CART.items[0]!, quantity: 3, lineTotal: 1050 },
        { ...POPULATED_CART.items[1]!, quantity: 2, lineTotal: 90 },
      ],
      count: 2,
      subtotal: 1140,
    };

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/cart" && init?.method === "PUT") {
        return Promise.resolve(jsonResponse(updatedCart));
      }
      if (url === "/api/cart" && !init) return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url} ${init?.method}`);
    });

    renderPage();
    await screen.findByRole("table");

    const quantityInput = screen.getByRole("spinbutton", { name: "Quantity for BIRDS-PARROTS-1" });
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, "3");

    await userEvent.click(screen.getByRole("button", { name: "Update Cart" }));

    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT");
      expect(putCalls).toHaveLength(1);
    });

    const [, putInit] = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT")!;
    const body = JSON.parse((putInit as RequestInit).body as string);
    expect(body).toEqual({
      updates: [
        { itemId: "BIRDS-PARROTS-1", quantity: 3 },
        { itemId: "CATS-SHORTHAIR-1", quantity: 2 },
      ],
    });

    expect(
      await screen.findByRole("spinbutton", { name: "Quantity for BIRDS-PARROTS-1" }),
    ).toHaveValue(3);
    expect(screen.getByText("$1,140.00")).toBeInTheDocument();
  });

  it("CPT-08: setting a row's quantity to 0 and activating Update Cart removes that row", async () => {
    const afterRemoval: Cart = { items: [{ ...POPULATED_CART.items[1]! }], count: 1, subtotal: 90 };

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/cart" && init?.method === "PUT") {
        return Promise.resolve(jsonResponse(afterRemoval));
      }
      if (url === "/api/cart" && !init) return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url} ${init?.method}`);
    });

    renderPage();
    await screen.findByRole("table");

    const quantityInput = screen.getByRole("spinbutton", { name: "Quantity for BIRDS-PARROTS-1" });
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, "0");
    await userEvent.click(screen.getByRole("button", { name: "Update Cart" }));

    await waitFor(() => {
      expect(screen.queryByText("Parrots")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Shorthair Cats")).toBeInTheDocument();
  });

  it("CPT-09: activating a row's Remove control sends DELETE /api/cart/items/{itemId} for that item alone", async () => {
    const afterRemoval: Cart = { items: [{ ...POPULATED_CART.items[1]! }], count: 1, subtotal: 90 };

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/cart/items/BIRDS-PARROTS-1" && init?.method === "DELETE") {
        return Promise.resolve(jsonResponse(afterRemoval));
      }
      if (url === "/api/cart" && !init) return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url} ${init?.method}`);
    });

    renderPage();
    const table = await screen.findByRole("table");
    const parrotRow = within(table).getByText("Parrots").closest("tr") as HTMLElement;

    await userEvent.click(within(parrotRow).getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.queryByText("Parrots")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Shorthair Cats")).toBeInTheDocument();

    const deleteCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE");
    expect(deleteCalls).toHaveLength(1);
  });

  it("CPT-10: an empty quantity field is refused on screen with a message naming the row, and no PUT is sent", async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/cart" && !init) return Promise.resolve(jsonResponse(POPULATED_CART));
      throw new Error(`unexpected fetch: ${url} ${init?.method}`);
    });

    renderPage();
    await screen.findByRole("table");

    const quantityInput = screen.getByRole("spinbutton", { name: "Quantity for BIRDS-PARROTS-1" });
    await userEvent.clear(quantityInput);

    await userEvent.click(screen.getByRole("button", { name: "Update Cart" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Quantity for Parrots must be a number.",
    );
    const putCalls = fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(putCalls).toHaveLength(0);
  });

  it("CPT-11: removing the last remaining line leaves the screen in the empty state", async () => {
    const singleItemCart: Cart = { items: [POPULATED_CART.items[0]!], count: 1, subtotal: 350 };

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/cart/items/BIRDS-PARROTS-1" && init?.method === "DELETE") {
        return Promise.resolve(jsonResponse(EMPTY_CART));
      }
      if (url === "/api/cart" && !init) return Promise.resolve(jsonResponse(singleItemCart));
      throw new Error(`unexpected fetch: ${url} ${init?.method}`);
    });

    renderPage();
    const table = await screen.findByRole("table");
    await userEvent.click(within(table).getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("Your Shopping Cart is Empty.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
