import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";

import AdminSignOnFailed from "./signon-failed";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/signon-failed.test.tsx's shape for the shopper-side
 * equivalent — this is a separate page, not that one, so its own heading,
 * message and back-link target are asserted independently.
 */
describe("AdminSignOnFailed page", () => {
  it("renders the Sign In Failed heading", () => {
    render(<AdminSignOnFailed />, { wrapper: MemoryRouter });

    expect(screen.getByRole("heading", { name: "Sign In Failed" })).toBeInTheDocument();
  });

  it("renders the failure message verbatim", () => {
    render(<AdminSignOnFailed />, { wrapper: MemoryRouter });

    expect(
      screen.getByText(
        "There were errors signing you in. The user name and password you entered were not found in our records. Please try again.",
      ),
    ).toBeInTheDocument();
  });

  it("links back to /admin/signon for another attempt", () => {
    render(<AdminSignOnFailed />, { wrapper: MemoryRouter });

    expect(screen.getByRole("link", { name: "← Back to sign in" })).toHaveAttribute(
      "href",
      "/admin/signon",
    );
  });
});
