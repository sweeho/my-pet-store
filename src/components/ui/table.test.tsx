import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

/**
 * UI / COMPONENT TEST
 *
 * Same real-DOM pattern as button.test.tsx. Renders the composed primitive
 * and asserts on the real semantic table roles jsdom derives from <table>,
 * <th> and <td> — not on class names or DOM shape.
 */
function ComposedTable({ tableClassName }: { tableClassName?: string }) {
  return (
    <Table className={tableClassName}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Order ID</TableHead>
          <TableHead scope="col">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>1024</TableCell>
          <TableCell>APPROVED</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe("ui/table", () => {
  it("TB-01: composes into a real semantic table with column headers, rows and cells", () => {
    render(<ComposedTable />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.getByRole("columnheader", { name: "Order ID" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "1024" })).toBeInTheDocument();
    // header row + one body row
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("TB-02: a caller's className on Table is merged in, overriding a conflicting built-in utility", () => {
    render(<ComposedTable tableClassName="w-1/2" />);

    const table = screen.getByRole("table");
    expect(table).toHaveClass("w-1/2");
    expect(table).not.toHaveClass("w-full");
  });
});
