import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Category, Item, Page } from "../../../catalog/types";
import CatalogHome from "./index";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/customer.test.tsx: mock fetch, render the page inside a
 * MemoryRouter (this page calls useSearchParams and renders Links).
 */
function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const CATEGORIES_PAGE: Page<Category> = {
  objects: [
    { id: "BIRDS", name: "Birds", description: "Feathered pets" },
    { id: "CATS", name: "Cats", description: "Feline companions" },
  ],
  start: 0,
  hasNext: false,
};

const fetchMock = vi.fn();

function mockFetch(url: string) {
  if (url.startsWith("/api/customer")) {
    return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
  }
  if (url.startsWith("/api/catalog/categories")) {
    return Promise.resolve(jsonResponse(CATEGORIES_PAGE));
  }
  if (url.startsWith("/api/catalog/search")) {
    const searchPage: Page<Item> = {
      objects: [
        {
          itemId: "BIRDS-PARROTS-1",
          category: "BIRDS",
          productId: "BIRDS-PARROTS",
          productName: "Parrots",
          description: "A large, intelligent parrot",
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
    return Promise.resolve(jsonResponse(searchPage));
  }
  throw new Error(`unexpected fetch: ${url}`);
}

describe("CatalogHome (/catalog)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(mockFetch);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PT-01: lists the categories, each linking to its products", async () => {
    render(<CatalogHome />, { wrapper: MemoryRouter });

    const list = await screen.findByRole("region", { name: "Categories" });
    expect(within(list).getByRole("link", { name: "Birds" })).toHaveAttribute(
      "href",
      "/catalog/category/BIRDS",
    );
    expect(within(list).getByRole("link", { name: "Cats" })).toHaveAttribute(
      "href",
      "/catalog/category/CATS",
    );
  });

  it("PT-02: submitting the search box shows matching items with the query in the URL", async () => {
    const user = userEvent.setup();
    render(<CatalogHome />, { wrapper: MemoryRouter });

    await screen.findByRole("region", { name: "Categories" });
    await user.type(screen.getByRole("searchbox", { name: "Search query" }), "african");
    await user.click(screen.getByRole("button", { name: "Search" }));

    const results = await screen.findByRole("region", { name: 'Search results for "african"' });
    expect(
      within(results).getByRole("link", { name: "A large, intelligent parrot" }),
    ).toHaveAttribute("href", "/catalog/item/BIRDS-PARROTS-1");
  });

  it("PT-03: previous is disabled on the first page and next is disabled with hasNext=false", async () => {
    render(<CatalogHome />, { wrapper: MemoryRouter });

    await screen.findByRole("region", { name: "Categories" });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("PT-04: the language control renders while the first fetch is still in flight, and a pending region names what is loading", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      return new Promise(() => {});
    });

    render(<CatalogHome />, {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={["/catalog?locale=ja_JP"]}>{children}</MemoryRouter>
      ),
    });

    expect(await screen.findByRole("button", { name: /日本語/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading categories…");
  });

  it("PT-05: sets document.documentElement.lang to the active locale", async () => {
    render(<CatalogHome />, {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={["/catalog?locale=ja_JP"]}>{children}</MemoryRouter>
      ),
    });

    await screen.findByRole("region", { name: "Categories" });
    expect(document.documentElement.lang).toBe("ja_JP");
  });
});
