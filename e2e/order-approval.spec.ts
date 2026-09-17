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
 * POST /api/order (order/order.ts's placeOrder) as jps_admin itself:
 * placeOrder does not check role (e2e/fulfillment.spec.ts's own comment and
 * proven pattern — "one session carries both the shopper steps ... and the
 * admin-only calls that follow"), so this needs no separate shopper session
 * and no session handoff. jps_admin carries no profile row, so
 * order/order.ts's resolvePlacementLocale resolves a null locale, and
 * order/approval.ts's decideApproval defaults a null locale to PENDING
 * regardless of amount — the order lands PENDING either way BIRDS-PARROTS-1
 * ($599.99, catalog/seed.ts) also clears the en_US $500 threshold on its
 * own, so this holds even if that ever changes.
 */
const ITEM_ID = "BIRDS-PARROTS-1";

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

// e2e/fulfillment.spec.ts's own signOnAsAdmin, restated here rather than
// imported — e2e specs in this project do not share helper modules.
async function signOnAsAdmin(page: Page): Promise<void> {
  const response = await page.request.post("/api/signon", {
    data: { j_username: "jps_admin", j_password: "admin" },
  });
  expect(response.ok()).toBe(true);
  expect((await response.json()).signedOn).toBe(true);
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

test.describe("Administrator — order approval journey", () => {
  test("selects three pending orders, approves and commits them, and sees them move to APPROVED", async ({
    page,
  }) => {
    await signOnAsAdmin(page);
    const orderIds = [
      await placePendingOrder(page),
      await placePendingOrder(page),
      await placePendingOrder(page),
    ];

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
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
