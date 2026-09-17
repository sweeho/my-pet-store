import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import UserCreationError from "./user-creation-error";

/**
 * UI / PAGE TEST
 *
 * New for SWHM-T-0237: user-creation-error had no test before this ticket
 * moved it onto the shared header and the shared content width. The shared
 * header (StoreHeader) fetches /api/signon/session and /api/cart on every
 * mount, so every render needs them answered (A2: this screen is reachable
 * by a signed-out visitor, so the header renders its signed-out state).
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

function renderWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/user-creation-error", state }]}>
      <UserCreationError />
    </MemoryRouter>,
  );
}

describe("UserCreationError (/user-creation-error)", () => {
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
    renderWithState({ error: "Username already taken." });

    expect(screen.getByRole("link", { name: "My Pet Store" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
  });

  it("shows the error carried in navigation state", () => {
    renderWithState({ error: "Username already taken." });

    expect(screen.getByText("Username already taken.")).toBeInTheDocument();
  });

  it("falls back to a generic message when no error is carried in navigation state", () => {
    renderWithState(undefined);

    expect(screen.getByText("Account creation failed.")).toBeInTheDocument();
  });

  it("renders a link back to sign-on", () => {
    renderWithState(undefined);

    expect(screen.getByRole("link", { name: /Back to sign in/ })).toHaveAttribute(
      "href",
      "/signon",
    );
  });
});
