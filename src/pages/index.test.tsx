import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import Home from "./index";

/**
 * UI / PAGE TEST
 *
 * Same tools as a component test (render + user-event), but exercises a
 * full page and a real interactive feature end to end inside jsdom: opening
 * the mobile nav (a @headlessui/react Dialog) and reading what appears.
 * Copy this pattern for other pages under src/pages.
 *
 * Wrapped in a MemoryRouter because the page now renders react-router
 * `Link`s for every in-app destination (src/pages/signon.test.tsx does the
 * same for the same reason).
 */
describe("Home page", () => {
  it("renders the hero heading and primary CTA that opens the catalogue", () => {
    render(<Home />, { wrapper: MemoryRouter });

    expect(screen.getByRole("heading", { level: 1, name: "My Pet Store" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/catalog");
  });

  it("lists the store highlights", () => {
    render(<Home />, { wrapper: MemoryRouter });

    for (const highlight of ["Free shipping", "Vet-approved", "Curated brands", "Local pickup"]) {
      expect(screen.getByText(highlight)).toBeInTheDocument();
    }
  });

  it("points the header Log in control at the sign-on screen", () => {
    render(<Home />, { wrapper: MemoryRouter });

    expect(screen.getByRole("link", { name: /Log in/ })).toHaveAttribute("href", "/signon");
  });

  it("opens the mobile nav dialog and lists the nav links inside it", async () => {
    const user = userEvent.setup();
    render(<Home />, { wrapper: MemoryRouter });

    // The mobile menu content isn't mounted until the dialog opens.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open main menu" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Catalog" })).toHaveAttribute(
      "href",
      "/catalog",
    );
    expect(within(dialog).getByRole("link", { name: "My account" })).toHaveAttribute(
      "href",
      "/customer",
    );
    expect(within(dialog).getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/signon");
  });

  it("closes the mobile nav dialog", async () => {
    const user = userEvent.setup();
    render(<Home />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole("button", { name: "Open main menu" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("requests no third-party asset and renders a store-branded mark instead of the template logo", async () => {
    const user = userEvent.setup();
    const { container } = render(<Home />, { wrapper: MemoryRouter });

    // The header logo link keeps its accessible name and now renders an
    // in-repo SVG mark rather than a hotlinked <img>.
    const headerLogoLink = screen.getByRole("link", { name: "My Pet Store" });
    expect(within(headerLogoLink).queryByRole("img")).not.toBeInTheDocument();
    expect(headerLogoLink.querySelector("svg")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open main menu" }));
    const dialog = await screen.findByRole("dialog");
    const dialogLogoLink = within(dialog).getByRole("link", { name: "My Pet Store" });
    expect(within(dialogLogoLink).queryByRole("img")).not.toBeInTheDocument();
    expect(dialogLogoLink.querySelector("svg")).toBeInTheDocument();

    for (const element of container.querySelectorAll<HTMLImageElement | HTMLAnchorElement>(
      "[src], [href]",
    )) {
      const value = element.getAttribute("src") ?? element.getAttribute("href") ?? "";
      expect(value).not.toContain("tailwindcss.com");
      if (value) {
        expect(value.startsWith("http://") || value.startsWith("https://")).toBe(false);
      }
    }
  });

  it("leaves no navigation or hero link as a placeholder fragment", async () => {
    const user = userEvent.setup();
    render(<Home />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole("button", { name: "Open main menu" }));
    await screen.findByRole("dialog");

    // The brand logo links (accessible name "My Pet Store") are out of
    // scope for this ticket — only nav and hero controls are checked.
    const logoLinks = screen.getAllByRole("link", { name: "My Pet Store" });
    for (const link of screen.getAllByRole("link")) {
      if (logoLinks.includes(link)) continue;
      expect(link).not.toHaveAttribute("href", "#");
    }
  });
});
