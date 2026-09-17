import { expect, test, type Page } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The administrator's whole approval path (PLAN.md step 9), the last
 * ticket in the sprint: sign on as an administrator, reach the approval
 * screen from the admin home link this sprint added, select three pending
 * orders, Approve, Commit, and see all three gone from the pending list
 * and present as APPROVED on the read-only /admin/orders. Component-level
 * cover for selection, the bulk actions, and the commit request body
 * already exists (src/pages/admin/orders-approval.test.tsx) — this file is
 * for what only a real browser + server round trip can show: the
 * navigation chain, the real order rows, and the real commit request
 * together, against the file-backed dev database (db/client.ts).
 *
 * Three PENDING orders are created here, not read from the seed data —
 * db/client.ts seeds only one PENDING order, not three, and this journey
 * needs three of its own to bulk-approve. Each is placed directly through
 * POST /api/order (order/order.ts's placeOrder), the same route
 * e2e/order.spec.ts's UI journey ends at, skipping the multi-page
 * checkout/payment UI — that journey is already covered there, and this
 * file's subject is the approval screen, not order placement. A fresh
 * account's profile defaults to en_US (account/customer.ts), whose
 * auto-approval threshold is $500 (order/approval.ts); BIRDS-PARROTS-1
 * lists at $599.99 (catalog/seed.ts), so one unit already prices the order
 * above the threshold and it is placed PENDING.
 *
 * Same uniqueness rule as e2e/order.spec.ts's uniqueUsername: derived from
 * Date.now(), not a fixed string, so a second run against the same
 * file-backed sqlite.db never collides on auth_users' primary key.
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

const ADDRESS = {
  givenName: "Priya",
  familyName: "Nair",
  streetName1: "220 Foster Ave",
  city: "Chicago",
  state: "Illinois",
  zipCode: "60614",
  country: "USA",
  telephone: "312-555-0148",
  email: "priya.nair@example.com",
};

// page.request shares the page's own cookie jar (e2e/order.spec.ts's
// pattern) — create-user signs the session on directly, so no separate
// sign-in step is needed for the shopper half of this journey.
async function signOnShopper(page: Page, username: string): Promise<void> {
  const response = await page.request.post("/api/signon/create-user", {
    data: { j_username: username, j_password: "secret123", j_password_2: "secret123" },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).created).toBe(true);
}

async function placePendingOrder(page: Page): Promise<number> {
  const cartResponse = await page.request.post("/api/cart", {
    data: { itemId: ITEM_ID, quantity: 1 },
  });
  expect(cartResponse.ok()).toBe(true);

  const orderResponse = await page.request.post("/api/order", {
    data: { billingAddress: ADDRESS, shippingAddress: ADDRESS },
  });
  expect(orderResponse.ok()).toBe(true);
  const result = (await orderResponse.json()) as { orderId: number };
  return result.orderId;
}

async function signOnAdmin(page: Page): Promise<void> {
  await page.goto("/admin/signon");
  const signInForm = page.getByRole("form", { name: "Administrator sign in" });
  await signInForm.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("Administrator — order approval journey", () => {
  test("selects three pending orders, approves and commits them, and sees them move to APPROVED", async ({
    page,
  }) => {
    await signOnShopper(page, uniqueUsername("approval-shopper"));
    const orderIds = [
      await placePendingOrder(page),
      await placePendingOrder(page),
      await placePendingOrder(page),
    ];

    await signOnAdmin(page);
    await page.getByRole("button", { name: "Review Pending Orders" }).click();

    await expect(page).toHaveURL(/\/admin\/orders-approval$/);
    await expect(page.getByRole("heading", { name: "Orders Approval" })).toBeVisible();

    for (const orderId of orderIds) {
      await page.getByRole("checkbox", { name: `Select order ${orderId}` }).check();
    }

    await page.getByRole("button", { name: "Approve" }).click();
    for (const orderId of orderIds) {
      await expect(page.getByRole("button", { name: `Status for order ${orderId}` })).toHaveText(
        "APPROVED",
      );
    }

    await page.getByRole("button", { name: "Commit" }).click();

    // All three leave the pending view once the commit succeeds (PLAN.md
    // step 7 — the list is refreshed from the server, not assumed).
    for (const orderId of orderIds) {
      await expect(
        page.getByRole("button", { name: `Status for order ${orderId}` }),
      ).not.toBeVisible();
    }

    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
    for (const orderId of orderIds) {
      const row = page
        .getByRole("row")
        .filter({ has: page.getByRole("cell", { name: String(orderId), exact: true }) });
      await expect(row.getByText("APPROVED")).toBeVisible();
    }
  });
});
