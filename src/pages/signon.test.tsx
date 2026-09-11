import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";

import SignOn from "./signon";

/**
 * UI / PAGE TEST
 *
 * Same tools as src/pages/index.test.tsx, wrapped in a MemoryRouter because
 * this page calls useNavigate(). The two forms share label text ("Username",
 * "Password"), so each assertion scopes into its own <form aria-label> via
 * within() rather than relying on a globally-unique accessible name.
 */
describe("SignOn page", () => {
  afterEach(() => {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  it("renders the sign-in form with username, password, remember checkbox and submit", () => {
    render(<SignOn />, { wrapper: MemoryRouter });

    const signIn = within(screen.getByRole("form", { name: "Sign in" }));
    expect(signIn.getByRole("textbox", { name: "Username" })).toBeInTheDocument();
    expect(signIn.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(signIn.getByRole("checkbox", { name: "Remember My User Name" })).toBeInTheDocument();
    expect(signIn.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("pre-populates the username field from an existing bp_signon cookie", () => {
    document.cookie = "bp_signon=alice";

    render(<SignOn />, { wrapper: MemoryRouter });

    const signIn = within(screen.getByRole("form", { name: "Sign in" }));
    expect(signIn.getByRole("textbox", { name: "Username" })).toHaveValue("alice");
  });

  it("defaults the username field to empty without a bp_signon cookie", () => {
    render(<SignOn />, { wrapper: MemoryRouter });

    const signIn = within(screen.getByRole("form", { name: "Sign in" }));
    expect(signIn.getByRole("textbox", { name: "Username" })).toHaveValue("");
  });

  it("renders the sign-up form with username, password, password repeat and submit", () => {
    render(<SignOn />, { wrapper: MemoryRouter });

    const signUp = within(screen.getByRole("form", { name: "Create a new account" }));
    expect(signUp.getByRole("textbox", { name: "Username" })).toBeInTheDocument();
    expect(signUp.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(signUp.getByLabelText("Repeat Password")).toHaveAttribute("type", "password");
    expect(signUp.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });
});
