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
 * RequireAdmin.test.tsx), mock react-router's useNavigate the same way.
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

describe("SupplierHomeContent", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a pending indicator for the username while the session read is outstanding, without hiding the heading", () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));

    render(<SupplierHomeContent />, { wrapper: MemoryRouter });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Supplier" })).toBeInTheDocument();
  });

  it("renders the heading, description and both controls once the session read resolves", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ j_signon_username: "jps_admin" }));

    render(<SupplierHomeContent />, { wrapper: MemoryRouter });

    expect(await screen.findByText("jps_admin")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Supplier" })).toBeInTheDocument();
    expect(
      screen.getByText(/checks each line item against stock, ships what is available/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Display Inventory" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("navigates to /supplier/inventory when Display Inventory is activated", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ j_signon_username: "jps_admin" }));

    render(<SupplierHomeContent />, { wrapper: MemoryRouter });
    await screen.findByText("jps_admin");
    await user.click(screen.getByRole("button", { name: "Display Inventory" }));

    expect(navigateMock).toHaveBeenCalledWith("/supplier/inventory");
  });

  it("POSTs to /api/signon/logout and navigates to / when Logout is activated", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ j_signon_username: "jps_admin" }));
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    render(<SupplierHomeContent />, { wrapper: MemoryRouter });
    await screen.findByText("jps_admin");
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/signon/logout", { method: "POST" });
    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });
});
