import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import { category, categoryDetails } from "../../../../db/schema";
import listCategories from "./index.get";

/**
 * INTEGRATION TEST
 *
 * No sign-on cookie is ever sent — this route is public (design.md §
 * Planning record, D6). Fixture rows use en_US so the "no locale in the
 * query" case exercises the facade's default rather than needing a second
 * request to prove the same thing.
 */
describe("GET /api/catalog/categories", () => {
  db.insert(category)
    .values([{ catid: "RT-BIRDS" }, { catid: "RT-CATS" }])
    .run();
  db.insert(categoryDetails)
    .values([
      { catid: "RT-BIRDS", locale: "en_US", name: "Birds", descn: "Feathered pets" },
      { catid: "RT-CATS", locale: "en_US", name: "Cats", descn: "Feline pets" },
    ])
    .run();

  it("CI-01: omitting start/count/locale returns the default first page in en_US", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/categories"));

    const result = await listCategories(event);

    expect(result).toEqual({
      objects: [
        { id: "RT-BIRDS", name: "Birds", description: "Feathered pets" },
        { id: "RT-CATS", name: "Cats", description: "Feline pets" },
      ],
      start: 0,
      hasNext: false,
    });
  });

  it("CI-02: a count outside 1-100 answers 400 with a plain error body", async () => {
    const event = new H3Event(new Request("http://localhost/api/catalog/categories?count=0"));

    const result = await listCategories(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: "count must be a number between 1 and 100" });
  });
});
