import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ReportRow } from "../../admin/types";
import { ReportBars } from "./ReportBars";

/**
 * UI / COMPONENT TEST
 *
 * Same real-DOM pattern as src/components/ui/button.test.tsx. Purely
 * presentational (props only, no fetching) — asserts on rendered labels,
 * formatted values and each bar's width relative to the largest row.
 */
const ROWS: ReportRow[] = [
  { id: "BIRDS", label: "Birds", value: 100 },
  { id: "FISH", label: "Fish", value: 25 },
  { id: "CATS", label: "Cats", value: 50 },
];

function formatAsDollars(value: number): string {
  return `$${value.toFixed(2)}`;
}

describe("ReportBars", () => {
  it("RB-01: renders each row's label and its value through the supplied formatter", () => {
    render(<ReportBars rows={ROWS} formatValue={formatAsDollars} />);

    expect(screen.getByText("Birds")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("Fish")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
  });

  it("RB-02: sizes each bar to its share of the largest row's value", () => {
    render(<ReportBars rows={ROWS} formatValue={formatAsDollars} />);

    expect(screen.getByTestId("report-bar-BIRDS")).toHaveStyle({ width: "100%" });
    expect(screen.getByTestId("report-bar-FISH")).toHaveStyle({ width: "25%" });
    expect(screen.getByTestId("report-bar-CATS")).toHaveStyle({ width: "50%" });
  });

  it("RB-03: renders nothing but an empty container for no rows, without throwing", () => {
    render(<ReportBars rows={[]} formatValue={formatAsDollars} />);

    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
