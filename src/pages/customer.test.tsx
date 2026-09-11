import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomerAccount } from "../../account/types";
import { CustomerProfile } from "./customer";

/**
 * UI / PAGE TEST
 *
 * Mirrors src/pages/signon.test.tsx: render the unwrapped content component
 * directly (no RequireSignOn gate, no router — this page never navigates),
 * mock the two account endpoints it calls, and assert against accessible
 * roles/labels rather than the DOM shape.
 */
const sampleAccount: CustomerAccount = {
  userName: "alice",
  status: "active",
  contactInfo: {
    givenName: "Alice",
    familyName: "Anderson",
    telephone: "555-1000",
    email: "alice@example.com",
  },
  address: {
    streetName1: "1 Main St",
    streetName2: "Apt 4",
    city: "Springfield",
    state: "California",
    zipCode: "90210",
    country: "USA",
  },
  card: { cardType: "Meow Card", expiryDate: "12/2025", lastFour: "1234" },
  profile: {
    preferredLanguage: "ja_JP",
    favoriteCategory: "DOGS",
    myListPreference: true,
    bannerPreference: false,
  },
};

function jsonResponse(body: unknown, init: { ok: boolean; status?: number } = { ok: true }) {
  return { ok: init.ok, status: init.status ?? (init.ok ? 200 : 400), json: async () => body };
}

const fetchMock = vi.fn();

