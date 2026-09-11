import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { createUser } from "../../../auth/authenticate";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../auth/session";
import getCustomer from "./index.get";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/signon/session.get.test.ts. A signed-on
 * session is built by driving auth/session.ts directly (setSignedOn), then replaying
 * its Set-Cookie header on a fresh request — a second useSignOnSession(event) call on
 * the same request has no cookie to read and would create an unrelated session.
 */
function cookieValueOf(event: H3Event): string | undefined {
  const header = event.res.headers.get("set-cookie");
  return header?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

// Named `use...` per eslint-plugin-react-hooks: it calls the useSignOnSession hook,
// so it must itself read as a custom hook rather than a plain helper function.
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

describe("GET /api/customer", () => {
  it("GC-01: a signed-on customer receives contact information, address, card metadata and preferences in one response", async () => {
    createUser("alice", "secret123");

    const result = await getCustomer(getRequest(useSignedOnCookie("alice")));

    expect(result).toEqual({
      userName: "alice",
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

  it("GC-02: a customer with no account row yet receives profile defaults rather than an error", async () => {
    const result = await getCustomer(getRequest(useSignedOnCookie("no-rows-yet")));

    expect(result).toEqual({
      userName: "no-rows-yet",
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

  it("GC-03: a request with no signed-on session is refused with 401 and no account data", async () => {
    const event = getRequest();

    const result = await getCustomer(event);

    expect(event.res.status).toBe(401);
    expect(result).not.toHaveProperty("userName");
  });
});
