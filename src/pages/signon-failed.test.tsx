import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";

import SignOnFailed from "./signon-failed";

describe("SignOnFailed page", () => {
  it("renders the failure message verbatim", () => {
    render(<SignOnFailed />, { wrapper: MemoryRouter });

    expect(
      screen.getByText(
        "There were errors signing you in. The user name and password you entered were not found in our records. Please try again.",
      ),
    ).toBeInTheDocument();
  });
});
