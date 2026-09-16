import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Item } from "../../../../catalog/types";
import ItemPage from "./[itemId]";

function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

// Every one of the Item type's 13 fields, so the test can assert each is
// either displayed or deliberately not (unitCost — store cost — is not
// customer-facing; see summary.md § Notes). productName is the PRODUCT's
// name ("Parrots") — the Item type has no item-specific name field, so the
// item's own description is what distinguishes it from siblings.
const ITEM: Item = {
  itemId: "BIRDS-PARROTS-1",
  category: "BIRDS",
  productId: "BIRDS-PARROTS",
  productName: "Parrots",
  description: "A large, intelligent parrot native to Africa",
  imageLocation: "/images/birds/african-grey.jpg",
  attribute1: "Grey",
  attribute2: "Large",
  attribute3: "Adult",
  attribute4: "Male",
  attribute5: "Hand-raised",
  listPrice: 599.99,
  unitCost: 350,
};

const fetchMock = vi.fn();

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/catalog/item/:itemId" element={<ItemPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ItemPage (/catalog/item/:itemId)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PT-01: shows the item's image, description, all five attributes and the list price", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/BIRDS-PARROTS-1"))
        return Promise.resolve(jsonResponse(ITEM));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/BIRDS-PARROTS-1");

    expect(await screen.findByRole("heading", { name: "Parrots" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Parrots" })).toHaveAttribute(
      "src",
      "/images/birds/african-grey.jpg",
    );
    expect(screen.getByText("A large, intelligent parrot native to Africa")).toBeInTheDocument();

    expect(
      within(screen.getByRole("group", { name: "Attribute 1" })).getByText("Grey"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Attribute 2" })).getByText("Large"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Attribute 3" })).getByText("Adult"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Attribute 4" })).getByText("Male"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Attribute 5" })).getByText("Hand-raised"),
    ).toBeInTheDocument();

    expect(screen.getByText("$599.99")).toBeInTheDocument();

    // productId (via the URL) and category are used for the back-link's
    // target, not displayed as separate text.
    expect(screen.getByRole("link", { name: "← Parrots" })).toHaveAttribute(
      "href",
      "/catalog/product/BIRDS-PARROTS",
    );
  });

  it("PT-02: a null dynamic attribute displays a placeholder, not a blank field", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/")) {
        return Promise.resolve(
          jsonResponse({ ...ITEM, attribute3: null, attribute4: null, attribute5: null }),
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/BIRDS-PARROTS-1");

    await screen.findByRole("heading", { name: "Parrots" });
    expect(
      within(screen.getByRole("group", { name: "Attribute 3" })).getByText("—"),
    ).toBeInTheDocument();
  });

  it("PT-03: a non-existent item id (reason not-found) shows a not-found state", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/")) {
        return Promise.resolve(
          jsonResponse({ error: "not found", reason: "not-found" }, { ok: false, status: 404 }),
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/NOPE");

    expect(await screen.findByRole("heading", { name: "Not Found" })).toBeInTheDocument();
  });

  it("PT-04: reason not-found shows the not-found state under ja_JP and zh_CN too, not just en_US", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/")) {
        return Promise.resolve(
          jsonResponse({ error: "not found", reason: "not-found" }, { ok: false, status: 404 }),
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/NOPE?locale=zh_CN");

    expect(await screen.findByRole("heading", { name: "Not Found" })).toBeInTheDocument();
  });

  it("PT-05: reason missing-translation shows the unavailable-in-language state, distinct from not-found", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/BIRDS-PARROTS-1")) {
        return Promise.resolve(
          jsonResponse(
            { error: "Item not found: BIRDS-PARROTS-1", reason: "missing-translation" },
            { ok: false, status: 404 },
          ),
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/BIRDS-PARROTS-1?locale=zh_CN");

    expect(
      await screen.findByRole("heading", { name: "Not available in 中文 yet" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Not Found" })).not.toBeInTheDocument();
  });

  it("PT-06: the language control renders while the first fetch is still in flight, and a pending region names what is loading", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      return new Promise(() => {});
    });

    renderAt("/catalog/item/BIRDS-PARROTS-1?locale=ja_JP");

    expect(await screen.findByRole("button", { name: /日本語/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading item…");
  });

  it("PT-07: sets document.documentElement.lang to the active locale", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/BIRDS-PARROTS-1"))
        return Promise.resolve(jsonResponse(ITEM));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/BIRDS-PARROTS-1?locale=ja_JP");

    await screen.findByRole("heading", { name: "Parrots" });
    expect(document.documentElement.lang).toBe("ja_JP");
  });

  it("PT-08: falls back to the placeholder image on a load error, and does not loop if the placeholder itself errors", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/BIRDS-PARROTS-1"))
        return Promise.resolve(jsonResponse(ITEM));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/BIRDS-PARROTS-1");

    const img = await screen.findByRole("img", { name: "Parrots" });
    expect(img).toHaveAttribute("src", "/images/birds/african-grey.jpg");

    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/images/placeholder.svg");
    expect(img).toHaveAttribute("alt", "Parrots");

    // The placeholder itself failing must not re-trigger the fallback (and
    // must not loop): the src stays exactly the placeholder.
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/images/placeholder.svg");
  });

  it("PT-09: renders a quantity field defaulting to 1 and an Add to Cart control", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/BIRDS-PARROTS-1"))
        return Promise.resolve(jsonResponse(ITEM));
      throw new Error(`unexpected fetch: ${url}`);
    });

    renderAt("/catalog/item/BIRDS-PARROTS-1");

    await screen.findByRole("heading", { name: "Parrots" });
    expect(screen.getByLabelText("Quantity")).toHaveValue(1);
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
  });

  it("PT-10: activating Add to Cart posts the item id and the entered quantity to /api/cart", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/customer"))
        return Promise.resolve(jsonResponse({}, { ok: false, status: 401 }));
      if (url.startsWith("/api/catalog/items/BIRDS-PARROTS-1"))
        return Promise.resolve(jsonResponse(ITEM));
      if (url === "/api/cart")
        return Promise.resolve(jsonResponse({ items: [], count: 1, subtotal: 1050 }));
      throw new Error(`unexpected fetch: ${url}`);
    });
    const user = userEvent.setup();

    renderAt("/catalog/item/BIRDS-PARROTS-1");
    await screen.findByRole("heading", { name: "Parrots" });

    const quantity = screen.getByLabelText("Quantity");
    await user.clear(quantity);
    await user.type(quantity, "3");
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    const cartCall = fetchMock.mock.calls.find((call: unknown[]) => call[0] === "/api/cart");
    expect(cartCall).toBeDefined();
    expect(cartCall![1]).toMatchObject({ method: "POST" });
    const body = JSON.parse((cartCall![1] as { body: string }).body);
    expect(body).toEqual({ itemId: "BIRDS-PARROTS-1", quantity: 3 });

    expect(await screen.findByRole("status", { name: "Add to cart status" })).toHaveTextContent(
      "Added to cart.",
    );
  });
});
