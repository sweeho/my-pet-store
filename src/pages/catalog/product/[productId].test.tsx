import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Item, Page, Product } from "../../../../catalog/types";
import ProductPage from "./[productId]";

function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const PRODUCT: Product = {
  id: "BIRDS-PARROTS",
  categoryId: "BIRDS",
  name: "Parrots",
  description: "...",
};
const ITEMS_PAGE: Page<Item> = {
  objects: [
    {
      itemId: "BIRDS-PARROTS-1",
      category: "BIRDS",
      productId: "BIRDS-PARROTS",
      productName: "Parrots",
      description: "A large, intelligent parrot native to Africa",
      imageLocation: "/images/birds/african-grey.jpg",
      attribute1: "Grey",
      attribute2: "Large",
      attribute3: null,
      attribute4: null,
      attribute5: null,
      listPrice: 599.99,
      unitCost: 350,
    },
  ],
  start: 0,
  hasNext: false,
};

const fetchMock = vi.fn();

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/catalog/product/:productId" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProductPage (/catalog/product/:productId)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PT-01: shows the product's items, each linking to its detail", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/products/BIRDS-PARROTS")) {
        return Promise.resolve(jsonResponse(PRODUCT));
      }
      if (url.startsWith("/api/catalog/items")) return Promise.resolve(jsonResponse(ITEMS_PAGE));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/product/BIRDS-PARROTS");

    expect(await screen.findByRole("heading", { name: "Parrots" })).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(
      within(list).getByRole("link", { name: "A large, intelligent parrot native to Africa" }),
    ).toHaveAttribute("href", "/catalog/item/BIRDS-PARROTS-1");
  });

  it("PT-02: an unknown product id shows a not-found state", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/products/")) {
        return Promise.resolve(jsonResponse({ error: "not found" }, { ok: false, status: 404 }));
      }
      if (url.startsWith("/api/catalog/items")) {
        return Promise.resolve(jsonResponse({ objects: [], start: 0, hasNext: false }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/product/NOPE");

    expect(await screen.findByRole("heading", { name: "Not Found" })).toBeInTheDocument();
  });
});
