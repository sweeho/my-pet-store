import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { LanguageSwitcher } from "./LanguageSwitcher";

/**
 * UI / COMPONENT TEST
 *
 * Mirrors src/components/ui/button.test.tsx's shape: a real render, driven
 * with @testing-library/user-event. Purely presentational (props only, no
 * fetch/router), so no wrapper is needed — copy src/components/RequireSignOn.test.tsx
 * instead if a future change here needs one.
 *
 * @headlessui/react's Menu tracks element movement (to close on scroll/resize)
 * via ResizeObserver on every open, which jsdom doesn't implement — stub it
 * here rather than in the shared test setup, since this is the only test that
 * opens a headlessui Menu.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("LanguageSwitcher", () => {
  beforeAll(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("LS-01: names the language currently displayed", () => {
    render(<LanguageSwitcher locale="ja_JP" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /日本語/ })).toBeInTheDocument();
  });

  it("LS-02: offers exactly the three LANGUAGES options, derived from account/vocabulary.ts", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher locale="en_US" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /English \(US\)/ }));

    expect(screen.getByRole("menuitem", { name: /English \(US\)/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /日本語/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /中文/ })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
  });

  it("LS-03: marks the currently displayed language as the current option", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher locale="ja_JP" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /日本語/ }));

    expect(screen.getByRole("menuitem", { name: /日本語/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("menuitem", { name: /English \(US\)/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("LS-04: choosing an option calls onChange with that locale code", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguageSwitcher locale="en_US" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /English \(US\)/ }));
    await user.click(screen.getByRole("menuitem", { name: /中文/ }));

    expect(onChange).toHaveBeenCalledWith("zh_CN");
  });

  it("LS-05: shows the footnote that the choice is saved to the profile", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher locale="en_US" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /English \(US\)/ }));

    expect(screen.getByText("Saved to your profile — applies on every visit.")).toBeInTheDocument();
  });
});
