import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import type { CustomerAccount } from "../../../account/types";
import { createUser } from "../../../auth/authenticate";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../auth/session";
import getCustomer from "./index.get";
import updateCustomer from "./index.put";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/customer/index.get.test.ts, chaining PUT and
 * GET the way a real client would to prove an update round-trips through a subsequent
 * read (routes/api/signon/flows.test.ts does the same cross-endpoint chaining).
 */
function cookieValueOf(event: H3Event): string | undefined {
  const header = event.res.headers.get("set-cookie");
  return header?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function useSignedOnCookie(userName: string): string {
  const setup = new H3Event(new Request("http://localhost/api/customer"));
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup)!;
}

function getRequest(cookie?: string): H3Event {
  return new H3Event(
    new Request(
      "http://localhost/api/customer",
      cookie ? { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } } : undefined,
    ),
  );
}

function putRequest(body: unknown, cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/customer", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

// A signed-on read/update always resolves to the account shape, never the error
// shape — narrows the handlers' `CustomerAccount | { error: string }` union for
// assertions that reach into a specific field.
function asAccount(result: unknown): CustomerAccount {
  return result as CustomerAccount;
}

describe("PUT /api/customer", () => {
  it("PC-01: an update submitting contact information, address, card metadata and preferences is reflected in a subsequent read", async () => {
    createUser("carol", "secret123");
    const cookie = useSignedOnCookie("carol");

    const update = {
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
      card: { cardType: "Meow Card", expiryDate: "12/2025", cardNumber: "4111111111111234" },
      profile: {
        preferredLanguage: "ja_JP",
        favoriteCategory: "CATS",
        myListPreference: false,
        bannerPreference: false,
      },
    };

    const updateResult = asAccount(await updateCustomer(putRequest(update, cookie)));

    expect(updateResult.contactInfo).toEqual(update.contactInfo);
    expect(updateResult.address).toEqual(update.address);
    expect(updateResult.card).toEqual({
      cardType: "Meow Card",
      expiryDate: "12/2025",
      lastFour: "1234",
    });
    expect(updateResult.profile).toEqual(update.profile);

    const readResult = asAccount(await getCustomer(getRequest(cookie)));
    expect(readResult).toEqual(updateResult);
  });

  it("PC-02: an unauthenticated update is refused with 401 and no account data", async () => {
    const event = putRequest({ profile: { preferredLanguage: "ja_JP" } });

    const result = await updateCustomer(event);

    expect(event.res.status).toBe(401);
    expect(result).not.toHaveProperty("userName");
  });

  it("PC-03: a language outside the supported vocabulary is rejected with a descriptive message and leaves the stored preference unchanged", async () => {
    createUser("dave", "secret123");
    const cookie = useSignedOnCookie("dave");

    const result = await updateCustomer(
      putRequest({ profile: { preferredLanguage: "fr_FR" } }, cookie),
    );

    expect(result).toEqual({ error: "Unsupported language: fr_FR" });

    const read = asAccount(await getCustomer(getRequest(cookie)));
    expect(read.profile.preferredLanguage).toBe("en_US");
  });

  it("PC-04: a category outside the supported vocabulary is rejected with a descriptive message and leaves the stored preference unchanged", async () => {
    createUser("erin", "secret123");
    const cookie = useSignedOnCookie("erin");

    const result = await updateCustomer(
      putRequest({ profile: { favoriteCategory: "LIZARDS" } }, cookie),
    );

    expect(result).toEqual({ error: "Unsupported category: LIZARDS" });

    const read = asAccount(await getCustomer(getRequest(cookie)));
    expect(read.profile.favoriteCategory).toBeNull();
  });

  it("PC-05: one customer's update never alters another customer's stored account", async () => {
    createUser("frank", "secret123");
    createUser("grace", "secret123");
    const frankCookie = useSignedOnCookie("frank");
    const graceCookie = useSignedOnCookie("grace");

    await updateCustomer(
      putRequest(
        { contactInfo: { givenName: "Frank", familyName: null, telephone: null, email: null } },
        frankCookie,
      ),
    );

    const graceRead = asAccount(await getCustomer(getRequest(graceCookie)));
    expect(graceRead.contactInfo.givenName).toBeNull();
  });
});
