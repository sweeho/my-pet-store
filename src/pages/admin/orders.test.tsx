import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderSummary, Page } from "../../../admin/types";
import { OrdersContent } from "./orders";

/**
 * UI / PAGE TEST
 *
 * Renders the unwrapped content component directly, as src/pages/admin/index.test.tsx does —
 * RequireAdmin's own gating states are already covered by RequireAdmin.test.tsx.
 */
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const SESSION = { j_signon_username: "jps_admin" };

const ORDERS: OrderSummary[] = [
  {
    orderId: 1024,
    userId: "j2ee",
    orderDate: "2026-09-12T00:00:00.000Z",
    orderAmount: 1240,
    orderStatus: "APPROVED",
  },
  {
    orderId: 1023,
    userId: "marion.hall",
    orderDate: "2026-09-11T00:00:00.000Z",
    orderAmount: 18.5,
    orderStatus: "COMPLETED",
  },
  {
    orderId: 1021,
    userId: "k_okafor",
    orderDate: "2026-09-10T00:00:00.000Z",
    orderAmount: 62.25,
    orderStatus: "DENIED",
  },
];
const ORDERS_PAGE: Page<OrderSummary> = { items: ORDERS, hasNext: false };
const EMPTY_PAGE: Page<OrderSummary> = { items: [], hasNext: false };

const fetchMock = vi.fn();

function mockRoutes(ordersPage: Page<OrderSummary>) {
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
    if (url.startsWith("/api/cart")) return Promise.resolve(jsonResponse({ items: [], count: 0 }));
    if (url.startsWith("/api/admin/orders")) return Promise.resolve(jsonResponse(ordersPage));
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe("OrdersContent (/admin/orders)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("OV-01: requests the three statuses this screen shows, in one request", async () => {
    mockRoutes(ORDERS_PAGE);

    render(<OrdersContent />, { wrapper: MemoryRouter });
    await screen.findByRole("table");

    const ordersCall = fetchMock.mock.calls.find((call: unknown[]) =>
      (call[0] as string).startsWith("/api/admin/orders"),
    );
    expect(ordersCall).toBeDefined();
    const url = new URL(ordersCall![0] as string, "http://localhost");
    expect(url.searchParams.getAll("status")).toEqual(["APPROVED", "COMPLETED", "DENIED"]);
  });

  it("OV-02: shows a pending indicator while the fetch is outstanding, without hiding the heading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<OrdersContent />, { wrapper: MemoryRouter });

    expect(screen.getByText("Loading orders…")).toHaveAttribute("role", "status");
    expect(screen.getByRole("heading", { name: "Orders" })).toBeInTheDocument();
  });

  it("OV-03: renders the five column headers in order", async () => {
    mockRoutes(ORDERS_PAGE);

    render(<OrdersContent />, { wrapper: MemoryRouter });

    const headers = await screen.findAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Order ID",
      "User ID",
      "Order Date",
      "Order Amount",
      "Status",
    ]);
  });

  it("OV-04: formats a rendered row's date as MM/DD/YYYY and amount as $ with two decimals and a thousands separator", async () => {
    mockRoutes(ORDERS_PAGE);

    render(<OrdersContent />, { wrapper: MemoryRouter });

    const row = (await screen.findByRole("cell", { name: "1024" })).closest("tr")!;
    expect(within(row).getByText("09/12/2026")).toBeInTheDocument();
    expect(within(row).getByText("$1,240.00")).toBeInTheDocument();
    expect(within(row).getByText("APPROVED")).toBeInTheDocument();
  });

  it("OV-05: the count line reflects the rows actually rendered", async () => {
    mockRoutes(ORDERS_PAGE);

    render(<OrdersContent />, { wrapper: MemoryRouter });

    expect(await screen.findByText("3 orders")).toBeInTheDocument();
  });

  it("OV-06: shows a named empty state in place of the table when no orders match", async () => {
    mockRoutes(EMPTY_PAGE);

    render(<OrdersContent />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/no approved, completed or denied orders/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("OV-07: the rendered table contains no interactive form control anywhere", async () => {
    mockRoutes(ORDERS_PAGE);

    render(<OrdersContent />, { wrapper: MemoryRouter });

    const table = await screen.findByRole("table");
    expect(within(table).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(table).queryByRole("combobox")).not.toBeInTheDocument();
    expect(within(table).queryByRole("button")).not.toBeInTheDocument();
    expect(within(table).queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
