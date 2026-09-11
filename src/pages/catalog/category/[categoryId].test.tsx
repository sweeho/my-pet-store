import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Category, Page, Product } from "../../../../catalog/types";
import CategoryPage from "./[categoryId]";

function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const CATEGORY: Category = { id: "BIRDS", name: "Birds", description: "Feathered pets" };
const PRODUCTS_PAGE: Page<Product> = {
  objects: [
    { id: "BIRDS-PARROTS", categoryId: "BIRDS", name: "Parrots", description: "..." },
    { id: "BIRDS-FINCHES", categoryId: "BIRDS", name: "Finches", description: "..." },
  ],
  start: 0,
  hasNext: false,
};

const fetchMock = vi.fn();

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/catalog/category/:categoryId" element={<CategoryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CategoryPage (/catalog/category/:categoryId)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PT-01: shows the category's products, each linking to its items", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/categories/BIRDS"))
        return Promise.resolve(jsonResponse(CATEGORY));
      if (url.startsWith("/api/catalog/products"))
        return Promise.resolve(jsonResponse(PRODUCTS_PAGE));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/category/BIRDS");

    expect(await screen.findByRole("heading", { name: "Birds" })).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(within(list).getByRole("link", { name: "Parrots" })).toHaveAttribute(
      "href",
      "/catalog/product/BIRDS-PARROTS",
    );
    expect(within(list).getByRole("link", { name: "Finches" })).toHaveAttribute(
      "href",
      "/catalog/product/BIRDS-FINCHES",
    );
  });

  it("PT-02: an unknown category id shows a not-found state", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/categories/")) {
        return Promise.resolve(jsonResponse({ error: "not found" }, { ok: false, status: 404 }));
      }
      if (url.startsWith("/api/catalog/products")) {
        return Promise.resolve(jsonResponse({ objects: [], start: 0, hasNext: false }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/category/NOPE");

    expect(await screen.findByRole("heading", { name: "Not Found" })).toBeInTheDocument();
  });
});
