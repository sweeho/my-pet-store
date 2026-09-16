import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InventoryRow } from "../../../fulfillment/types";
import { InventoryContent } from "./inventory";

/**
 * UI / PAGE TEST
 *
 * Renders the unwrapped content component directly, as
 * src/pages/admin/orders.test.tsx does — RequireAdmin's own gating states
 * are already covered by RequireAdmin.test.tsx.
 */
function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body };
}

const SESSION = { j_signon_username: "supplier_admin" };

const ITEMS: InventoryRow[] = [
  { itemid: "BIRDS-PARROTS-1", quantity: 24 },
  { itemid: "CATS-SHORTHAIR-1", quantity: 0 },
];

const fetchMock = vi.fn();

function mockRoutes(items: InventoryRow[]) {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
    if (url.startsWith("/api/supplier/inventory") && (!init || init.method === undefined)) {
      return Promise.resolve(jsonResponse({ items }));
    }
    throw new Error(`unexpected fetch: ${url} ${init?.method ?? "GET"}`);
  });
}

describe("InventoryContent (/supplier/inventory)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("IT-01: shows a pending indicator while the fetch is outstanding, without hiding the heading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<InventoryContent />, { wrapper: MemoryRouter });

    expect(screen.getByText("Loading inventory…")).toHaveAttribute("role", "status");
    expect(screen.getByRole("heading", { name: "Inventory" })).toBeInTheDocument();
  });

  it("IT-02: renders the four column headers in order", async () => {
    mockRoutes(ITEMS);

    render(<InventoryContent />, { wrapper: MemoryRouter });

    const headers = await screen.findAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Item ID",
      "Existing quantity",
      "New quantity",
      "Update",
    ]);
  });

  it("IT-03: a never-stocked catalogue item appears showing 0 and can be given a quantity", async () => {
    mockRoutes(ITEMS);

    render(<InventoryContent />, { wrapper: MemoryRouter });

    const row = (await screen.findByRole("cell", { name: "CATS-SHORTHAIR-1" })).closest("tr")!;
    expect(within(row).getByText("0")).toBeInTheDocument();
    expect(
      within(row).getByRole("textbox", { name: "New quantity for CATS-SHORTHAIR-1" }),
    ).toBeInTheDocument();
  });

  it("IT-04: every row control's accessible name names that row's item id", async () => {
    mockRoutes(ITEMS);

    render(<InventoryContent />, { wrapper: MemoryRouter });
    await screen.findByRole("table");

    expect(
      screen.getByRole("textbox", { name: "New quantity for BIRDS-PARROTS-1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Update BIRDS-PARROTS-1" })).toBeInTheDocument();
  });

  it("IT-05: only ticked rows are sent — an unticked row's typed value is not submitted", async () => {
    mockRoutes(ITEMS);
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
      if (url.startsWith("/api/supplier/inventory") && init?.method === "POST") {
        return Promise.resolve(jsonResponse({ updated: ["BIRDS-PARROTS-1"], notFound: [] }));
      }
      if (url.startsWith("/api/supplier/inventory")) {
        return Promise.resolve(jsonResponse({ items: ITEMS }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    const user = userEvent.setup();

    render(<InventoryContent />, { wrapper: MemoryRouter });
    await screen.findByRole("table");

    // Type into the unticked row's input, but never tick its checkbox.
    await user.type(
      screen.getByRole("textbox", { name: "New quantity for CATS-SHORTHAIR-1" }),
      "99",
    );
    // Tick and fill in the other row.
    await user.type(
      screen.getByRole("textbox", { name: "New quantity for BIRDS-PARROTS-1" }),
      "40",
    );
    await user.click(screen.getByRole("checkbox", { name: "Update BIRDS-PARROTS-1" }));
    await user.click(screen.getByRole("button", { name: "Update Inventory" }));

    const postCall = await vi.waitUntil(() =>
      fetchMock.mock.calls.find((call: unknown[]) => (call[1] as RequestInit)?.method === "POST"),
    );
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body).toEqual({ updates: [{ itemid: "BIRDS-PARROTS-1", quantity: 40 }] });
  });

  it("IT-06: a successful submission re-reads the list so Existing quantity reflects what was stored", async () => {
    let getCount = 0;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
      if (url.startsWith("/api/supplier/inventory") && init?.method === "POST") {
        return Promise.resolve(jsonResponse({ updated: ["BIRDS-PARROTS-1"], notFound: [] }));
      }
      if (url.startsWith("/api/supplier/inventory")) {
        getCount += 1;
        const quantity = getCount === 1 ? 24 : 40;
        return Promise.resolve(jsonResponse({ items: [{ itemid: "BIRDS-PARROTS-1", quantity }] }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    const user = userEvent.setup();

    render(<InventoryContent />, { wrapper: MemoryRouter });
    await screen.findByRole("table");

    await user.type(
      screen.getByRole("textbox", { name: "New quantity for BIRDS-PARROTS-1" }),
      "40",
    );
    await user.click(screen.getByRole("checkbox", { name: "Update BIRDS-PARROTS-1" }));
    await user.click(screen.getByRole("button", { name: "Update Inventory" }));

    const row = await screen.findByRole("cell", { name: "BIRDS-PARROTS-1" });
    await vi.waitUntil(() => within(row.closest("tr")!).queryByText("40") !== null);
  });

  it("IT-07: a refused submission is reported at the form and the table stays", async () => {
    mockRoutes(ITEMS);
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
      if (url.startsWith("/api/supplier/inventory") && init?.method === "POST") {
        return Promise.resolve(
          jsonResponse(
            { error: "quantity for BIRDS-PARROTS-1 must be a non-negative integer" },
            { ok: false, status: 400 },
          ),
        );
      }
      if (url.startsWith("/api/supplier/inventory")) {
        return Promise.resolve(jsonResponse({ items: ITEMS }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    const user = userEvent.setup();

    render(<InventoryContent />, { wrapper: MemoryRouter });
    await screen.findByRole("table");

    await user.type(
      screen.getByRole("textbox", { name: "New quantity for BIRDS-PARROTS-1" }),
      "-1",
    );
    await user.click(screen.getByRole("checkbox", { name: "Update BIRDS-PARROTS-1" }));
    await user.click(screen.getByRole("button", { name: "Update Inventory" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "quantity for BIRDS-PARROTS-1 must be a non-negative integer",
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
