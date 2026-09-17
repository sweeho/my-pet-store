import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignOnWelcomeContent } from "./signon-welcome";

/**
 * UI / PAGE TEST
 *
 * New for SWHM-T-0237: signon-welcome had no test before this ticket moved
 * it onto the shared header and the shared content width. Renders the
 * unwrapped content component directly (no RequireSignOn gate), mirroring
 * src/pages/customer.test.tsx. This page's own /api/signon/session read and
 * the shared header's (StoreHeader) read are the same endpoint, so one
 * mocked response satisfies both.
 */
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const EMPTY_CART = { items: [], count: 0, subtotal: 0 };

const fetchMock = vi.fn();

function mockFetch(session: {
  j_signon: boolean;
  j_signon_username: string | null;
  original_url: string | null;
  role: string | null;
}) {
  fetchMock.mockImplementation((url: string) => {
    if (url === "/api/signon/session") return Promise.resolve(jsonResponse(session));
    if (url === "/api/cart") return Promise.resolve(jsonResponse(EMPTY_CART));
    throw new Error(`unexpected fetch: ${url}`);
  });
}

function renderPage() {
  return render(<SignOnWelcomeContent />, { wrapper: MemoryRouter });
}

describe("SignOnWelcomeContent (/signon-welcome)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the shared header carrying the store mark, a catalogue link and a cart link (AC-1)", async () => {
    mockFetch({ j_signon: true, j_signon_username: "jdoe", original_url: null, role: null });

    renderPage();

    expect(screen.getByRole("link", { name: "My Pet Store" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });

  it("welcomes the signed-on visitor by name once the session read resolves", async () => {
    mockFetch({ j_signon: true, j_signon_username: "jdoe", original_url: null, role: null });

    renderPage();

    expect(await screen.findByRole("heading", { name: "Welcome, jdoe" })).toBeInTheDocument();
  });
});
