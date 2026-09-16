import { expect, test, type Page } from "@playwright/test";

import { CARD_TYPES } from "../account/vocabulary";

/**
 * UI / E2E TEST
 *
 * The payment journey only a real browser + server round trip can show:
 * approval, the in-flight submit, a per-field validation refusal, and a
 * processor decline. Every decision here already has unit/screen-tier cover
 * (payment/expiry.test.ts, payment/validation.test.ts, payment/authorize.test.ts,
 * payment/processor.test.ts, routes/api/payment/authorize.post.test.ts,
 * src/pages/payment.test.tsx, including its own deterministic State B case
 * PAY-09) — this file exists only for the real navigation, the real
 * `/api/payment/authorize` round trip, and the real order (not) placed that
 * those can't observe (design.md § Decisions D5, D6; PLAN.md step 1).
 *
 * Self-contained rather than importing from e2e/order.spec.ts: that file
 * belongs to SWHM-T-0177 and isn't touched here, and no shared e2e helpers
 * module exists in this repository — every spec file (order.spec.ts,
 * customer-profile.spec.ts, …) duplicates its own setup, which this mirrors.
 *
 * fullyParallel is on, so every test signs on as its own username derived
 * from Date.now(), matching every other e2e spec.
 */
const ITEM_ID = "BIRDS-PARROTS-1";

function uniqueUsername(label: string): string {
  const username = `${label}-${Date.now()}`;
  if (username.length > 25) {
    throw new Error(
      `test bug: username "${username}" exceeds MAX_USERID_LENGTH (25) — shorten label`,
    );
  }
  return username;
}

async function signOn(page: Page, username: string): Promise<void> {
  const response = await page.request.post("/api/signon/create-user", {
    data: { j_username: username, j_password: "secret123", j_password_2: "secret123" },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).created).toBe(true);
}

async function addItemToCart(page: Page): Promise<void> {
  const response = await page.request.post("/api/cart", { data: { itemId: ITEM_ID, quantity: 1 } });
  expect(response.ok()).toBe(true);
}

type Address = {
  givenName: string;
  familyName: string;
  streetName1: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  telephone: string;
  email: string;
};

const BILLING: Address = {
  givenName: "Maya",
  familyName: "Chen",
  streetName1: "1150 Alder Street",
  city: "San Francisco",
  state: "California",
  zipCode: "94117",
  country: "USA",
  telephone: "415-555-0132",
  email: "maya.chen@example.com",
};

const SHIPPING: Address = {
  givenName: "Maya",
  familyName: "Chen",
  streetName1: "88 Junction Row",
  city: "Brooklyn",
  state: "New York",
  zipCode: "11222",
  country: "USA",
  telephone: "718-555-0117",
  email: "maya.chen+ship@example.com",
};

async function fillAddress(page: Page, regionName: string, address: Address): Promise<void> {
  const region = page.getByRole("region", { name: regionName });
  await region.getByLabel("First name").fill(address.givenName);
  await region.getByLabel("Last name").fill(address.familyName);
  await region.getByLabel("Street address line 1").fill(address.streetName1);
  await region.getByLabel("City").fill(address.city);
  await region.getByRole("combobox", { name: "State / Province" }).selectOption(address.state);
  await region.getByLabel("Postal code").fill(address.zipCode);
  await region.getByRole("combobox", { name: "Country" }).selectOption(address.country);
  await region.getByLabel("Telephone").fill(address.telephone);
  await region.getByLabel("Email").fill(address.email);
}

async function reachPaymentStep(page: Page): Promise<void> {
  await page.goto("/cart");
  await page.getByRole("link", { name: "Proceed to Checkout" }).click();
  await expect(page).toHaveURL(/\/enter-order-information$/);
  await fillAddress(page, "Billing Information", BILLING);
  await fillAddress(page, "Shipping Information", SHIPPING);
  await page.getByRole("button", { name: "Submit Order" }).click();
  await expect(page).toHaveURL(/\/payment$/);
}

type CardFields = {
  cardholderName: string;
  cardType: string; // "" leaves the select at its "— Select —" default
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
};

async function fillCardFields(page: Page, card: CardFields): Promise<void> {
  await page.getByLabel("Cardholder name").fill(card.cardholderName);
  if (card.cardType) {
    await page.getByRole("combobox", { name: "Card type" }).selectOption(card.cardType);
  }
  await page.getByLabel("Card number").fill(card.cardNumber);
  await page.getByRole("combobox", { name: "Expiry month" }).selectOption(card.expiryMonth);
  await page.getByRole("combobox", { name: "Expiry year" }).selectOption(card.expiryYear);
}

async function submitPayment(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Submit payment" }).click();
}

// payment.tsx's EXPIRY_YEARS starts at the current year (src/pages/payment.tsx), so
// index 0 of the select's options is the "— Select —" placeholder and index 1 is the
// earliest real, always-selectable year. waitFor() first: unlike selectOption(),
// allTextContents() does not auto-wait for the element to attach, so reading it right
// after a route navigation (before React has committed the payment form) can race and
// return an empty list.
async function expiryYearOptionTexts(page: Page): Promise<string[]> {
  const select = page.getByRole("combobox", { name: "Expiry year" });
  await select.waitFor();
  return select.locator("option").allTextContents();
}

