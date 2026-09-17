import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CatchAll from "./[...all]";

/**
 * UI / PAGE TEST
 *
 * Wrapped in a MemoryRouter and with fetch stubbed because this re-exports
 * NotFound, which now renders the shared header (StoreHeader, SWHM-T-0237):
 * it fetches /api/signon/session and /api/cart on mount and renders
 * react-router Links.
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

describe("Catch-all route", () => {
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

  it("renders the not-found page for any unmatched URL", () => {
    render(<CatchAll />, { wrapper: MemoryRouter });

    expect(screen.getByRole("heading", { level: 1, name: "Not Found" })).toBeInTheDocument();
  });
});
