import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import {
  category,
  categoryDetails,
  item,
  itemDetails,
  product,
  productDetails,
} from "../db/schema";

describe("catalog schema", () => {
  it("SC-01: a category round-trips id, name and description", () => {
    db.insert(category).values({ catid: "BIRDS" }).run();
    db.insert(categoryDetails)
      .values({ catid: "BIRDS", locale: "en_US", name: "Birds", descn: "As a hobby..." })
      .run();

    const row = db.select().from(categoryDetails).where(eq(categoryDetails.catid, "BIRDS")).get();

    expect(row).toEqual({
      catid: "BIRDS",
      locale: "en_US",
      name: "Birds",
      descn: "As a hobby...",
    });
  });

  it("SC-02: a product round-trips and indicates its category relationship", () => {
    db.insert(category).values({ catid: "DOGS" }).run();
    db.insert(product).values({ productid: "K9-BD-01", catid: "DOGS" }).run();
    db.insert(productDetails)
      .values({
        productid: "K9-BD-01",
        locale: "en_US",
        name: "Bulldog",
        descn: "Friendly bulldog",
      })
      .run();

    const productRow = db.select().from(product).where(eq(product.productid, "K9-BD-01")).get();
    const detailsRow = db
      .select()
      .from(productDetails)
      .where(eq(productDetails.productid, "K9-BD-01"))
      .get();

    expect(productRow).toEqual({ productid: "K9-BD-01", catid: "DOGS" });
    expect(detailsRow).toEqual({
      productid: "K9-BD-01",
      locale: "en_US",
      name: "Bulldog",
      descn: "Friendly bulldog",
    });
  });

  it("SC-03: an item round-trips all 13 attributes", () => {
    db.insert(category).values({ catid: "REPTILES" }).run();
    db.insert(product).values({ productid: "AV-CB-01", catid: "REPTILES" }).run();
    db.insert(item)
      .values({ itemid: "EST-1", productid: "AV-CB-01", listPrice: 193.5, unitCost: 92.0 })
      .run();
    db.insert(itemDetails)
      .values({
        itemid: "EST-1",
        locale: "en_US",
        name: "Amazon Parrot",
        image: "/images/parrots/amazon.jpg",
        descn: "Great companion for up to 75 years",
        attr1: "Green",
        attr2: "Large",
        attr3: null,
        attr4: null,
        attr5: null,
      })
      .run();

    const itemRow = db.select().from(item).where(eq(item.itemid, "EST-1")).get();
    const detailsRow = db.select().from(itemDetails).where(eq(itemDetails.itemid, "EST-1")).get();

    expect(itemRow).toEqual({
      itemid: "EST-1",
      productid: "AV-CB-01",
      listPrice: 193.5,
      unitCost: 92.0,
    });
    expect(detailsRow).toEqual({
      itemid: "EST-1",
      locale: "en_US",
      name: "Amazon Parrot",
      image: "/images/parrots/amazon.jpg",
      descn: "Great companion for up to 75 years",
      attr1: "Green",
      attr2: "Large",
      attr3: null,
      attr4: null,
      attr5: null,
    });
  });
});
