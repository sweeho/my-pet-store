import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./index";

/**
 * UI / PAGE TEST
 *
 * The bespoke header and its @headlessui/react mobile-nav Dialog are gone
 * (design.md F10, SWHM-T-0237): the shared header (StoreHeader) now renders
 * on every screen, home included, so this page's own tests cover the hero
 * content and defer the header's own behaviour to
 * src/components/StoreHeader.test.tsx. StoreHeader fetches
 * /api/signon/session and /api/cart on mount, so fetch is stubbed here too.
 *
 * Wrapped in a MemoryRouter because the page renders react-router `Link`s
 * for every in-app destination (src/pages/signon.test.tsx does the same for
 * the same reason).
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
  return render(<Home />, { wrapper: MemoryRouter });
}

describe("Home page", () => {
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
    expect(screen.getByRole("link", { name: "Cart" })).toHaveAttribute("href", "/cart");
  });

  it("renders the hero heading and primary CTA that opens the catalogue", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "My Pet Store" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/catalog");
  });

  it("lists the store highlights", () => {
    renderPage();

    for (const highlight of ["Free shipping", "Vet-approved", "Curated brands", "Local pickup"]) {
      expect(screen.getByText(highlight)).toBeInTheDocument();
    }
  });

  it("points the header's sign-in control at the sign-on screen", async () => {
    renderPage();

    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signon");
  });

  it("requests no third-party asset and renders a store-branded mark instead of the template logo", async () => {
    const { container } = renderPage();

    const headerLogoLink = screen.getByRole("link", { name: "My Pet Store" });
    expect(within(headerLogoLink).queryByRole("img")).not.toBeInTheDocument();
    expect(headerLogoLink.querySelector("svg")).toBeInTheDocument();

    for (const element of container.querySelectorAll<HTMLImageElement | HTMLAnchorElement>(
      "[src], [href]",
    )) {
      const value = element.getAttribute("src") ?? element.getAttribute("href") ?? "";
      expect(value).not.toContain("tailwindcss.com");
      if (value) {
        expect(value.startsWith("http://") || value.startsWith("https://")).toBe(false);
      }
    }
  });

  it("leaves no navigation or hero link as a placeholder fragment", async () => {
    renderPage();
    await screen.findByRole("link", { name: "Sign in" });

    // The brand logo link (accessible name "My Pet Store") is out of scope
    // for this ticket — only nav and hero controls are checked.
    const logoLinks = screen.getAllByRole("link", { name: "My Pet Store" });
    for (const link of screen.getAllByRole("link")) {
      if (logoLinks.includes(link)) continue;
      expect(link).not.toHaveAttribute("href", "#");
    }
  });
});
