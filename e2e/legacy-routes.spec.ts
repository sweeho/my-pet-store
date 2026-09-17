import { expect, test } from "@playwright/test";

/**
 * REGRESSION TEST — SWHM-T-0082
 *
 * The template shipped a matched pair: example pages under src/pages/users/
 * and an example API under routes/api/users/. The product kept and extended
 * the API but never replaced the pages, so /users, /users/:id and
 * /users/profile stayed publicly reachable and served hardcoded placeholder
 * people (see openspec/changes/swhm-s-0008-bugfix-found-by-inspector/design.md
 * § D-3). This pins both halves of the fix: the scaffold pages must fall
 * through to the not-found screen, and the database-backed API they share a
 * name with must be untouched.
 */
test.describe("Legacy /users scaffold routes", () => {
  for (const path of ["/users", "/users/1", "/users/profile"]) {
    test(`${path} renders the not-found screen, not the boilerplate scaffold`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole("heading", { level: 1, name: "Not Found" })).toBeVisible();
      await expect(page.getByText("Users List")).toHaveCount(0);
      await expect(page.getByText("User Profile")).toHaveCount(0);
    });
  }

  test("GET /api/users still answers with rows from the database", async ({ request }) => {
    const response = await request.get("/api/users");

    expect(response.ok()).toBe(true);
    expect(await response.json()).toHaveProperty("users");
  });
});

/**
 * REGRESSION TEST — SWHM-T-0239
 *
 * vite-plugin-pages turns every non-excluded .tsx under src/pages/ into a
 * route, so NotFound.tsx (the catch-all's target) and
 * RootErrorBoundary.tsx (an errorElement nothing wires up) were published
 * at /NotFound and /RootErrorBoundary alongside the catch-all's own `*`
 * route (openspec/changes/swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02/design.md
 * § F1). Neither is a screen a visitor navigates to directly, so both
 * paths must fall through to the not-found screen instead.
 */
test.describe("Component pages are not reachable at an address of their own", () => {
  for (const path of ["/NotFound", "/RootErrorBoundary"]) {
    test(`${path} renders the not-found screen, not the error boundary`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole("heading", { level: 1, name: "Not Found" })).toBeVisible();
      await expect(page.getByText("An error occurred. Please try again later.")).toHaveCount(0);
    });
  }
});
