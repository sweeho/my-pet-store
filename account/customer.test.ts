import { describe, expect, it } from "vitest";

import { createCustomer, findAccount, getAccountOrDefaults, updateAccount } from "./customer";

describe("account/customer", () => {
  it("CU-01: creating a customer produces an account row with status active and a profile row", () => {
    const account = createCustomer("alice");

    expect(account.status).toBe("active");
    expect(account.profile).toBeDefined();
  });

  it("CU-02: a newly created profile has the spec's defaults", () => {
    const account = createCustomer("bob");

    expect(account.profile).toEqual({
      preferredLanguage: "en_US",
      favoriteCategory: null,
      myListPreference: true,
      bannerPreference: true,
    });
  });

  it("CU-03: getAccountOrDefaults returns defaults for an unknown user", () => {
    const account = getAccountOrDefaults("nobody");

    expect(account).toEqual({
      userName: "nobody",
      status: "active",
      contactInfo: { givenName: null, familyName: null, telephone: null, email: null },
      address: {
        streetName1: null,
        streetName2: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
      },
      card: { cardType: null, expiryDate: null, lastFour: null },
      profile: {
        preferredLanguage: "en_US",
        favoriteCategory: null,
        myListPreference: true,
        bannerPreference: true,
      },
    });
  });

  it("CU-04: findAccount returns undefined for an unknown user", () => {
    expect(findAccount("ghost")).toBeUndefined();
  });

  it("CU-05: updateAccount round-trips contact information and address", () => {
    createCustomer("carol");

    const updated = updateAccount("carol", {
      contactInfo: {
        givenName: "Carol",
        familyName: "Jones",
        telephone: "555-1234",
        email: "carol@example.com",
      },
      address: {
        streetName1: "1 Main St",
        streetName2: "Apt 2",
        city: "Springfield",
        state: "California",
        zipCode: "90210",
        country: "USA",
      },
    });

    expect(updated.contactInfo).toEqual({
      givenName: "Carol",
      familyName: "Jones",
      telephone: "555-1234",
      email: "carol@example.com",
    });
    expect(updated.address).toEqual({
      streetName1: "1 Main St",
      streetName2: "Apt 2",
      city: "Springfield",
      state: "California",
      zipCode: "90210",
      country: "USA",
    });
  });

  it("CU-06: updateAccount round-trips profile preferences", () => {
    createCustomer("dave");

    const updated = updateAccount("dave", {
      profile: {
        preferredLanguage: "zh_CN",
        favoriteCategory: "CATS",
        myListPreference: false,
        bannerPreference: false,
      },
    });

    expect(updated.profile).toEqual({
      preferredLanguage: "zh_CN",
      favoriteCategory: "CATS",
      myListPreference: false,
      bannerPreference: false,
    });
  });

  it("CU-07: updateAccount stores card type and expiry, and reduces a card number to its last four digits", () => {
    createCustomer("erin");

    const updated = updateAccount("erin", {
      card: { cardType: "Meow Card", expiryDate: "12/2025", cardNumber: "4111111111111234" },
    });

    expect(updated.card).toEqual({
      cardType: "Meow Card",
      expiryDate: "12/2025",
      lastFour: "1234",
    });
  });

  it("CU-08: stored card expiry parses back through account/card", async () => {
    createCustomer("frank");

    const updated = updateAccount("frank", { card: { expiryDate: "12/2025" } });
    const { expiryMonth, expiryYear } = await import("./card");

    expect(expiryMonth(updated.card.expiryDate)).toBe("12");
    expect(expiryYear(updated.card.expiryDate)).toBe("2025");
  });
});
