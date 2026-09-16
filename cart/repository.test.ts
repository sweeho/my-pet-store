import { describe, expect, it } from "vitest";

import { db } from "../db/client";
import { item, sessions } from "../db/schema";
import { deleteAllCartRows, deleteCartRow, readCartRows, upsertCartRow } from "./repository";

let sessionCounter = 0;
function seedSession(): string {
  sessionCounter += 1;
  const id = `cart-session-${sessionCounter}`;
  db.insert(sessions)
    .values({ id, jSignon: false, jSignonUsername: null, originalUrl: null, updatedAt: new Date() })
    .run();
  return id;
}

let itemCounter = 0;
function seedItem(): string {
  itemCounter += 1;
  const itemid = `cart-item-${itemCounter}`;
  db.insert(item)
    .values({ itemid, productid: "cart-test-product", listPrice: 10, unitCost: 5 })
    .run();
  return itemid;
}

/**
 * INTEGRATION TEST
 *
 * Runs against the real in-memory db (db/client.ts's per-test-module
 * instance), so every assertion is scoped to the specific session/item ids
 * a test just created.
 */
describe("cart/repository", () => {
  it("CR-01: a row written for one session is read back for that session", () => {
    const sessionId = seedSession();
    const itemId = seedItem();

    upsertCartRow(sessionId, itemId, 3);

    expect(readCartRows(sessionId)).toEqual([{ itemid: itemId, quantity: 3 }]);
  });

  it("CR-02: a row written for one session is absent for another session", () => {
    const sessionA = seedSession();
    const sessionB = seedSession();
    const itemId = seedItem();

    upsertCartRow(sessionA, itemId, 1);

    expect(readCartRows(sessionB)).toEqual([]);
  });

  it("CR-03: upserting the same (session, item) twice leaves exactly one row, with the second quantity", () => {
    const sessionId = seedSession();
    const itemId = seedItem();

    upsertCartRow(sessionId, itemId, 1);
    upsertCartRow(sessionId, itemId, 5);

    expect(readCartRows(sessionId)).toEqual([{ itemid: itemId, quantity: 5 }]);
  });

  it("CR-04: deleteCartRow removes only the targeted row", () => {
    const sessionId = seedSession();
    const itemA = seedItem();
    const itemB = seedItem();
    upsertCartRow(sessionId, itemA, 1);
    upsertCartRow(sessionId, itemB, 2);

    deleteCartRow(sessionId, itemA);

    expect(readCartRows(sessionId)).toEqual([{ itemid: itemB, quantity: 2 }]);
  });

  it("CR-05: deleteAllCartRows removes every row for the session, leaving other sessions untouched", () => {
    const sessionA = seedSession();
    const sessionB = seedSession();
    const itemA = seedItem();
    const itemB = seedItem();
    upsertCartRow(sessionA, itemA, 1);
    upsertCartRow(sessionA, itemB, 2);
    upsertCartRow(sessionB, itemA, 4);

    deleteAllCartRows(sessionA);

    expect(readCartRows(sessionA)).toEqual([]);
    expect(readCartRows(sessionB)).toEqual([{ itemid: itemA, quantity: 4 }]);
  });
});
