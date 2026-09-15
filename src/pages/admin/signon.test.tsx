import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminSignOn from "./signon";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/signon.test.tsx's fetch-mocking shape. This page also
 * calls useNavigate(), so react-router's hook is mocked the way
 * src/components/RequireSignOn.test.tsx does it.
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

describe("AdminSignOn page", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PT-01: pre-fills the username and password fields with the development defaults", () => {
    render(<AdminSignOn />, { wrapper: MemoryRouter });

    expect(screen.getByRole("textbox", { name: "Username" })).toHaveValue("jps_admin");
    expect(screen.getByLabelText("Password")).toHaveValue("admin");
  });

  it("PT-02: submitting POSTs to /api/signon with the field values as j_username/j_password", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ signedOn: true, redirectTo: "/admin" }));

    render(<AdminSignOn />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/signon",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ j_username: "jps_admin", j_password: "admin" }),
      }),
    );
  });

  it("PT-03: navigates to /admin when the sign-on succeeds", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ signedOn: true, redirectTo: "/admin" }));

    render(<AdminSignOn />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/admin");
    });
  });

  it("PT-04: navigates to /admin/signon-failed when the sign-on fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ signedOn: false, redirectTo: "/admin/signon-failed" }),
    );

    render(<AdminSignOn />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/admin/signon-failed");
    });
  });

  it("PT-05: modified credentials are submitted instead of the defaults", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ signedOn: true, redirectTo: "/admin" }));

    render(<AdminSignOn />, { wrapper: MemoryRouter });
    await user.clear(screen.getByRole("textbox", { name: "Username" }));
    await user.type(screen.getByRole("textbox", { name: "Username" }), "other_admin");
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "different");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/signon",
      expect.objectContaining({
        body: JSON.stringify({ j_username: "other_admin", j_password: "different" }),
      }),
    );
  });
});
