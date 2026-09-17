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
 * already covered by RequireAdmin.test.tsx. This page also calls
 * useNavigate(), so react-router's hook is mocked the way
 * src/pages/admin/signon.test.tsx does it.
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

describe("AdminHomeContent", () => {
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

    render(<AdminHomeContent />, { wrapper: MemoryRouter });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
  });

  it("renders the title, description and all three actions once the session read resolves", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ j_signon_username: "jps_admin" }));

    render(<AdminHomeContent />, { wrapper: MemoryRouter });

    expect(await screen.findByText("jps_admin")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Administration" })).toBeInTheDocument();
    expect(screen.getByText(/manages orders and gives visibility of sales/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch Rich Client" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review Pending Orders" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("navigates to /admin/orders when Launch Rich Client is activated", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ j_signon_username: "jps_admin" }));

    render(<AdminHomeContent />, { wrapper: MemoryRouter });
    await screen.findByText("jps_admin");
    await user.click(screen.getByRole("button", { name: "Launch Rich Client" }));

    expect(navigateMock).toHaveBeenCalledWith("/admin/orders");
  });

  it("SWHM-T-0208: navigates to /admin/orders-approval when Review Pending Orders is activated", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ j_signon_username: "jps_admin" }));

    render(<AdminHomeContent />, { wrapper: MemoryRouter });
    await screen.findByText("jps_admin");
    await user.click(screen.getByRole("button", { name: "Review Pending Orders" }));

    expect(navigateMock).toHaveBeenCalledWith("/admin/orders-approval");
  });

  it("POSTs to /api/signon/logout and navigates to / when Logout is activated", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ j_signon_username: "jps_admin" }));
    fetchMock.mockResolvedValueOnce(jsonResponse({}));

    render(<AdminHomeContent />, { wrapper: MemoryRouter });
    await screen.findByText("jps_admin");
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/signon/logout", { method: "POST" });
    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });
});
