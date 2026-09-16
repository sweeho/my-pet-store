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

// Same uniqueness rule as e2e/signon.spec.ts's uniqueUsername: derived from
// Date.now(), not a fixed string, so a second run against the same
// file-backed sqlite.db never collides on auth_users' primary key.
function uniqueUsername(label: string): string {
  const username = `${label}-${Date.now()}`;
  if (username.length > 25) {
    throw new Error(
      `test bug: username "${username}" exceeds MAX_USERID_LENGTH (25) — shorten label`,
    );
  }
  return username;
}

test.describe("Administrator — access denial", () => {
  test("an anonymous visit to /admin/orders reaches the sign-on screen, not the table", async ({
    page,
  }) => {
    await page.goto("/admin/orders");

    await expect(page).toHaveURL(/\/signon$/);
    await expect(page.getByRole("heading", { name: "Orders" })).not.toBeVisible();
  });

  test("a signed-on non-administrator is refused at /admin, not bounced back to sign on", async ({
    page,
    request,
  }) => {
    const username = uniqueUsername("plain");
    const password = "secret123";

    const createResponse = await request.post("/api/signon/create-user", {
      data: { j_username: username, j_password: password, j_password_2: password },
    });
    expect(createResponse.ok()).toBe(true);
    expect((await createResponse.json()).created).toBe(true);

    await page.goto("/signon");
    const signInForm = page.getByRole("form", { name: "Sign in" });
    await signInForm.getByLabel("Username").fill(username);
    await signInForm.getByLabel("Password", { exact: true }).fill(password);
    await signInForm.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/signon-welcome$/);

    await page.goto("/admin");

    // A redirect back to sign-on here would loop for someone already signed
    // on (design.md D3) — the refusal renders in place instead.
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("signing in at /admin/signon with wrong credentials lands on /admin/signon-failed, with a way back", async ({
    page,
  }) => {
    await page.goto("/admin/signon");

    const signInForm = page.getByRole("form", { name: "Administrator sign in" });
    await signInForm.getByLabel("Username").fill("jps_admin");
    await signInForm.getByLabel("Password").fill("definitely-wrong");
    await signInForm.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/admin\/signon-failed$/);
    await expect(page.getByRole("heading", { name: "Sign In Failed" })).toBeVisible();

    await page.getByRole("link", { name: "← Back to sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/signon$/);
  });
});
