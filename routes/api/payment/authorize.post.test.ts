import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { createUser } from "../../../auth/authenticate";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../auth/session";
import authorizePayment from "./authorize.post";

/**
 * INTEGRATION TEST
 *
 * Same real-H3Event pattern as routes/api/order/index.post.test.ts.
 */
const VALID_CARD = {
  cardNumber: "4111111111111111",
  cardType: "Meow Card",
  cardholderName: "Jane Doe",
  expiryMonth: "09",
  expiryYear: "2030",
};

function cookieValueOf(event: H3Event): string | undefined {
  const header = event.res.headers.get("set-cookie");
  return header?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function useSignedOnCookie(userName: string): string {
  const setup = new H3Event(new Request("http://localhost/api/payment/authorize"));
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup)!;
}

function postRequest(body: unknown, cookie?: string): H3Event {
  return new H3Event(
    new Request("http://localhost/api/payment/authorize", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/payment/authorize", () => {
  it("AP-01: an unauthenticated submission is refused with 401", async () => {
    const event = postRequest(VALID_CARD);

    const result = await authorizePayment(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: "Not signed on" });
  });

  it("AP-02 (AC-1): a valid card from a signed-on shopper reaches the processor and is approved", async () => {
    createUser("ada", "secret123");
    const cookie = useSignedOnCookie("ada");

    const event = postRequest(VALID_CARD, cookie);
    const result = await authorizePayment(event);

    expect(event.res.status).not.toBe(400);
    expect(event.res.status).not.toBe(401);
    expect(result).toEqual({ status: "approved" });
  });

  it("AP-03: a card the stub processor declines is reported as declined, with a 200 (a business outcome, not a request error)", async () => {
    createUser("ben", "secret123");
    const cookie = useSignedOnCookie("ben");

    const event = postRequest({ ...VALID_CARD, cardNumber: "4000000000000002" }, cookie);
    const result = await authorizePayment(event);

    expect(event.res.status).not.toBe(400);
    expect(result).toEqual({ status: "declined" });
  });

  it("AP-04: an unrecognized card type is refused with 400, naming the field and the two messages authorizeCard produces", async () => {
    createUser("cora", "secret123");
    const cookie = useSignedOnCookie("cora");

    const event = postRequest({ ...VALID_CARD, cardType: "Visa" }, cookie);
    const result = await authorizePayment(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({
      error: "Select an accepted card type.",
      field: "cardType",
      alert: "Check the highlighted fields before submitting.",
    });
  });

  it("AP-05: an expired card is refused with 400 naming the expiry in both messages", async () => {
    createUser("drew", "secret123");
    const cookie = useSignedOnCookie("drew");

    const event = postRequest({ ...VALID_CARD, expiryMonth: "03", expiryYear: "2024" }, cookie);
    const result = await authorizePayment(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({
      error: "This card expired 03/2024.",
      field: "expiryMonth",
      alert:
        "Payment was not authorized: the card expired 03/2024. Enter a card with a future expiry date.",
    });
  });
});
