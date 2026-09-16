import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The shopper's whole cart journey in a real browser: add from the item
 * screen, edit and remove-via-zero on /cart, remove the last line to reach
 * the empty state, persistence across navigation, and reachability without
 * signing on. Component-level cover for each screen and each cart/route
 * function already exists at the unit tier (cart/cart.test.ts,
 * routes/api/cart/**\/*.test.ts, src/pages/cart.test.tsx) — this file exists
 * for what only a real browser + server round trip can show: real
 * navigation between the item screen and /cart, and the cart persisting
 * across that navigation via the session cookie.
 *
 * Uses BIRDS-PARROTS-1, the same seeded item e2e/catalog.spec.ts navigates
 * to — its unit_cost is 350.00, distinct from its list_price 599.99 the
 * item screen displays (design.md § Spec discrepancies S1); every subtotal
 * assertion below is against unit_cost, never the price shown on the item
 * screen. Each test gets its own browser context (Playwright's default),
 * so each one starts with its own session and an empty cart.
 */
const ITEM_ID = "BIRDS-PARROTS-1";
const ITEM_URL = `/catalog/item/${ITEM_ID}`;
const UNIT_COST = 350.0;

test.describe("Shopping cart journey", () => {
  test("adds an item from the item screen and finds it on /cart with the entered quantity", async ({
    page,
  }) => {
    await page.goto(ITEM_URL);
    await expect(page.getByRole("heading", { level: 1, name: "Parrots" })).toBeVisible();

    await page.getByRole("spinbutton", { name: "Quantity" }).fill("2");
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.getByRole("status", { name: "Add to cart status" })).toHaveText(
      "Added to cart.",
    );

    await page.goto("/cart");

    await expect(page.getByRole("spinbutton", { name: `Quantity for ${ITEM_ID}` })).toHaveValue(
      "2",
    );
    await expect(page.getByText(ITEM_ID)).toBeVisible();
  });

  test("edits a quantity, activates Update Cart, and finds the new quantity and a consistent subtotal", async ({
    page,
  }) => {
    const otherItemId = "BIRDS-FINCHES-1";
    const otherUnitCost = 12.0;
    await page.request.post("/api/cart", { data: { itemId: ITEM_ID, quantity: 1 } });
    await page.request.post("/api/cart", { data: { itemId: otherItemId, quantity: 1 } });
    await page.goto("/cart");

    const quantityInput = page.getByRole("spinbutton", { name: `Quantity for ${ITEM_ID}` });
    await quantityInput.fill("3");
    await page.getByRole("button", { name: "Update Cart" }).click();

    await expect(quantityInput).toHaveValue("3");
    // Two lines, deliberately: a subtotal equal to either line's own total
    // (single-item cart) can't disambiguate the two "$1,050.00" cells CI's
    // first real execution found — the line-total cell and the subtotal
    // both render it. Summing two distinct lines produces a subtotal no
    // single cell repeats. Matches src/pages/cart.tsx's own formatCurrency
    // exactly — a plain toFixed(2) omits the thousands separator
    // Intl.NumberFormat adds.
    const expectedSubtotal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(UNIT_COST * 3 + otherUnitCost);
    await expect(page.getByText(expectedSubtotal)).toBeVisible();
  });

  test("sets a quantity to 0, activates Update Cart, and finds that row gone from the table", async ({
    page,
  }) => {
    const otherItemId = "BIRDS-FINCHES-1";
    await page.request.post("/api/cart", { data: { itemId: ITEM_ID, quantity: 1 } });
    await page.request.post("/api/cart", { data: { itemId: otherItemId, quantity: 1 } });
    await page.goto("/cart");

    await page.getByRole("spinbutton", { name: `Quantity for ${ITEM_ID}` }).fill("0");
    await page.getByRole("button", { name: "Update Cart" }).click();

    await expect(page.getByRole("spinbutton", { name: `Quantity for ${ITEM_ID}` })).toHaveCount(0);
    await expect(
      page.getByRole("spinbutton", { name: `Quantity for ${otherItemId}` }),
    ).toBeVisible();
  });

  test("removes the last remaining line and finds the empty-cart message with no table", async ({
    page,
  }) => {
    await page.request.post("/api/cart", { data: { itemId: ITEM_ID, quantity: 1 } });
    await page.goto("/cart");

    await page.getByRole("button", { name: "Remove" }).click();

    await expect(page.getByText("Your Shopping Cart is Empty.")).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
  });

  test("persists across navigation to another page and back to /cart", async ({ page }) => {
    await page.request.post("/api/cart", { data: { itemId: ITEM_ID, quantity: 2 } });
    await page.goto("/cart");
    await expect(page.getByRole("spinbutton", { name: `Quantity for ${ITEM_ID}` })).toHaveValue(
      "2",
    );

    await page.goto("/catalog");
    await expect(page.getByRole("heading", { level: 1, name: "Catalog" })).toBeVisible();

    await page.goto("/cart");

    await expect(page.getByRole("spinbutton", { name: `Quantity for ${ITEM_ID}` })).toHaveValue(
      "2",
    );
  });
});

test.describe("Shopping cart — anonymous access", () => {
  test("reaches /cart without signing on and is served the cart, not redirected to sign-on", async ({
    page,
  }) => {
    await page.goto("/cart");

    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("heading", { level: 1, name: "Shopping Cart" })).toBeVisible();
  });
});
