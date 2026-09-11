import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The three behaviours only a real browser can show for user-authentication
 * sign-on: a cookie pre-filling a form field on reload, a client-side route
 * guard redirecting before the protected page ever renders, and the
 * post-auth return to the URL that triggered the redirect. Every
 * single-endpoint behaviour already has API-level cover (routes/api/signon/
 * *.test.ts) and a cross-endpoint flow (routes/api/signon/flows.test.ts) —
 * this file exists only for what those can't observe.
 *
 * The dev server here is file-backed (not the in-memory Vitest db) and
 * fullyParallel is on, so every test uses a username no other test or
 * suite run reuses — derived from Date.now(), not a fixed string, so a
 * second run of the suite against the same sqlite.db never collides on
 * the primary key. Not Math.random(): the value that actually ran is
 * printed in any failing assertion, so a failure stays reproducible from
 * the test output.
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

test.describe("Sign-on", () => {
  test("remembers the username after a sign-in with the checkbox checked", async ({ page }) => {
    const username = uniqueUsername("remember");
    const password = "secret123";

    await page.goto("/signon");
    const signUpForm = page.getByRole("form", { name: "Create a new account" });
    await signUpForm.getByLabel("Username").fill(username);
    await signUpForm.getByLabel("Password", { exact: true }).fill(password);
    await signUpForm.getByLabel("Repeat Password").fill(password);
    await signUpForm.getByRole("button", { name: "Create Account" }).click();
    await expect(page).toHaveURL(/\/signon-welcome$/);

    await page.goto("/signon");
    const signInForm = page.getByRole("form", { name: "Sign in" });
    await signInForm.getByLabel("Username").fill(username);
    await signInForm.getByLabel("Password", { exact: true }).fill(password);
    await signInForm.getByLabel("Remember My User Name").check();
    await signInForm.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/signon-welcome$/);

    await page.goto("/signon");
    await expect(page.getByRole("form", { name: "Sign in" }).getByLabel("Username")).toHaveValue(
      username,
    );
  });

  test("redirects an unauthenticated visit to /customer to /signon, then returns there after signing in", async ({
    page,
    request,
  }) => {
    const username = uniqueUsername("original");
    const password = "secret123";

    // Created through an isolated APIRequestContext (the `request` fixture,
    // not `page.request`) so its Set-Cookie never lands in the page's own
    // context — the page must stay genuinely unauthenticated for the next
    // step to prove the interception.
    const createResponse = await request.post("/api/signon/create-user", {
      data: { j_username: username, j_password: password, j_password_2: password },
    });
    expect(createResponse.ok()).toBe(true);
    expect((await createResponse.json()).created).toBe(true);

    await page.goto("/customer");
    await expect(page).toHaveURL(/\/signon$/);

    const signInForm = page.getByRole("form", { name: "Sign in" });
    await signInForm.getByLabel("Username").fill(username);
    await signInForm.getByLabel("Password", { exact: true }).fill(password);
    await signInForm.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/customer$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Customer");
  });
});
