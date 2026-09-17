import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Report } from "../../../../admin/types";
import { OrderCountReportContent } from "./orders";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/admin/reports/revenue.test.tsx: renders the unwrapped
 * content component directly — RequireAdmin's own gating states are covered
 * elsewhere.
 */
function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const SESSION = { j_signon_username: "jps_admin" };

const REPORT: Report = {
  groupedBy: "Category",
  rows: [
    { id: "BIRDS", label: "Birds", value: 40 },
    { id: "FISH", label: "Fish", value: 12 },
  ],
  totalSales: 52,
};
const EMPTY_REPORT: Report = { groupedBy: "Category", rows: [], totalSales: 0 };

const fetchMock = vi.fn();

function mockRoutes(report: Report) {
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith("/api/signon/session")) return Promise.resolve(jsonResponse(SESSION));
    if (url.startsWith("/api/cart")) return Promise.resolve(jsonResponse({ items: [], count: 0 }));
    if (url.startsWith("/api/admin/reports/orders")) return Promise.resolve(jsonResponse(report));
    throw new Error(`unexpected fetch: ${url}`);
  });
}

describe("OrderCountReportContent (/admin/reports/orders)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("OT-01: shows a pending indicator while the report is in flight, with the heading and date inputs still visible", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<OrderCountReportContent />, { wrapper: MemoryRouter });

    expect(screen.getByText("Loading report…")).toHaveAttribute("role", "status");
    expect(screen.getByRole("heading", { name: "Order Counts by Category" })).toBeInTheDocument();
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("OT-02: renders the report's rows and total once the fetch resolves, formatted as a count not currency", async () => {
    mockRoutes(REPORT);

    render(<OrderCountReportContent />, { wrapper: MemoryRouter });

    expect(await screen.findByText("Birds")).toBeInTheDocument();
    expect(screen.getByText("Fish")).toBeInTheDocument();
    expect(screen.getByText("Total: 52")).toBeInTheDocument();
  });

  it("OT-03: shows a named empty state when no orders are in range", async () => {
    mockRoutes(EMPTY_REPORT);

    render(<OrderCountReportContent />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/no orders/i)).toBeInTheDocument();
  });

  it("OT-04: changing a date re-queries the report with the new range", async () => {
    mockRoutes(REPORT);

    render(<OrderCountReportContent />, { wrapper: MemoryRouter });
    await screen.findByText("Birds");

    fetchMock.mockClear();
    mockRoutes(EMPTY_REPORT);
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2024-02-01" } });

    await screen.findByText(/no orders/i);

    const reportCall = fetchMock.mock.calls.find((call: unknown[]) =>
      (call[0] as string).startsWith("/api/admin/reports/orders"),
    );
    expect(reportCall).toBeDefined();
    const url = new URL(reportCall![0] as string, "http://localhost");
    expect(url.searchParams.get("start")).toBe("02/01/2024");
  });
});
