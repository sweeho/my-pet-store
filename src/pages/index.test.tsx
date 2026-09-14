import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Home from "./index";

/**
 * UI / PAGE TEST
 *
 * Same tools as a component test (render + user-event), but exercises a
 * full page and a real interactive feature end to end inside jsdom: opening
 * the mobile nav (a @headlessui/react Dialog) and reading what appears.
 * Copy this pattern for other pages under src/pages.
 */
describe("Home page", () => {
  it("renders the hero heading and primary CTA", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "My Pet Store" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toBeInTheDocument();
  });

  it("lists the store highlights", () => {
    render(<Home />);

    for (const highlight of ["Free shipping", "Vet-approved", "Curated brands", "Local pickup"]) {
      expect(screen.getByText(highlight)).toBeInTheDocument();
    }
  });

  it("opens the mobile nav dialog and lists the nav links inside it", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // The mobile menu content isn't mounted until the dialog opens.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open main menu" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("link", { name: "Features" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Tech Stack" })).toBeInTheDocument();
  });

  it("closes the mobile nav dialog", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Open main menu" }));
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("requests no third-party asset and renders a store-branded mark instead of the template logo", async () => {
    const user = userEvent.setup();
    const { container } = render(<Home />);

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
});
