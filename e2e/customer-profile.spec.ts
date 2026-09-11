import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * The full customer-profile journey a real browser is needed for: viewing
 * the freshly-created defaults, opening the edit form, saving, seeing the
 * full card number reduced to its last four digits, and a language
 * preference surviving a new session. Component-level cover for the same
 * screen (rendering, pre-fill, validation error) lives in
 * src/pages/customer.test.tsx — this file exists for what only a real
 * browser + server round trip can show.
 *
 * There is no sign-out endpoint in this capability (auth/** is out of this
 * ticket's ownership and none exists). "Signs out" is modelled the way this
 * app actually ends a session: the httpOnly bp_session cookie goes away.
 * context.clearCookies() does that at the network layer (unlike
 * document.cookie, which can't touch an httpOnly cookie from the page), so
 * signing in again after it is a genuinely fresh session — anything still
 * visible afterwards came from the server, not from client-side state.
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

test.describe("Customer profile", () => {
  test("views, edits, saves, and keeps the language preference across a new session", async ({
    page,
    context,
  }) => {
    const username = uniqueUsername("profile");
    const password = "secret123";

    // page.request shares the page's own cookie jar (unlike the isolated
    // `request` fixture e2e/signon.spec.ts uses), so the session this
    // creates is the one the page navigates with next.
    const createResponse = await page.request.post("/api/signon/create-user", {
      data: { j_username: username, j_password: password, j_password_2: password },
    });
    expect(createResponse.ok()).toBe(true);
    expect((await createResponse.json()).created).toBe(true);

    await page.goto("/customer");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Customer Profile");

    const contactCard = page.getByRole("region", { name: "Contact information" });
    await expect(contactCard.getByRole("group", { name: "First name" })).toContainText("—");

    await page.getByRole("button", { name: "Edit profile" }).click();
    const form = page.getByRole("form", { name: "Edit profile" });
    await form.getByLabel("First name").fill("Priya");
    await form.getByLabel("Last name").fill("Singh");
    await form.getByLabel("Street address line 1").fill("42 Orchard Rd");
    await form.getByLabel("City").fill("Springfield");
    await form.getByLabel("Postal code").fill("90210");
    await form.getByLabel("Card number").fill("4111111111111234");
    await form.getByLabel("Preferred language").selectOption("ja_JP");
    await form.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("form", { name: "Edit profile" })).toHaveCount(0);
    await expect(contactCard.getByRole("group", { name: "First name" })).toContainText("Priya");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja_JP");

    // the full number was never kept — re-opening the form shows the last
    // four digits the server actually stored, not what was typed.
    await page.getByRole("button", { name: "Edit profile" }).click();
    await expect(page.getByLabel("Card number")).toHaveValue("1234");

    await context.clearCookies();
    await page.goto("/signon");
    const signInForm = page.getByRole("form", { name: "Sign in" });
    await signInForm.getByLabel("Username").fill(username);
    await signInForm.getByLabel("Password", { exact: true }).fill(password);
    await signInForm.getByRole("button", { name: "Sign In" }).click();

    await page.goto("/customer");
    await expect(page.getByRole("group", { name: "First name" })).toContainText("Priya");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja_JP");
  });
});
