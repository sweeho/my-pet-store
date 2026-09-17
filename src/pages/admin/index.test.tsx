import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminHomeContent } from "./index";

/**
 * UI / PAGE TEST
 *
 * Renders the unwrapped content component directly, as customer.test.tsx and
 * signon-welcome.tsx's own pattern do — RequireAdmin's own gating states are
 * already covered by RequireAdmin.test.tsx, and the header's own identity
 * behaviour by StoreHeader.test.tsx. This page also calls useNavigate(), so
 * react-router's hook is mocked the way src/pages/admin/signon.test.tsx does
 * it.
 *
 * AdminShell now mounts StoreHeader, which fetches the session and the cart
 * on mount (SWHM-T-0238) — the mock answers both so that mount never throws.
 */
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
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

function mockFetch() {
  fetchMock.mockImplementation((url: string) => {
    if (url === "/api/signon/session") {
      return Promise.resolve(
        jsonResponse({
          j_signon: true,
          j_signon_username: "jps_admin",
          original_url: null,
          role: "administrator",
        }),
      );
    }
    if (url === "/api/cart") {
      return Promise.resolve(jsonResponse({ items: [], count: 0, subtotal: 0 }));
    }
    if (url === "/api/signon/logout") {
      return Promise.resolve(jsonResponse({}));
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe("AdminHomeContent", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    mockFetch();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the title, description and all three actions", () => {
    render(<AdminHomeContent />, { wrapper: MemoryRouter });

    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
    expect(screen.getByText(/manages orders and gives visibility of sales/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch Rich Client" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review Pending Orders" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("F12: keeps its own Logout control alongside the header's Sign out", async () => {
    render(<AdminHomeContent />, { wrapper: MemoryRouter });

    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("navigates to /admin/orders when Launch Rich Client is activated", async () => {
    const user = userEvent.setup();

    render(<AdminHomeContent />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Launch Rich Client" }));

    expect(navigateMock).toHaveBeenCalledWith("/admin/orders");
  });

  it("SWHM-T-0208: navigates to /admin/orders-approval when Review Pending Orders is activated", async () => {
    const user = userEvent.setup();

    render(<AdminHomeContent />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Review Pending Orders" }));

    expect(navigateMock).toHaveBeenCalledWith("/admin/orders-approval");
  });

  it("POSTs to /api/signon/logout and navigates to / when Logout is activated", async () => {
    const user = userEvent.setup();

    render(<AdminHomeContent />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/signon/logout", { method: "POST" });
    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });
});
