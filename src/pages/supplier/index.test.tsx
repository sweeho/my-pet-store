import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SupplierHomeContent } from "./index";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/admin/index.test.tsx: render the unwrapped content
 * component directly (RequireAdmin's own gating is covered by
 * RequireAdmin.test.tsx, the header's own identity behaviour by
 * StoreHeader.test.tsx), mock react-router's useNavigate the same way.
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

describe("SupplierHomeContent", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    mockFetch();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the heading, description and both controls", () => {
    render(<SupplierHomeContent />, { wrapper: MemoryRouter });

    expect(screen.getByRole("heading", { name: "Supplier" })).toBeInTheDocument();
    expect(
      screen.getByText(/checks each line item against stock, ships what is available/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Display Inventory" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("F12: keeps its own Logout control alongside the header's Sign out", async () => {
    render(<SupplierHomeContent />, { wrapper: MemoryRouter });

    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("navigates to /supplier/inventory when Display Inventory is activated", async () => {
    const user = userEvent.setup();

    render(<SupplierHomeContent />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Display Inventory" }));

    expect(navigateMock).toHaveBeenCalledWith("/supplier/inventory");
  });

  it("POSTs to /api/signon/logout and navigates to / when Logout is activated", async () => {
    const user = userEvent.setup();

    render(<SupplierHomeContent />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/signon/logout", { method: "POST" });
    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });
});
