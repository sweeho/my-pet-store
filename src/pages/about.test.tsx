import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import About from "./about";

/**
 * UI / PAGE TEST
 *
 * New for SWHM-T-0237: About had no test before this ticket moved it onto
 * the shared header, the design tokens and the shared content width.
 * Mirrors src/pages/catalog/index.test.tsx's fetch-mocking convention — the
 * shared header (StoreHeader) fetches /api/signon/session and /api/cart on
 * every mount, so every render needs them answered.
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

function renderPage() {
  return render(<About />, { wrapper: MemoryRouter });
}

describe("About page (/about)", () => {
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
    renderPage();

    expect(screen.getByRole("link", { name: "My Pet Store" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });

  it("renders the About heading and a link back home", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "About Page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Home/ })).toHaveAttribute("href", "/");
  });
});