async function firstExpiryYearOption(page: Page): Promise<string> {
  return (await expiryYearOptionTexts(page))[1];
}

async function lastExpiryYearOption(page: Page): Promise<string> {
  const years = await expiryYearOptionTexts(page);
  return years[years.length - 1];
}

// The Expiry year select never offers a year before the current one
// (payment.tsx's EXPIRY_YEARS), so the only expired date reachable through
// the real form is a past month within the current year.
function pastMonthInCurrentYear(): string {
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  if (currentMonth === 1) {
    throw new Error(
      "test bug: no past month exists in the current year during January — the " +
        "Expiry year select never offers a year before the current one, so an " +
        "expired card can't be reached through this form until February",
    );
  }
  return String(currentMonth - 1).padStart(2, "0");
}

function orderIdFrom(ariaLabel: string): number {
  const match = /(\d+)$/.exec(ariaLabel);
  if (!match) throw new Error(`test bug: "${ariaLabel}" does not end in a number`);
  return Number(match[1]);
}

async function cartItemCount(page: Page): Promise<number> {
  const response = await page.request.get("/api/cart");
  expect(response.ok()).toBe(true);
  const cart = (await response.json()) as { count: number };
  return cart.count;
}

test.describe("Payment journey", () => {
  test("an accepted card with a future expiry shows the in-flight state, then authorizes and confirms the order (AC-2, AC-3, AC-4)", async ({
    page,
  }) => {
    await signOn(page, uniqueUsername("pay-ok"));
    await addItemToCart(page);
    await reachPaymentStep(page);

    const year = await lastExpiryYearOption(page);
    await fillCardFields(page, {
      cardholderName: "Maya Chen",
      cardType: CARD_TYPES[0],
      cardNumber: "4111111111111111",
      expiryMonth: "12",
      expiryYear: year,
    });

    // Delays the real authorize request so State B is a guaranteed window,
    // not a timing race against a fast local round trip (PLAN.md step 6).
    await page.route("**/api/payment/authorize", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await submitPayment(page);

    const submitButton = page.getByRole("button", { name: "Authorizing…" });
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText("Authorizing payment…")).toBeVisible();

    await expect(page).toHaveURL(/\/order-completed$/);
    const idBlock = page.getByRole("group", { name: /^Your order Id is \d+$/ });
    await expect(idBlock).toBeVisible();
    expect(orderIdFrom((await idBlock.getAttribute("aria-label"))!)).toBeGreaterThan(0);
  });

  test("an unaccepted card type is refused against the card type field, and no order is placed (AC-3)", async ({
    page,
  }) => {
    await signOn(page, uniqueUsername("pay-type"));
    await addItemToCart(page);
    await reachPaymentStep(page);

    const year = await lastExpiryYearOption(page);
    await fillCardFields(page, {
      cardholderName: "Maya Chen",
      cardType: "", // left at "— Select —" — not one of this store's accepted types
      cardNumber: "4111111111111111",
      expiryMonth: "12",
      expiryYear: year,
    });
    await submitPayment(page);

    await expect(page).toHaveURL(/\/payment$/);
    await expect(page.getByText("Check the highlighted fields before submitting.")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Card type" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByText("Select an accepted card type.")).toBeVisible();
    expect(await cartItemCount(page)).toBe(1);
  });

  test("an expired card is refused against the expiry field naming the exact expiry, and no order is placed (AC-1)", async ({
    page,
  }) => {
    await signOn(page, uniqueUsername("pay-expired"));
    await addItemToCart(page);
    await reachPaymentStep(page);

    const expiredMonth = pastMonthInCurrentYear();
    const expiredYear = await firstExpiryYearOption(page);
    await fillCardFields(page, {
      cardholderName: "Maya Chen",
      cardType: CARD_TYPES[0],
      cardNumber: "4111111111111111",
      expiryMonth: expiredMonth,
      expiryYear: expiredYear,
    });
    await submitPayment(page);

    await expect(page).toHaveURL(/\/payment$/);
    const expiryLabel = `${expiredMonth}/${expiredYear}`;
    await expect(
      page.getByText(
        `Payment was not authorized: the card expired ${expiryLabel}. Enter a card with a future expiry date.`,
      ),
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Expiry month" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByText(`This card expired ${expiryLabel}.`)).toBeVisible();
    expect(await cartItemCount(page)).toBe(1);
  });

  test("a processor decline leaves the shopper on the payment screen with no order placed and no charge", async ({
    page,
  }) => {
    await signOn(page, uniqueUsername("pay-decline"));
    await addItemToCart(page);
    await reachPaymentStep(page);

    const year = await lastExpiryYearOption(page);
    await fillCardFields(page, {
      cardholderName: "Maya Chen",
      cardType: CARD_TYPES[0],
      // Ends in the stub processor's decline sentinel (payment/processor.ts's
      // DECLINED_LAST_FOUR) — otherwise a valid, accepted, unexpired card.
      cardNumber: "4111111111110002",
      expiryMonth: "12",
      expiryYear: year,
    });
    await submitPayment(page);

    await expect(page).toHaveURL(/\/payment$/);
    await expect(
      page.getByText(
        "Payment was not authorized. No order was placed and the card was not charged.",
      ),
    ).toBeVisible();
    expect(await cartItemCount(page)).toBe(1);
  });
});
