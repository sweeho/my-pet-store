import { expect, test, type Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The order-placement journey only a real browser + server round trip can
 * show: a signed-on shopper going from a populated cart, through the entry
 * point this sprint added to /cart, to a confirmed order — plus the two
 * ways a submission is refused. Every single behaviour here already has
 * unit-tier cover in the ticket that implemented it (order/validation.ts,
 * order/order.ts, order/errors.ts, routes/api/order/*.test.ts,
 * src/pages/enter-order-information.test.tsx,
 * src/pages/order-completed.test.tsx) — this file exists only for the real
 * navigation and the real order-id sequence those can't observe
 * (design.md § Spec discrepancies S12).
 *
 * Never asserts the literal order id 1001: that value is only reproducible
 * against an empty `orders` table, and this suite runs against a seeded
 * development database (design.md § Spec discrepancies S2). It asserts an
 * identifier is shown, and that a second order receives a higher one.
 *
 * The dev server here is file-backed (not the in-memory Vitest db) and
 * fullyParallel is on, so every test signs on as its own username derived
 * from Date.now(), matching e2e/signon.spec.ts and
 * e2e/customer-profile.spec.ts.
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

// page.request shares the page's own cookie jar (e2e/customer-profile.spec.ts's
// pattern), and create-user signs the session on directly
// (routes/api/signon/create-user.post.ts calls setSignedOn) — no separate
// sign-in step is needed.
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

// The entry point is part of the journey (design.md § Codebase findings
// F13 — nothing linked to checkout before this sprint), so every test
// reaches the form through /cart's own control rather than by navigating
// straight to the URL.
async function reachCheckoutForm(page: Page): Promise<void> {
  await page.goto("/cart");
  await page.getByRole("link", { name: "Proceed to Checkout" }).click();
  await expect(page).toHaveURL(/\/enter-order-information$/);
}

async function submitOrderForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Submit Order" }).click();
}

function orderIdFrom(ariaLabel: string): number {
  const match = /(\d+)$/.exec(ariaLabel);
  if (!match) throw new Error(`test bug: "${ariaLabel}" does not end in a number`);
  return Number(match[1]);
}

test.describe("Order placement journey", () => {
  test("places an order from a populated cart reached through /cart's control, confirms it with an order id and the shopper's email, empties the cart, and gives a second order a higher id", async ({
    page,
  }) => {
    await signOn(page, uniqueUsername("order"));

    await addItemToCart(page);
    await reachCheckoutForm(page);
    await fillAddress(page, "Billing Information", BILLING);
    await fillAddress(page, "Shipping Information", SHIPPING);
    await submitOrderForm(page);

    await expect(page).toHaveURL(/\/order-completed$/);
    const firstIdBlock = page.getByRole("group", { name: /^Your order Id is \d+$/ });
    await expect(firstIdBlock).toBeVisible();
    const firstOrderId = orderIdFrom((await firstIdBlock.getAttribute("aria-label"))!);
    await expect(page.getByText(BILLING.email)).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByText("Your Shopping Cart is Empty.")).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);

    // A second order gets a higher id than the first — never the literal
    // 1001, which only holds against an empty orders table.
    await addItemToCart(page);
    await reachCheckoutForm(page);
    await fillAddress(page, "Billing Information", BILLING);
    await fillAddress(page, "Shipping Information", SHIPPING);
    await submitOrderForm(page);

    await expect(page).toHaveURL(/\/order-completed$/);
    const secondIdBlock = page.getByRole("group", { name: /^Your order Id is \d+$/ });
    await expect(secondIdBlock).toBeVisible();
    const secondOrderId = orderIdFrom((await secondIdBlock.getAttribute("aria-label"))!);
    expect(secondOrderId).toBeGreaterThan(firstOrderId);
  });

  test("submitting the order form with an empty cart lands the shopper on /cart with the empty-cart message", async ({
    page,
  }) => {
    await signOn(page, uniqueUsername("order-empty"));
    await addItemToCart(page);
    await reachCheckoutForm(page);

    // The cart empties between reaching the form and submitting it — as if
    // another tab cleared it — so it is the server's guard that refuses
    // this, not a client-side check the form never performs.
    const deleteResponse = await page.request.delete(`/api/cart/items/${ITEM_ID}`);
    expect(deleteResponse.ok()).toBe(true);

    await fillAddress(page, "Billing Information", BILLING);
    await fillAddress(page, "Shipping Information", SHIPPING);
    await submitOrderForm(page);

    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByText("Your shopping cart is empty. Please add items before ordering."),
    ).toBeVisible();
  });

  test("a refused submission for an invalid field shows the error against that input, not only a page-level message", async ({
    page,
  }) => {
    await signOn(page, uniqueUsername("order-bad"));
    await addItemToCart(page);
    await reachCheckoutForm(page);

    await fillAddress(page, "Billing Information", BILLING);
    await fillAddress(page, "Shipping Information", { ...SHIPPING, email: "not-an-email" });
    await submitOrderForm(page);

    await expect(page).toHaveURL(/\/enter-order-information$/);
    const shippingEmail = page
      .getByRole("region", { name: "Shipping Information" })
      .getByLabel("Email");
    await expect(shippingEmail).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Shipping email must be a valid email address.")).toBeVisible();
  });
});
