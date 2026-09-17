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
function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body };
}

type DecisionBatchResult = { applied: number[]; skipped: number[]; notFound: number[] };

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
  {
    orderId: 1046,
    userId: "y_watanabe",
    orderDate: "2026-09-10T00:00:00.000Z",
    orderAmount: 124900,
    orderStatus: "PENDING",
  },
];
const PENDING_PAGE: Page<OrderSummary> = { items: PENDING_ORDERS, hasNext: false };
const EMPTY_PAGE: Page<OrderSummary> = { items: [], hasNext: false };

const fetchMock = vi.fn();

// The second and later /api/admin/orders GETs are the post-commit refresh
// (PLAN.md step 7) — refreshedPage lets a test simulate decided orders
// leaving the pending view without a real server round trip.
function mockRoutes(
  ordersPage: Page<OrderSummary>,
  options: { decisionsResult?: DecisionBatchResult; refreshedPage?: Page<OrderSummary> } = {},
) {
  let ordersCallCount = 0;
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
    if (url.startsWith("/api/cart")) return Promise.resolve(jsonResponse({ items: [], count: 0 }));
    if (url.startsWith("/api/admin/orders/decisions")) {
      return Promise.resolve(
        jsonResponse(options.decisionsResult ?? { applied: [], skipped: [], notFound: [] }),
      );
    }
    if (url.startsWith("/api/admin/orders")) {
      ordersCallCount += 1;
      const page = ordersCallCount === 1 ? ordersPage : (options.refreshedPage ?? ordersPage);
      return Promise.resolve(jsonResponse(page));
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
}

function decisionsCalls() {
  return fetchMock.mock.calls.filter((call: unknown[]) =>
    (call[0] as string).startsWith("/api/admin/orders/decisions"),
  );
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

  it("AC-1 / OA-03: renders the five data column headers in order, after the selection column", async () => {
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });

    const headers = await screen.findAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "",
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

  it("OA-07: every row carries a selection checkbox named after its order, plus a select-all checkbox", async () => {
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await screen.findByRole("table");

    expect(screen.getByRole("checkbox", { name: "Select all orders" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select order 1044" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select order 1045" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select order 1046" })).toBeInTheDocument();
  });

  it("PLAN step 2 / OA-08: Approve sets only the selected rows' status, never an unticked row", async () => {
    const user = userEvent.setup();
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await user.click(await screen.findByRole("checkbox", { name: "Select order 1044" }));
    await user.click(screen.getByRole("checkbox", { name: "Select order 1045" }));
    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByRole("button", { name: "Status for order 1044" })).toHaveTextContent(
      "APPROVED",
    );
    expect(screen.getByRole("button", { name: "Status for order 1045" })).toHaveTextContent(
      "APPROVED",
    );
    expect(screen.getByRole("button", { name: "Status for order 1046" })).toHaveTextContent(
      "PENDING",
    );
  });

  it("OA-09: Deny sets only the selected rows' status to DENIED", async () => {
    const user = userEvent.setup();
    mockRoutes(PENDING_PAGE);

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await user.click(await screen.findByRole("checkbox", { name: "Select order 1046" }));
    await user.click(screen.getByRole("button", { name: "Deny" }));

    expect(screen.getByRole("button", { name: "Status for order 1046" })).toHaveTextContent(
      "DENIED",
    );
    expect(screen.getByRole("button", { name: "Status for order 1044" })).toHaveTextContent(
      "PENDING",
    );
  });

  it("AC-3 / AC-4 / OA-10: Commit POSTs one entry per selected-and-changed row to /api/admin/orders/decisions, never /status", async () => {
    const user = userEvent.setup();
    mockRoutes(PENDING_PAGE, {
      decisionsResult: { applied: [1044, 1045], skipped: [], notFound: [] },
    });

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await user.click(await screen.findByRole("checkbox", { name: "Select order 1044" }));
    await user.click(screen.getByRole("checkbox", { name: "Select order 1045" }));
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Commit" }));

    await vi.waitFor(() => expect(decisionsCalls()).toHaveLength(1));
    const [url, init] = decisionsCalls()[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/orders/decisions");
    expect(JSON.parse(init.body as string)).toEqual({
      decisions: [
        { orderId: 1044, status: "APPROVED" },
        { orderId: 1045, status: "APPROVED" },
      ],
    });
    expect(
      fetchMock.mock.calls.some((call: unknown[]) =>
        (call[0] as string).startsWith("/api/admin/orders/status"),
      ),
    ).toBe(false);
  });

  it("PLAN step 4 / OA-11: a status changed in an unticked row is not committed", async () => {
    const user = userEvent.setup();
    mockRoutes(PENDING_PAGE, { decisionsResult: { applied: [1044], skipped: [], notFound: [] } });

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    // 1046's status is changed via its own control, but its row is never
    // ticked; 1044 is both ticked and changed via bulk Approve.
    await user.click(await screen.findByRole("button", { name: "Status for order 1046" }));
    await user.click(await screen.findByRole("option", { name: "DENIED" }));
    await user.click(screen.getByRole("checkbox", { name: "Select order 1044" }));
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Commit" }));

    await vi.waitFor(() => expect(decisionsCalls()).toHaveLength(1));
    const [, init] = decisionsCalls()[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      decisions: [{ orderId: 1044, status: "APPROVED" }],
    });
  });

  it("PLAN step 6 / OA-12: Commit disables itself and announces progress, then restores", async () => {
    const user = userEvent.setup();
    let resolveDecisions!: (value: unknown) => void;
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
      if (url.startsWith("/api/cart"))
        return Promise.resolve(jsonResponse({ items: [], count: 0 }));
      if (url.startsWith("/api/admin/orders/decisions")) {
        return new Promise((resolve) => {
          resolveDecisions = () =>
            resolve(jsonResponse({ applied: [1044], skipped: [], notFound: [] }));
        });
      }
      if (url.startsWith("/api/admin/orders")) return Promise.resolve(jsonResponse(PENDING_PAGE));
      throw new Error(`unexpected fetch: ${url}`);
    });

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await user.click(await screen.findByRole("checkbox", { name: "Select order 1044" }));
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Commit" }));

    expect(screen.getByRole("button", { name: "Committing…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/committing/i);

    resolveDecisions(undefined);

    // The label restores to "Commit" and the progress region clears once
    // the outcome is known (PLAN.md step 6). It reads disabled again here
    // because the successful commit reset the selection and status
    // choices it applied to, leaving nothing new to send — a different
    // reason than "still processing", which is what disabled it a moment
    // ago.
    expect(await screen.findByRole("button", { name: "Commit" })).toBeInTheDocument();
    expect(screen.queryByText(/committing changes/i)).not.toBeInTheDocument();
  });

  it("PLAN step 7 / OA-13: a skipped order in the response is reported, and the pending list refreshes", async () => {
    const user = userEvent.setup();
    const refreshedPage: Page<OrderSummary> = {
      items: PENDING_ORDERS.filter((order) => order.orderId !== 1044),
      hasNext: false,
    };
    mockRoutes(PENDING_PAGE, {
      decisionsResult: { applied: [], skipped: [1044], notFound: [] },
      refreshedPage,
    });

    render(<OrdersApprovalContent />, { wrapper: MemoryRouter });
    await user.click(await screen.findByRole("checkbox", { name: "Select order 1044" }));
    await user.click(screen.getByRole("button", { name: "Approve" }));
    await user.click(screen.getByRole("button", { name: "Commit" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/skipped/i);
    expect(alert).toHaveTextContent(/1/);

    await vi.waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Status for order 1044" }),
      ).not.toBeInTheDocument();
    });
  });
});
