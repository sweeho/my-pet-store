import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The full catalog-browsing journey in a real browser, against the seeded
 * catalog (catalog/seed.ts): categories → products → item detail, then a
 * search from /catalog to the same item. Component-level cover for each
 * screen (rendering, pagination disabled states, not-found) lives beside
 * each page under src/pages/catalog/ — this file exists for what only a
 * real browser + server round trip can show: real navigation between the
 * four screens, and the locale actually switching content language for a
 * signed-on customer.
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

test.describe("Catalog browsing", () => {
  test("browses categories to products to an item, then finds the same item via search", async ({
    page,
  }) => {
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { level: 1, name: "Catalog" })).toBeVisible();

    const categories = page.getByRole("region", { name: "Categories" });
    await expect(categories.getByRole("link", { name: "Birds" })).toBeVisible();
    await categories.getByRole("link", { name: "Birds" }).click();

    await expect(page).toHaveURL(/\/catalog\/category\/BIRDS$/);
    await expect(page.getByRole("heading", { level: 1, name: "Birds" })).toBeVisible();
    await page.getByRole("link", { name: "Parrots" }).click();

    await expect(page).toHaveURL(/\/catalog\/product\/BIRDS-PARROTS$/);
    await expect(page.getByRole("heading", { level: 1, name: "Parrots" })).toBeVisible();

    const africanGreyLink = page.getByRole("link", { name: /large, intelligent parrot/i });
    await expect(africanGreyLink).toBeVisible();
    await africanGreyLink.click();

    await expect(page).toHaveURL(/\/catalog\/item\/BIRDS-PARROTS-1$/);
    await expect(page.getByRole("heading", { level: 1, name: "Parrots" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Parrots" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Attribute 1" })).toContainText("Grey");
    await expect(page.getByRole("group", { name: "Attribute 2" })).toContainText("Large");
    await expect(page.getByText("$599.99")).toBeVisible();

    // Same item, reached from a search on /catalog instead of the browse path.
    await page.goto("/catalog");
    await page.getByRole("searchbox", { name: "Search query" }).fill("large african");
    await page.getByRole("button", { name: "Search" }).click();

    expect(new URL(page.url()).searchParams.get("q")).toBe("large african");
    const results = page.getByRole("region", { name: /Search results/ });
    const resultLink = results.getByRole("link", { name: /large, intelligent parrot/i });
    await expect(resultLink).toBeVisible();
    await resultLink.click();

    await expect(page).toHaveURL(/\/catalog\/item\/BIRDS-PARROTS-1$/);
  });

  test("an unknown category shows a not-found state rather than a blank screen", async ({
    page,
  }) => {
    await page.goto("/catalog/category/NO-SUCH-CATEGORY");

    await expect(page.getByRole("heading", { name: "Not Found" })).toBeVisible();
  });

  test("a signed-on customer's preferred language is used as the catalog locale", async ({
    page,
  }) => {
    const username = uniqueUsername("catalog-locale");
    const password = "secret123";

    // page.request shares the page's own cookie jar, so the session this
    // creates is the one /catalog navigates with next (see
    // e2e/customer-profile.spec.ts for the same pattern).
    const createResponse = await page.request.post("/api/signon/create-user", {
      data: { j_username: username, j_password: password, j_password_2: password },
    });
    expect(createResponse.ok()).toBe(true);

    const updateResponse = await page.request.put("/api/customer", {
      data: { profile: { preferredLanguage: "ja_JP" } },
    });
    expect(updateResponse.ok()).toBe(true);

    await page.goto("/catalog");

    const categories = page.getByRole("region", { name: "Categories" });
    await expect(categories.getByRole("link", { name: "犬" })).toBeVisible();
  });
});
