import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { category, categoryDetails } from "../../../../db/schema";
import getCategory from "./[categoryId].get";

/**
 * INTEGRATION TEST
 *
 * Dynamic route params come from `event.context.params`, set explicitly
 * here the same way routes/api/users/[id].test.ts does. Public — no cookie
 * is ever sent (design.md § Planning record, D6).
 */
describe("GET /api/catalog/categories/:categoryId", () => {
  db.insert(category).values({ catid: "RT-DOGS" }).run();
  db.insert(categoryDetails)
    .values({ catid: "RT-DOGS", locale: "en_US", name: "Dogs", descn: "Loyal companions" })
    .run();

  it("CD-01: returns the category in the default locale", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/categories/RT-DOGS"), {
      params: { categoryId: "RT-DOGS" },
    });

    const result = await getCategory(event);

    expect(result).toEqual({ id: "RT-DOGS", name: "Dogs", description: "Loyal companions" });
  });

  it("CD-02: a category that does not exist answers 404 with reason not-found", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/catalog/categories/RT-NOT-A-CATEGORY"),
      { params: { categoryId: "RT-NOT-A-CATEGORY" } },
    );

    const result = await getCategory(event);

    expect(event.res.status).toBe(404);
    expect(result).toEqual({
      error: "Category not found: RT-NOT-A-CATEGORY",
      reason: "not-found",
    });
  });

  it("CD-03: a category with no content in the requested locale answers 404 with reason missing-translation", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/catalog/categories/RT-DOGS?locale=RT-NO-SUCH-LOCALE"),
      { params: { categoryId: "RT-DOGS" } },
    );

    const result = await getCategory(event);

    expect(event.res.status).toBe(404);
    expect(result).toEqual({
      error: "Category not found: RT-DOGS",
      reason: "missing-translation",
    });
  });
});
