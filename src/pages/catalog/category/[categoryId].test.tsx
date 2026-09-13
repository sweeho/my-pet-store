import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Category, Page, Product } from "../../../../catalog/types";
import CategoryPage from "./[categoryId]";

function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const CATEGORY: Category = { id: "BIRDS", name: "Birds", description: "Feathered pets" };
const CATEGORY_ZH: Category = { id: "BIRDS", name: "鸟", description: "鸟是很棒的宠物" };
const PRODUCTS_PAGE: Page<Product> = {
  objects: [
    { id: "BIRDS-PARROTS", categoryId: "BIRDS", name: "Parrots", description: "..." },
    { id: "BIRDS-FINCHES", categoryId: "BIRDS", name: "Finches", description: "..." },
  ],
  start: 0,
  hasNext: false,
};
const EMPTY_PAGE: Page<Product> = { objects: [], start: 0, hasNext: false };

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

  it("PT-03: the language control renders while the first fetch is still in flight, and a pending region names what is loading", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      // categories/products never resolve in this test — only locale
      // resolution (via the URL param) needs to settle synchronously.
      return new Promise(() => {});
    });

    renderAt("/catalog/category/BIRDS?locale=ja_JP");

    expect(await screen.findByRole("button", { name: /日本語/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading category…");
  });

  it("PT-04: an empty product list under a non-English locale shows the unavailable-in-language state, naming the language and offering to view in English (US)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/categories/BIRDS"))
        return Promise.resolve(jsonResponse(CATEGORY_ZH));
      if (url.startsWith("/api/catalog/products")) return Promise.resolve(jsonResponse(EMPTY_PAGE));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/category/BIRDS?locale=zh_CN");

    // The category's own name/description still renders in zh_CN — only the
    // product list is empty (Gotchas — category_details does carry zh_CN).
    expect(await screen.findByRole("heading", { name: "鸟" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No products in 中文 yet" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "View in English (US)" }));

    expect(document.documentElement.lang).toBe("en_US");
  });

  it("PT-05: under en_US, an empty product list stays an empty list, not the unavailable-in-language state", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/categories/BIRDS"))
        return Promise.resolve(jsonResponse(CATEGORY));
      if (url.startsWith("/api/catalog/products")) return Promise.resolve(jsonResponse(EMPTY_PAGE));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/category/BIRDS");

    expect(await screen.findByRole("heading", { name: "Birds" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryByText(/No products in/)).not.toBeInTheDocument();
  });

  it("PT-06: sets document.documentElement.lang to the active locale", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/categories/BIRDS"))
        return Promise.resolve(jsonResponse({ id: "BIRDS", name: "鳥", description: "鳥です" }));
      if (url.startsWith("/api/catalog/products"))
        return Promise.resolve(jsonResponse(PRODUCTS_PAGE));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/category/BIRDS?locale=ja_JP");

    await screen.findByRole("heading", { name: "鳥" });
    expect(document.documentElement.lang).toBe("ja_JP");
  });
});
