import { expect, test } from "@playwright/test";

/**
 * UI / E2E TEST
 *
 * Drives the real app in a real browser via Playwright — the outermost
 * layer of the test pyramid. Use this tier for things that only a real
 * browser can verify: responsive layout, CSS-driven visibility, multiple
 * elements interacting together across a full page. Prefer the
 * component-level UI test (src/pages/index.test.tsx) for anything that
 * doesn't specifically need a real browser — it's far faster.
 *
 * The bespoke header and its mobile-nav Dialog are gone (design.md F10,
 * SWHM-T-0237) — every screen, home included, now renders the shared header
 * (StoreHeader). Its own behaviour is covered by
 * src/components/StoreHeader.test.tsx; the narrow-viewport case below is
 * the one thing only a real browser observes (design.md § Open questions
 * O1 — a real browser is the only tier that can see CSS-driven overlap).
 */
test.describe("Home page", () => {
  test("shows the hero content and the shared header's desktop nav", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("My Pet Store");
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();

    for (const item of ["Catalog", "Cart"]) {
      await expect(page.getByRole("link", { name: item, exact: true })).toBeVisible();
    }
  });

  test("the header holds together at a 375px viewport, without overlapping the hero title (AC-7)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    for (const name of ["My Pet Store", "Catalog", "Cart", "Sign in"]) {
      await expect(header.getByRole("link", { name, exact: true })).toBeVisible();
    }

    const headerBox = await header.boundingBox();
    const titleBox = await page.getByRole("heading", { level: 1 }).boundingBox();
    expect(headerBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(headerBox!.y + headerBox!.height).toBeLessThanOrEqual(titleBox!.y);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("has no vertical scrollbar on common viewport sizes", async ({ page }) => {
    for (const size of [
      { width: 375, height: 812 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(size);
      await page.goto("/");

      const { scrollHeight, clientHeight } = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));
      expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
    }
  });

  test("requests no font, stylesheet, or preconnect hint from a third-party host", async ({
    page,
  }) => {
    const requestOrigins: string[] = [];
    page.on("request", (request) => {
      requestOrigins.push(new URL(request.url()).origin);
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("My Pet Store");

    const appOrigin = new URL(page.url()).origin;

    const offOriginRequests = requestOrigins.filter((origin) => origin !== appOrigin);
    expect(offOriginRequests).toEqual([]);

    const linkHrefs = await page.$$eval("head link", (links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => href !== null),
    );
    const offOriginLinks = linkHrefs.filter(
      (href) => new URL(href, appOrigin).origin !== appOrigin,
    );
    expect(offOriginLinks).toEqual([]);
  });
});
