import { expect, test, type Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The administrator's browser path across both supplier screens, plus the
 * fulfilment run's idempotence — the property that makes a retry safe
 * (design.md § Spec discrepancies S11; § Decisions D3). Unit/component
 * cover for each piece already exists (fulfillment/*.test.ts,
 * routes/api/fulfillment/process.post.test.ts,
 * routes/api/supplier/inventory/*.test.ts, src/pages/supplier/*.test.tsx)
 * — this file is for the real navigation chain and the real server round
 * trip those can't observe, mirroring e2e/admin.spec.ts's shape (it already
 * signs in as the seeded administrator and drives the admin screens).
 *
 * Runs against the file-backed development database and its seed
 * (design.md § Codebase findings F14): the catalogue and its starting
 * inventory (100 per item) already exist, so this file signs in as the
 * seeded jps_admin/admin account rather than creating one, and reads the
 * "existing quantity" a row shows from the screen itself before deriving
 * the new value — never a hardcoded figure a previous run could have
 * changed (PLAN.md step 7).
 */
const ITEM_ID = "BIRDS-PARROTS-1";
const OTHER_ITEM_ID = "BIRDS-FINCHES-1";

async function signOnAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post("/api/signon", {
    data: { j_username: "jps_admin", j_password: "admin" },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).signedOn).toBe(true);
}

test.describe("Supplier — inventory update journey", () => {
  test("signs in, reaches the inventory screen from the supplier home, and updates one ticked row", async ({
    page,
  }) => {
    await page.goto("/admin/signon");
    const signInForm = page.getByRole("form", { name: "Administrator sign in" });
    await signInForm.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    // No in-app link from /admin to /supplier — the two are separate
    // capabilities under the same administrator role (design.md D1).
    await page.goto("/supplier");
    await expect(page.getByRole("heading", { name: "Supplier" })).toBeVisible();

    await page.getByRole("button", { name: "Display Inventory" }).click();
    await expect(page).toHaveURL(/\/supplier\/inventory$/);
    await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();

    await expect(page.getByRole("columnheader")).toHaveText([
      "Item ID",
      "Existing quantity",
      "New quantity",
      "Update",
    ]);

    const targetRow = page.getByRole("row", { name: new RegExp(ITEM_ID) });
    const otherRow = page.getByRole("row", { name: new RegExp(OTHER_ITEM_ID) });

    const existingQuantityText = await targetRow.getByRole("cell").nth(1).textContent();
    const newQuantity = Number(existingQuantityText) + 1;
    const otherExistingBefore = await otherRow.getByRole("cell").nth(1).textContent();

    await page
      .getByRole("textbox", { name: `New quantity for ${ITEM_ID}` })
      .fill(String(newQuantity));
    await page.getByRole("checkbox", { name: `Update ${ITEM_ID}` }).check();
    await page.getByRole("button", { name: "Update Inventory" }).click();

    // The ticked row shows the new figure; the untouched row is unchanged
    // (D9 — only ticked rows are written).
    await expect(targetRow.getByRole("cell").nth(1)).toHaveText(String(newQuantity));
    await expect(otherRow.getByRole("cell").nth(1)).toHaveText(otherExistingBefore ?? "");
  });
});

test.describe("Supplier — fulfilment run", () => {
  test("a fulfillable order answers with an invoice, and a second identical request answers with none and changes nothing", async ({
    page,
  }) => {
    // jps_admin is a signed-on user like any other — placing an order only
    // requires a session (order/order.ts's placeOrder does not check
    // role), so one session carries both the shopper steps below and the
    // admin-only fulfilment/inventory calls that follow.
    await signOnAsAdmin(page);

    const addToCart = await page.request.post("/api/cart", {
      data: { itemId: ITEM_ID, quantity: 1 },
    });
    expect(addToCart.ok()).toBe(true);

    const address = {
      givenName: "Jamie",
      familyName: "Rivera",
      streetName1: "500 Fulfilment Way",
      city: "Austin",
      state: "Texas",
      zipCode: "73301",
      country: "USA",
      telephone: "512-555-0100",
      email: "jamie.rivera@example.com",
    };
    const orderResponse = await page.request.post("/api/order", {
      data: { billingAddress: address, shippingAddress: address },
    });
    expect(orderResponse.ok()).toBe(true);
    const { orderId } = (await orderResponse.json()) as { orderId: number };

    const firstRun = await page.request.post("/api/fulfillment/process", {
      data: { orderId },
    });
    expect(firstRun.ok()).toBe(true);
    const firstResult = (await firstRun.json()) as { invoice: string | null; status: string };
    expect(firstResult.invoice).not.toBeNull();

    const inventoryAfterFirst = await inventoryQuantity(page, ITEM_ID);

    const secondRun = await page.request.post("/api/fulfillment/process", {
      data: { orderId },
    });
    expect(secondRun.ok()).toBe(true);
    const secondResult = (await secondRun.json()) as { invoice: string | null; status: string };

    // Nothing retries automatically; what makes re-issuing the request
    // safe is that the second pass skips the line it already shipped
    // (design.md D3) — no invoice, no status change, no further deduction.
    expect(secondResult.invoice).toBeNull();
    expect(secondResult.status).toBe(firstResult.status);
    expect(await inventoryQuantity(page, ITEM_ID)).toBe(inventoryAfterFirst);
  });
});

async function inventoryQuantity(page: Page, itemid: string): Promise<number> {
  const response = await page.request.get("/api/supplier/inventory");
  const { items } = (await response.json()) as { items: { itemid: string; quantity: number }[] };
  const row = items.find((i) => i.itemid === itemid);
  if (!row) {
    throw new Error(`test bug: ${itemid} not present in /api/supplier/inventory`);
  }
  return row.quantity;
}
