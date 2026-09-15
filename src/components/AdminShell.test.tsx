import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { AdminShell } from "./AdminShell";

/**
 * UI / COMPONENT TEST
 *
 * Covers the header this component shares across every admin screen: the
 * username slot (present vs. pending) and the optional back link, which is
 * what lets one component serve both the home screen (no backTo) and every
 * other admin screen (backTo set).
 */
describe("AdminShell", () => {
  it("renders the signed-in username in the header", () => {
    render(
      <MemoryRouter>
        <AdminShell username="jps_admin">
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("jps_admin")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("shows a status indicator in place of the username while it is still loading", () => {
    render(
      <MemoryRouter>
        <AdminShell username={null}>
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("does not render a back link when backTo is omitted", () => {
    render(
      <MemoryRouter>
        <AdminShell username="jps_admin">
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders a back link to backTo, with the default label, when backTo is given", () => {
    render(
      <MemoryRouter>
        <AdminShell username="jps_admin" backTo="/admin">
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
        <AdminShell username="jps_admin" backTo="/admin" backLabel="Back to reports">
          <p>page content</p>
        </AdminShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /back to reports/i })).toBeInTheDocument();
  });
});
