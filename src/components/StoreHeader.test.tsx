import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_CONTENT_WIDTH, CONTENT_WIDTH } from "./layout";
import { StoreHeader } from "./StoreHeader";

/**
 * UI / COMPONENT TEST
 *
 * Same fetch/useNavigate mocking convention as src/pages/admin/index.test.tsx.
 * The header issues two fetches on mount (session, cart), so the mock keys its
 * response off the requested URL rather than call order.
 */

type SessionFixture = {
  j_signon: boolean;
  j_signon_username: string | null;
  original_url?: string | null;
  role: string | null;
};

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const PENDING = new Promise(() => {});

const SIGNED_OUT: SessionFixture = {
  j_signon: false,
  j_signon_username: null,
  original_url: null,
  role: null,
};

function signedOn(username: string, role: string | null): SessionFixture {
  return { j_signon: true, j_signon_username: username, original_url: null, role };
}

const fetchMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function mockFetch(session: SessionFixture | Promise<unknown>, cartCount = 0) {
  fetchMock.mockImplementation((url: string) => {
    if (url === "/api/signon/session") {
      return session instanceof Promise ? session : Promise.resolve(jsonResponse(session));
    }
    if (url === "/api/cart") {
      return Promise.resolve(jsonResponse({ items: [], count: cartCount, subtotal: 0 }));
    }
    if (url === "/api/signon/logout") {
      return Promise.resolve(jsonResponse({ signedOut: true }));
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
}

function renderHeader(ui: React.ReactElement) {
  return render(ui, { wrapper: MemoryRouter });
}

describe("StoreHeader", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("AC-1: renders the store mark, a catalogue link and a cart link", async () => {
    mockFetch(SIGNED_OUT, 0);

    renderHeader(<StoreHeader />);

    expect(screen.getByRole("link", { name: "My Pet Store" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
    await screen.findByRole("link", { name: "Sign in" });
  });

  it("AC-2: shows the cart's line count when it holds two lines", async () => {
    mockFetch(SIGNED_OUT, 2);

    renderHeader(<StoreHeader />);

    const cartLink = await screen.findByRole("link", { name: /cart/i });
    expect(within(cartLink).getByText("2")).toBeInTheDocument();
  });

  it("AC-3: shows no number for an empty cart", async () => {
    mockFetch(SIGNED_OUT, 0);

    renderHeader(<StoreHeader />);

    await screen.findByRole("link", { name: "Sign in" });
    const cartLink = screen.getByRole("link", { name: /cart/i });
    expect(within(cartLink).queryByText(/\d/)).not.toBeInTheDocument();
  });

  it("AC-4: renders a screen's trailing control after the spacer, ahead of the identity controls", async () => {
    mockFetch(SIGNED_OUT, 0);

    renderHeader(
      <StoreHeader>
        <span data-testid="lang-switcher">Language</span>
      </StoreHeader>,
    );

    const slot = screen.getByTestId("lang-switcher");
    const signIn = await screen.findByRole("link", { name: "Sign in" });
    expect(slot.compareDocumentPosition(signIn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("AC-5: claims nothing while the session read is in flight, and is not a live region", () => {
    mockFetch(PENDING, 0);

    renderHeader(<StoreHeader />);

    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("AC-6: a signed-out visitor is offered sign-in only", async () => {
    mockFetch(SIGNED_OUT, 0);

    renderHeader(<StoreHeader />);

    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signon");
    expect(screen.queryByRole("link", { name: "My account" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("AC-7: a signed-on visitor is named, with a link to their account and a sign-out control", async () => {
    mockFetch(signedOn("alice", null), 0);

    renderHeader(<StoreHeader />);

    expect(await screen.findByText("alice")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My account" })).toHaveAttribute("href", "/customer");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("AC-8: signing out ends the session and returns home", async () => {
    const user = userEvent.setup();
    mockFetch(signedOn("alice", null), 0);

    renderHeader(<StoreHeader />);
    await screen.findByText("alice");

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/signon/logout", { method: "POST" });
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });

  it("AC-9: an administrator is offered a link to /admin, ahead of the username", async () => {
    mockFetch(signedOn("admin1", "administrator"), 0);

    renderHeader(<StoreHeader />);

    const adminLink = await screen.findByRole("link", { name: "Admin" });
    expect(adminLink).toHaveAttribute("href", "/admin");
    const who = screen.getByText(/signed in as/i);
    expect(adminLink.compareDocumentPosition(who) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("AC-10: a shopper holding no administrator role is offered no /admin link", async () => {
    mockFetch(signedOn("alice", null), 0);

    renderHeader(<StoreHeader />);

    await screen.findByText("alice");
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("AC-11: the administration variant keeps its context, the username, a catalogue link, a cart link and sign-out", async () => {
    mockFetch(signedOn("admin1", "administrator"), 2);

    renderHeader(<StoreHeader variant="admin" />);

    expect(screen.getByText("· Administration")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("href", "/catalog");
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart");
    expect(await screen.findByText("admin1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("AC-12: the administration variant offers no administration link and no account link", async () => {
    mockFetch(signedOn("admin1", "administrator"), 0);

    renderHeader(<StoreHeader variant="admin" />);

    await screen.findByText("admin1");
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My account" })).not.toBeInTheDocument();
  });

  it("AC-17: the store variant's inner container takes the shared store content width", async () => {
    mockFetch(SIGNED_OUT, 0);

    const { container } = renderHeader(<StoreHeader />);

    await screen.findByRole("link", { name: "Sign in" });
    expect(container.querySelector("header > div")?.className).toContain(CONTENT_WIDTH);
  });

  it("AC-17: the administration variant's inner container takes the shared administration content width", async () => {
    mockFetch(signedOn("admin1", "administrator"), 0);

    const { container } = renderHeader(<StoreHeader variant="admin" />);

    await screen.findByText("admin1");
    expect(container.querySelector("header > div")?.className).toContain(ADMIN_CONTENT_WIDTH);
  });
});