describe("CustomerProfile", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PT-01: renders the wireframe's contact-information fields with their values", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));

    render(<CustomerProfile />);

    const card = await screen.findByRole("region", { name: "Contact information" });
    expect(
      within(within(card).getByRole("group", { name: "First name" })).getByText("Alice"),
    ).toBeInTheDocument();
    expect(within(card).getByRole("group", { name: "Last name" }).textContent).toContain(
      "Anderson",
    );
    expect(within(card).getByRole("group", { name: "Street address" }).textContent).toContain(
      "1 Main St, Apt 4",
    );
    expect(within(card).getByRole("group", { name: "City" }).textContent).toContain("Springfield");
    expect(within(card).getByRole("group", { name: "State / Province" }).textContent).toContain(
      "California",
    );
    expect(within(card).getByRole("group", { name: "Postal code" }).textContent).toContain("90210");
    expect(within(card).getByRole("group", { name: "Country" }).textContent).toContain("USA");
  });

  it("PT-02: renders the account-details card as read-only rows", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));

    render(<CustomerProfile />);

    const card = await screen.findByRole("region", { name: "Account details" });
    expect(within(card).getByRole("group", { name: "Account status" }).textContent).toContain(
      "active",
    );
    expect(within(card).getByRole("group", { name: "Telephone" }).textContent).toContain(
      "555-1000",
    );
    expect(within(card).getByRole("group", { name: "Email" }).textContent).toContain(
      "alice@example.com",
    );
    expect(within(card).getByRole("group", { name: "Card type" }).textContent).toContain(
      "Meow Card",
    );
    expect(within(card).getByText("Read only")).toBeInTheDocument();
  });

  it("PT-03: the edit affordance reveals a form pre-filled with the current values", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));
    const user = userEvent.setup();

    render(<CustomerProfile />);
    await screen.findByRole("region", { name: "Contact information" });
    await user.click(screen.getByRole("button", { name: "Edit profile" }));

    const form = screen.getByRole("form", { name: "Edit profile" });
    expect(within(form).getByLabelText("First name")).toHaveValue("Alice");
    expect(within(form).getByLabelText("Last name")).toHaveValue("Anderson");
    expect(within(form).getByLabelText("Telephone")).toHaveValue("555-1000");
    expect(within(form).getByLabelText("Email")).toHaveValue("alice@example.com");
    expect(within(form).getByLabelText("Street address line 1")).toHaveValue("1 Main St");
    expect(within(form).getByLabelText("Street address line 2")).toHaveValue("Apt 4");
    expect(within(form).getByLabelText("City")).toHaveValue("Springfield");
    expect(within(form).getByLabelText("State / Province")).toHaveValue("California");
    expect(within(form).getByLabelText("Postal code")).toHaveValue("90210");
    expect(within(form).getByLabelText("Country")).toHaveValue("USA");
    expect(within(form).getByLabelText("Card type")).toHaveValue("Meow Card");
    expect(within(form).getByLabelText("Expiry (MM/YYYY)")).toHaveValue("12/2025");
    expect(within(form).getByLabelText("Card number")).toHaveValue("1234");
    expect(within(form).getByLabelText("Preferred language")).toHaveValue("ja_JP");
    expect(within(form).getByLabelText("Favorite category")).toHaveValue("DOGS");
    expect(within(form).getByLabelText("Add to My List by default")).toBeChecked();
    expect(within(form).getByLabelText("Show banner promotions")).not.toBeChecked();
  });

  it("PT-04: the language control offers exactly en_US, ja_JP and zh_CN", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));
    const user = userEvent.setup();

    render(<CustomerProfile />);
    await screen.findByRole("region", { name: "Contact information" });
    await user.click(screen.getByRole("button", { name: "Edit profile" }));

    const select = screen.getByLabelText("Preferred language") as HTMLSelectElement;
    const values = Array.from(select.options).map((option) => option.value);
    expect(values).toEqual(["en_US", "ja_JP", "zh_CN"]);
  });

  it("PT-05: the category control offers exactly the five vocabulary categories", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));
    const user = userEvent.setup();

    render(<CustomerProfile />);
    await screen.findByRole("region", { name: "Contact information" });
    await user.click(screen.getByRole("button", { name: "Edit profile" }));

    const select = screen.getByLabelText("Favorite category") as HTMLSelectElement;
    const values = Array.from(select.options)
      .map((option) => option.value)
      .filter((value) => value !== "");
    expect(values).toEqual(["BIRDS", "CATS", "DOGS", "FISH", "REPTILES"]);
  });

  it("PT-06: submitting the edit form saves and returns to the read-only view with the new values", async () => {
    const updated: CustomerAccount = {
      ...sampleAccount,
      contactInfo: { ...sampleAccount.contactInfo, givenName: "Alicia" },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));
    fetchMock.mockResolvedValueOnce(jsonResponse(updated));
    const user = userEvent.setup();

    render(<CustomerProfile />);
    await screen.findByRole("region", { name: "Contact information" });
    await user.click(screen.getByRole("button", { name: "Edit profile" }));

    const form = screen.getByRole("form", { name: "Edit profile" });
    const firstName = within(form).getByLabelText("First name");
    await user.clear(firstName);
    await user.type(firstName, "Alicia");
    await user.click(within(form).getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.queryByRole("form", { name: "Edit profile" })).not.toBeInTheDocument();
    });
    const card = screen.getByRole("region", { name: "Contact information" });
    expect(within(card).getByRole("group", { name: "First name" }).textContent).toContain("Alicia");

    const putCall = fetchMock.mock.calls[1];
    expect(putCall[0]).toBe("/api/customer");
    expect(putCall[1]).toMatchObject({ method: "PUT" });
    const body = JSON.parse(putCall[1].body as string);
    expect(body.contactInfo.givenName).toBe("Alicia");
  });

  it("PT-07: a full card number typed on save is shown as only its last four digits on re-edit", async () => {
    const noCardYet: CustomerAccount = {
      ...sampleAccount,
      card: { cardType: null, expiryDate: null, lastFour: null },
    };
    const afterSave: CustomerAccount = {
      ...sampleAccount,
      card: { cardType: null, expiryDate: null, lastFour: "1234" },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(noCardYet));
    fetchMock.mockResolvedValueOnce(jsonResponse(afterSave));
    const user = userEvent.setup();

    render(<CustomerProfile />);
    await screen.findByRole("region", { name: "Contact information" });
    await user.click(screen.getByRole("button", { name: "Edit profile" }));

    const cardNumber = screen.getByLabelText("Card number");
    await user.type(cardNumber, "4111111111111234");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(screen.queryByRole("form", { name: "Edit profile" })).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    expect(screen.getByLabelText("Card number")).toHaveValue("1234");
  });

  it("PT-08: a validation error from the server is shown and the form stays open", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Unsupported language: fr_FR" }, { ok: false, status: 400 }),
    );
    const user = userEvent.setup();

    render(<CustomerProfile />);
    await screen.findByRole("region", { name: "Contact information" });
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported language: fr_FR");
    expect(screen.getByRole("form", { name: "Edit profile" })).toBeInTheDocument();
  });

  it("PT-09: sets the document's lang attribute from the fetched profile", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(sampleAccount));

    render(<CustomerProfile />);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ja_JP");
    });
  });
});
