import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { UnavailableInLanguage } from "./UnavailableInLanguage";

// The panel's own LanguageSwitcher opens a real @headlessui Menu, which
// tracks element movement via ResizeObserver on every open — jsdom doesn't
// implement it. Mirrors the stub in src/components/LanguageSwitcher.test.tsx.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("UnavailableInLanguage", () => {
  beforeAll(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("UL-01: names the language in its own script and the category's products in the heading and body", () => {
    render(<UnavailableInLanguage locale="zh_CN" noun="products" onViewInEnglish={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "No products in 中文 yet" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This category has nothing translated into 中文. Nothing has gone wrong — the products exist, but not in this language.",
      ),
    ).toBeInTheDocument();
  });

  it("UL-02: names the product's items when noun is items", () => {
    render(<UnavailableInLanguage locale="zh_CN" noun="items" onViewInEnglish={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "No items in 中文 yet" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This product has nothing translated into 中文. Nothing has gone wrong — the items exist, but not in this language.",
      ),
    ).toBeInTheDocument();
  });

  it("UL-03: falls back to an item-level message when noun is omitted", () => {
    render(<UnavailableInLanguage locale="zh_CN" onViewInEnglish={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Not available in 中文 yet" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This item has nothing translated into 中文. Nothing has gone wrong — it exists, but not in this language.",
      ),
    ).toBeInTheDocument();
  });

  it("UL-04: offers a primary 'View in English (US)' action and a secondary 'Change language' action", async () => {
    const user = userEvent.setup();
    const onViewInEnglish = vi.fn();
    render(
      <UnavailableInLanguage locale="zh_CN" noun="products" onViewInEnglish={onViewInEnglish} />,
    );

    expect(screen.getByRole("button", { name: "Change language" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View in English (US)" }));

    expect(onViewInEnglish).toHaveBeenCalledTimes(1);
  });

  it("UL-05: the 'Change language' control still works on a second use within the same screen (regression, SWHM-T-0084)", async () => {
    const user = userEvent.setup();
    const onChangeLocale = vi.fn();
    render(
      <UnavailableInLanguage
        locale="zh_CN"
        noun="products"
        onViewInEnglish={vi.fn()}
        onChangeLocale={onChangeLocale}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Change language" }));
    await user.click(screen.getByRole("menuitem", { name: /日本語/ }));

    expect(onChangeLocale).toHaveBeenNthCalledWith(1, "ja_JP");

    // The regression: opening the panel's own menu a second time within the
    // same render must still present the options and take effect.
    await user.click(screen.getByRole("button", { name: "Change language" }));
    await user.click(screen.getByRole("menuitem", { name: /English \(US\)/ }));

    expect(onChangeLocale).toHaveBeenNthCalledWith(2, "en_US");
    expect(onChangeLocale).toHaveBeenCalledTimes(2);
  });
});
