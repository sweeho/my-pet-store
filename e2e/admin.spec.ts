import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The administrator's browser path: sign in at the dedicated admin login
 * screen, reach the admin home, follow the Launch Rich Client control into
 * the orders screen, and see the read-only table with its five columns.
 * Component-level cover for the screens themselves already exists
 * (src/pages/admin/*.test.tsx) — this file is for what only a real browser
 * + server round trip can show: the navigation chain and the rendered DOM
 * together, against the file-backed dev database and its seeded
 * jps_admin/admin account and demo orders (db/client.ts).
 *
 * SWHM-T-0123 extends this file with the denial paths (no session, wrong
 * role) in a second describe block — this one is left intact for that.
 */
test.describe("Administrator — orders view", () => {
  test("signs in, launches the rich client, and sees the read-only orders table", async ({
    page,
  }) => {
    await page.goto("/admin/signon");

    const signInForm = page.getByRole("form", { name: "Administrator sign in" });
    await signInForm.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();

    await page.getByRole("button", { name: "Launch Rich Client" }).click();

    await expect(page).toHaveURL(/\/admin\/orders$/);
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

    await expect(page.getByRole("columnheader")).toHaveText([
      "Order ID",
      "User ID",
      "Order Date",
      "Order Amount",
      "Status",
    ]);
  });
});
