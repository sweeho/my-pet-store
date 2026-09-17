import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminShell } from "./AdminShell";
import { ADMIN_CONTENT_WIDTH } from "./layout";

/**
 * UI / COMPONENT TEST
 *
 * AdminShell is now StoreHeader's administration variant plus the optional
 * back link and the content frame (design.md § Decisions D8) — the header's
 * own control order, identity and cart-count behaviour are StoreHeader's own
 * tests (src/components/StoreHeader.test.tsx AC-11/AC-12/AC-17). This file
 * covers what AdminShell itself still owns: the frame's width, the optional
 * back link, and that the header precedes the back link and content in
 * document order (the keyboard-order requirement).
 *
 * StoreHeader fetches the session and the cart on mount, so every render
 * needs a router wrapper and a fetch mock, mirroring StoreHeader.test.tsx's
 * own mocking shape.
 */
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const fetchMock = vi.fn();

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
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe("AdminShell", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mockFetch();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the administration header and the page content", async () => {
    render(
      <MemoryRouter>
        <AdminShell>
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("· Administration")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
    expect(await screen.findByText("jps_admin")).toBeInTheDocument();
  });

  it("does not render a back link when backTo is omitted", () => {
    render(
      <MemoryRouter>
        <AdminShell>
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: /back/i })).not.toBeInTheDocument();
  });

  it("renders a back link to backTo, with the default label, when backTo is given", () => {
    render(
      <MemoryRouter>
        <AdminShell backTo="/admin">
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /back to admin home/i });
    expect(link).toHaveAttribute("href", "/admin");
  });

  it("renders a back link with a custom backLabel when given", () => {
    render(
      <MemoryRouter>
        <AdminShell backTo="/admin" backLabel="Back to reports">
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /back to reports/i })).toBeInTheDocument();
  });

  it("AC-6: places the header before the back link and the content, in document order", () => {
    const { container } = render(
      <MemoryRouter>
        <AdminShell backTo="/admin">
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    const header = container.querySelector("header")!;
    const backLink = screen.getByRole("link", { name: /back to admin home/i });
    const content = screen.getByText("page content");

    expect(
      header.compareDocumentPosition(backLink) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(header.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("AC-7 / AC-8: the content frame takes the shared administration content width, not a width of its own", () => {
    const { container } = render(
      <MemoryRouter>
        <AdminShell>
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    const frame = screen.getByText("page content").parentElement!;
    expect(frame.className).toContain(ADMIN_CONTENT_WIDTH);
    expect(container.querySelector("header > div")?.className).toContain(ADMIN_CONTENT_WIDTH);
  });
});
