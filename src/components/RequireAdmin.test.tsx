import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_CONTENT_WIDTH } from "./layout";
import { RequireAdmin } from "./RequireAdmin";

/**
 * UI / COMPONENT TEST
 *
 * Mirrors src/components/RequireSignOn.test.tsx: same fetch-mocking shape and
 * router wrapper, extended with the role-required verdict this guard alone
 * has to handle by rendering a refusal in place rather than navigating.
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

describe("RequireAdmin", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    navigateMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a status indicator naming what is loading while the access check is in flight", () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>admin content</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("AC-8: the pending state takes the shared administration content width, not a width of its own", () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>admin content</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status").className).toContain(ADMIN_CONTENT_WIDTH);
  });

  it("renders its children once the access check answers allowed", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ allowed: true }));

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>admin content</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(await screen.findByText("admin content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("redirects and never renders children when the access check answers not-signed-on", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        allowed: false,
        reason: "not-signed-on",
        redirectTo: "/signon?resource=%2Fadmin",
      }),
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>admin content</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/signon?resource=%2Fadmin");
    });
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
  });

  it("renders a refusal in place, without navigating, when the access check answers role-required", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ allowed: false, reason: "role-required", requiredRole: "administrator" }),
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>admin content</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("admin content")).not.toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("AC-8: the refusal state takes the shared administration content width, not a width of its own", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ allowed: false, reason: "role-required", requiredRole: "administrator" }),
    );

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <RequireAdmin>
          <div>admin content</div>
        </RequireAdmin>
      </MemoryRouter>,
    );

    expect((await screen.findByRole("alert")).className).toContain(ADMIN_CONTENT_WIDTH);
  });
});
