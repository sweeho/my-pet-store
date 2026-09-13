import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Proves what no jsdom test can reach for the catalog locale: a choice
 * surviving a reload, travelling across a client-side navigation, following
 * a signed-on customer into a second browser context, and an untranslated
 * drill-in being distinguishable from a broken link. Boxes 5.1-5.4's
 * per-locale catalogue queries and the missing-locale-returns-null case
 * already have data-layer cover (catalog/item.test.ts, catalog/query.test.ts,
 * catalog/performance.test.ts) — this file is deliberately not a fourth copy
 * of those. Locate every control by role and accessible name, as every other
 * e2e/ spec does, never by class name or DOM shape.
 */
function uniqueUsername(label: string): string {
  const username = `${label}-${Date.now()}`;
  if (username.length > 25) {
    throw new Error(
      `test bug: username "${username}" exceeds MAX_USERID_LENGTH (25) — shorten label`,
    );
  }
  return username;
}

test.describe("Catalog locale", () => {
  test("a visitor's language choice on /catalog survives a reload and travels to a category screen", async ({
    page,
  }) => {
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { level: 1, name: "Catalog" })).toBeVisible();

    await page.getByRole("button", { name: /English \(US\)/ }).click();
    await page.getByRole("menuitem", { name: /日本語/ }).click();

    const categories = page.getByRole("region", { name: "Categories" });
    await expect(categories.getByRole("link", { name: "犬" })).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("region", { name: "Categories" }).getByRole("link", { name: "犬" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "犬" }).click();
    await expect(page).toHaveURL(/\/catalog\/category\/DOGS$/);
    await expect(page.getByRole("heading", { level: 1, name: "犬" })).toBeVisible();
  });

  test("a signed-on customer's chosen locale is stored in the profile and follows them into a fresh browser context", async ({
    page,
    browser,
  }) => {
    const username = uniqueUsername("lang-prof");
    const password = "secret123";

    // page.request shares the page's own cookie jar, so the session this
    // creates is the one /catalog navigates with next (e2e/catalog.spec.ts,
    // e2e/customer-profile.spec.ts use the same pattern).
    const createResponse = await page.request.post("/api/signon/create-user", {
      data: { j_username: username, j_password: password, j_password_2: password },
    });
    expect(createResponse.ok()).toBe(true);

    await page.goto("/catalog");
    await page.getByRole("button", { name: /English \(US\)/ }).click();
    await page.getByRole("menuitem", { name: /日本語/ }).click();

    await expect(
      page.getByRole("region", { name: "Categories" }).getByRole("link", { name: "犬" }),
    ).toBeVisible();

    const profileResponse = await page.request.get("/api/customer");
    expect(profileResponse.ok()).toBe(true);
    expect((await profileResponse.json()).profile.preferredLanguage).toBe("ja_JP");

    // A second, unrelated browser context has no cookie jar in common with
    // the first — the only way to prove the choice followed the account
    // rather than the browser.
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();
    await freshPage.goto("/signon");
    const signInForm = freshPage.getByRole("form", { name: "Sign in" });
    await signInForm.getByLabel("Username").fill(username);
    await signInForm.getByLabel("Password", { exact: true }).fill(password);
    await signInForm.getByRole("button", { name: "Sign In" }).click();
    await expect(freshPage).toHaveURL(/\/signon-welcome$/);

    await freshPage.goto("/catalog");
    await expect(
      freshPage.getByRole("region", { name: "Categories" }).getByRole("link", { name: "犬" }),
    ).toBeVisible();

    await freshContext.close();
  });

  test("a visitor switched to 中文 sees Chinese category names, and an unavailable category offers a one-click return to English", async ({
    page,
  }) => {
    await page.goto("/catalog");
    await page.getByRole("button", { name: /English \(US\)/ }).click();
    await page.getByRole("menuitem", { name: /中文/ }).click();

    const categories = page.getByRole("region", { name: "Categories" });
    await expect(categories.getByRole("link", { name: "鸟" })).toBeVisible();
    await expect(categories.getByRole("link", { name: "猫" })).toBeVisible();
    await expect(categories.getByRole("link", { name: "狗" })).toBeVisible();
    await expect(categories.getByRole("link", { name: "鱼" })).toBeVisible();
    await expect(categories.getByRole("link", { name: "爬行动物" })).toBeVisible();

    await categories.getByRole("link", { name: "狗" }).click();
    await expect(page).toHaveURL(/\/catalog\/category\/DOGS$/);

    await expect(
      page.getByRole("heading", { level: 2, name: "No products in 中文 yet" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "View in English (US)" }).click();

    await expect(page.getByRole("link", { name: "Bulldogs" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Poodles" })).toBeVisible();
  });

  test("an unknown item id under a non-default locale reaches Not Found, not the unavailable-in-this-language message", async ({
    page,
  }) => {
    await page.goto("/catalog/item/NO-SUCH-ITEM?locale=ja_JP");

    await expect(page.getByRole("heading", { name: "Not Found" })).toBeVisible();
    await expect(page.getByText(/Not available in/)).toHaveCount(0);
  });
});
