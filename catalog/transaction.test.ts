import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { category, categoryDetails } from "../db/schema";
import { readConsistent } from "./transaction";

describe("catalog/transaction", () => {
  it("TT-01: readConsistent runs its callback and returns its value", () => {
    const result = readConsistent(() => 42);

    expect(result).toBe(42);
  });

  it("TT-02: a row written inside the callback is absent after the callback throws", () => {
    expect(() =>
      readConsistent(() => {
        db.insert(category).values({ catid: "ROLLBACK-TEST" }).run();
        throw new Error("boom");
      }),
    ).toThrow("boom");

    const row = db.select().from(category).where(eq(category.catid, "ROLLBACK-TEST")).get();

    expect(row).toBeUndefined();
  });

  it("TT-03: a row written inside the callback is present after the callback returns", () => {
    readConsistent(() => {
      db.insert(category).values({ catid: "COMMIT-TEST" }).run();
    });

    const row = db.select().from(category).where(eq(category.catid, "COMMIT-TEST")).get();

    expect(row?.catid).toBe("COMMIT-TEST");
  });

  it("TT-04: a composite read inside one readConsistent call sees a single consistent snapshot", () => {
    db.insert(category).values({ catid: "SNAPSHOT-TEST" }).run();
    db.insert(categoryDetails)
      .values({ catid: "SNAPSHOT-TEST", locale: "en_US", name: "Snapshot", descn: "..." })
      .run();

    const result = readConsistent(() => {
      const cat = db.select().from(category).where(eq(category.catid, "SNAPSHOT-TEST")).get();
      const details = db
        .select()
        .from(categoryDetails)
        .where(eq(categoryDetails.catid, "SNAPSHOT-TEST"))
        .get();
      return { cat, details };
    });

    expect(result.cat?.catid).toBe("SNAPSHOT-TEST");
    expect(result.details?.catid).toBe("SNAPSHOT-TEST");
    expect(result.details?.name).toBe("Snapshot");
  });

  it("TT-05: an error raised inside the callback propagates to the caller unchanged", () => {
    const original = new Error("distinct-error-marker");
    let caught: unknown;

    try {
      readConsistent(() => {
        throw original;
      });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBe(original);
  });
});
