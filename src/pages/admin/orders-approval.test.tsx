import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OrderSummary, Page } from "../../../admin/types";
import { OrdersApprovalContent } from "./orders-approval";

/**
 * UI / PAGE TEST
 *
 * Renders the unwrapped content component directly, as
 * src/pages/admin/orders.test.tsx does — RequireAdmin's own gating states
 * are already covered by RequireAdmin.test.tsx. PLAN.md step 9: assert the
 * five data columns render for each pending order, and that opening a
 * row's status control reveals exactly PENDING, APPROVED and DENIED.
 * Located by role and accessible name throughout, never by class name.
 *
 * jsdom has no ResizeObserver, which Headless UI's Listbox (the status
 * control) uses internally — see src/components/ui/status-select.test.tsx
 * for the same stub.
 */
if (typeof ResizeObserver === "undefined") {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const SESSION = { j_signon_username: "jps_admin" };

const PENDING_ORDERS: OrderSummary[] = [
  {
    orderId: 1044,
    userId: "m_okafor",
    orderDate: "2026-09-11T00:00:00.000Z",
    orderAmount: 1289.5,
    orderStatus: "PENDING",
  },
  {
    orderId: 1045,
    userId: "s_bergstrom",
    orderDate: "2026-09-11T00:00:00.000Z",
    orderAmount: 515.75,
    orderStatus: "PENDING",
  },
];
const PENDING_PAGE: Page<OrderSummary> = { items: PENDING_ORDERS, hasNext: false };
const EMPTY_PAGE: Page<OrderSummary> = { items: [], hasNext: false };

const fetchMock = vi.fn();

function mockRoutes(ordersPage: Page<OrderSummary>) {
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
    if (url.startsWith("/api/admin/orders")) return Promise.resolve(jsonResponse(ordersPage));
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe("OrdersApprovalContent (/admin/orders-approval)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("OA-01: requests only PENDING orders", async () => {
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await screen.findByRole("table");

    const ordersCall = fetchMock.mock.calls.find((call: unknown[]) =>
      (call[0] as string).startsWith("/api/admin/orders"),
    );
    expect(ordersCall).toBeDefined();
    const url = new URL(ordersCall![0] as string, "http://localhost");
    expect(url.searchParams.getAll("status")).toEqual(["PENDING"]);
  });

  it("OA-02: shows a pending indicator while the fetch is outstanding, without hiding the heading", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });

    expect(screen.getByText("Loading orders…")).toHaveAttribute("role", "status");
    expect(screen.getByRole("heading", { name: "Orders Approval" })).toBeInTheDocument();
  });

  it("AC-1 / OA-03: renders the five column headers in order", async () => {
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });

    const headers = await screen.findAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Order ID",
      "User ID",
      "Order Date",
      "Order Amount",
      "Status",
    ]);
  });

  it("AC-1 / OA-04: a pending order's row renders its id, user, formatted date, formatted amount and status", async () => {
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });

    const row = (await screen.findByRole("cell", { name: "1044" })).closest("tr")!;
    expect(within(row).getByText("m_okafor")).toBeInTheDocument();
    expect(within(row).getByText("09/11/2026")).toBeInTheDocument();
    expect(within(row).getByText("$1,289.50")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Status for order 1044" })).toHaveTextContent(
      "PENDING",
    );
  });

  it("AC-2 / OA-05: opening a row's status control reveals exactly PENDING, APPROVED and DENIED", async () => {
    const user = userEvent.setup();
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await user.click(await screen.findByRole("button", { name: "Status for order 1045" }));

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["PENDING", "APPROVED", "DENIED"]);
  });

  it("OA-06: shows a named empty state in place of the table when no orders are pending", async () => {
    mockRoutes(EMPTY_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/no pending orders/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
