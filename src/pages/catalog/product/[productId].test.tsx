import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Item, Page, Product } from "../../../../catalog/types";
import ProductPage from "./[productId]";

function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

// The shared header (StoreHeader) fetches these two on every mount, so
// every fetch mock in this file has to answer them.
const SIGNED_OUT_SESSION = {
  j_signon: false,
  j_signon_username: null,
  original_url: null,
  role: null,
};
const EMPTY_HEADER_CART = { items: [], count: 0, subtotal: 0 };

const PRODUCT: Product = {
  id: "BIRDS-PARROTS",
  categoryId: "BIRDS",
  name: "Parrots",
  description: "...",
};
const PRODUCT_ZH: Product = {
  id: "BIRDS-PARROTS",
  categoryId: "BIRDS",
  name: "鹦鹉",
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
const EMPTY_PAGE: Page<Item> = { objects: [], start: 0, hasNext: false };

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

  it("renders the shared header carrying the store mark, a catalogue link and a cart link (AC-1)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/signon/session") return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_HEADER_CART));
      return new Promise(() => {});
    });

    renderAt("/catalog/product/BIRDS-PARROTS");

    expect(screen.getByRole("link", { name: "My Pet Store" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });

  it("PT-01: shows the product's items, each linking to its detail", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/products/BIRDS-PARROTS")) {
        return Promise.resolve(jsonResponse(PRODUCT));
      }
      if (url.startsWith("/api/catalog/items")) return Promise.resolve(jsonResponse(ITEMS_PAGE));
      if (url === "/api/signon/session") {
        return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      }
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_HEADER_CART));
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
      if (url === "/api/signon/session") {
        return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      }
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_HEADER_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/product/NOPE");

    expect(await screen.findByRole("heading", { name: "Not Found" })).toBeInTheDocument();
  });

  it("PT-03: the language control renders while the first fetch is still in flight, and a pending region names what is loading", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      return new Promise(() => {});
    });

    renderAt("/catalog/product/BIRDS-PARROTS?locale=ja_JP");

    expect(await screen.findByRole("button", { name: /日本語/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading product…");
  });

  it("PT-02b: reason missing-translation shows the unavailable-in-language state, naming the product, not the not-found screen (SWHM-T-0098)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/products/BIRDS-PARROTS")) {
        return Promise.resolve(
          jsonResponse(
            { error: "Product not found: BIRDS-PARROTS", reason: "missing-translation" },
            { ok: false, status: 404 },
          ),
        );
      }
      if (url.startsWith("/api/catalog/items")) return Promise.resolve(jsonResponse(EMPTY_PAGE));
      if (url === "/api/signon/session") {
        return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      }
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_HEADER_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/product/BIRDS-PARROTS?locale=zh_CN");

    expect(
      await screen.findByRole("heading", { name: "Not available in 中文 yet" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Not Found" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "This product has nothing translated into 中文. Nothing has gone wrong — it exists, but not in this language.",
      ),
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "View in English (US)" }));

    expect(document.documentElement.lang).toBe("en_US");
  });

  it("PT-04: an empty item list under a non-English locale shows the unavailable-in-language state", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/products/BIRDS-PARROTS")) {
        return Promise.resolve(jsonResponse(PRODUCT_ZH));
      }
      if (url.startsWith("/api/catalog/items")) return Promise.resolve(jsonResponse(EMPTY_PAGE));
      if (url === "/api/signon/session") {
        return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      }
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_HEADER_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/product/BIRDS-PARROTS?locale=zh_CN");

    expect(await screen.findByRole("heading", { name: "鹦鹉" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No items in 中文 yet" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "View in English (US)" }));

    expect(document.documentElement.lang).toBe("en_US");
  });

  it("PT-05: under en_US, an empty item list stays an empty list, not the unavailable-in-language state", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/products/BIRDS-PARROTS")) {
        return Promise.resolve(jsonResponse(PRODUCT));
      }
      if (url.startsWith("/api/catalog/items")) return Promise.resolve(jsonResponse(EMPTY_PAGE));
      if (url === "/api/signon/session") {
        return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      }
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_HEADER_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/product/BIRDS-PARROTS");

    expect(await screen.findByRole("heading", { name: "Parrots" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryByText(/No items in/)).not.toBeInTheDocument();
  });

  it("PT-06: sets document.documentElement.lang to the active locale", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/products/BIRDS-PARROTS")) {
        return Promise.resolve(
          jsonResponse({
            id: "BIRDS-PARROTS",
            categoryId: "BIRDS",
            name: "オウム",
            description: "",
          }),
        );
      }
      if (url.startsWith("/api/catalog/items")) return Promise.resolve(jsonResponse(ITEMS_PAGE));
      if (url === "/api/signon/session") {
        return Promise.resolve(jsonResponse(SIGNED_OUT_SESSION));
      }
      if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_HEADER_CART));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/product/BIRDS-PARROTS?locale=ja_JP");

    await screen.findByRole("heading", { name: "オウム" });
    expect(document.documentElement.lang).toBe("ja_JP");
  });
});
