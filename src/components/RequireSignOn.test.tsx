import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RequireSignOn } from "./RequireSignOn";

/**
 * UI / COMPONENT TEST
 *
 * Mirrors src/pages/signon.test.tsx's fetch-mocking shape. Unlike the page
 * tests, this component calls useNavigate()/useLocation(), so it needs a
 * router wrapper even for the pending and allowed cases.
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

describe("RequireSignOn", () => {
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
      <MemoryRouter initialEntries={["/customer"]}>
        <RequireSignOn>
          <div>protected content</div>
        </RequireSignOn>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders its children once the access check answers allowed", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ allowed: true }));

    render(
      <MemoryRouter initialEntries={["/customer"]}>
        <RequireSignOn>
          <div>protected content</div>
        </RequireSignOn>
      </MemoryRouter>,
    );

    expect(await screen.findByText("protected content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("redirects and never renders children when the access check answers denied", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ allowed: false, redirectTo: "/signon?resource=%2Fcustomer" }),
    );

    render(
      <MemoryRouter initialEntries={["/customer"]}>
        <RequireSignOn>
          <div>protected content</div>
        </RequireSignOn>
      </MemoryRouter>,
    );

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/signon?resource=%2Fcustomer");
    });
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });
});
