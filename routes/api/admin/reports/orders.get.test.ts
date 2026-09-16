import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../../../db/client";
import {
  authUsers,
  category,
  categoryDetails,
  item,
  itemDetails,
  orderLineItem,
  orders,
  product,
  productDetails,
} from "../../../../db/schema";
import { SESSION_COOKIE, setSignedOn, useSignOnSession } from "../../../../auth/session";
import { DEFAULT_LOCALE } from "../../../../catalog/locale";
import getOrderCounts from "./orders.get";

function cookieValueOf(event: H3Event): string | undefined {
  const setCookieHeader = event.res.headers.get("set-cookie");
  return setCookieHeader?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
}

function requestWithCookie(url: string, cookieValue?: string): H3Event {
  return new H3Event(
    new Request(
      url,
      cookieValue ? { headers: { cookie: `${SESSION_COOKIE}=${cookieValue}` } } : undefined,
    ),
  );
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

function signedOnAdminCookie(userName: string): string | undefined {
  db.insert(authUsers).values({ userName, password: "hash", role: "administrator" }).run();
  const setup = new H3Event(new Request("http://localhost/api/admin/reports/orders"));
  // Not a React hook — a server-side session accessor whose name happens to
  // start with "use" (auth/session.ts is owned by another ticket this sprint).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  setSignedOn(useSignOnSession(setup), userName);
  return cookieValueOf(setup);
}

function seedCategoryWithSale(orderDate: Date, quantity: number, unitPrice: number): void {
  const catid = nextId("OCAT");
  db.insert(category).values({ catid }).run();
  db.insert(categoryDetails)
    .values({ catid, locale: DEFAULT_LOCALE, name: catid, descn: catid })
    .run();

  const productid = nextId("OPROD");
  db.insert(product).values({ productid, catid }).run();
  db.insert(productDetails)
    .values({ productid, locale: DEFAULT_LOCALE, name: productid, descn: productid })
    .run();

  const itemid = nextId("OITEM");
  db.insert(item).values({ itemid, productid, listPrice: 999, unitCost: 1 }).run();
  db.insert(itemDetails)
    .values({ itemid, locale: DEFAULT_LOCALE, name: itemid, image: "x.png", descn: itemid })
    .run();

  const userName = nextId("route-order-report-user");
  db.insert(authUsers).values({ userName, password: "hash", role: null }).run();
  const { orderId } = db
    .insert(orders)
    .values({ userName, orderDate, orderAmount: quantity * unitPrice, status: "COMPLETED" })
    .returning({ orderId: orders.orderId })
    .get();
  db.insert(orderLineItem).values({ orderId, lineNumber: 1, itemid, quantity, unitPrice }).run();
}

describe("GET /api/admin/reports/orders", () => {
  it("RO-01: a request with no signed-on session is refused 401", async () => {
    const event = requestWithCookie(
      "http://localhost/api/admin/reports/orders?start=01/01/2024&end=01/31/2024",
    );

    const result = await getOrderCounts(event);

    expect(event.res.status).toBe(401);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RO-02: a signed-on session without the administrator role is refused 403", async () => {
    db.insert(authUsers)
      .values({ userName: "plain-order-report-user", password: "hash", role: null })
      .run();
    const setup = new H3Event(new Request("http://localhost/api/admin/reports/orders"));
    setSignedOn(useSignOnSession(setup), "plain-order-report-user");
    const cookieValue = cookieValueOf(setup);

    const event = requestWithCookie(
      "http://localhost/api/admin/reports/orders?start=01/01/2024&end=01/31/2024",
      cookieValue,
    );
    const result = await getOrderCounts(event);

    expect(event.res.status).toBe(403);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RO-03: an administrator request with an unparseable date is refused 400", async () => {
    const cookieValue = signedOnAdminCookie(nextId("admin"));

    const event = requestWithCookie(
      "http://localhost/api/admin/reports/orders?start=2024-01-01&end=01/31/2024",
      cookieValue,
    );
    const result = await getOrderCounts(event);

    expect(event.res.status).toBe(400);
    expect(result).toEqual({ error: expect.any(String) });
  });

  it("RO-04: an administrator request with a valid range returns a Report grouped by Category", async () => {
    const cookieValue = signedOnAdminCookie(nextId("admin"));
    seedCategoryWithSale(new Date(Date.UTC(2024, 4, 15)), 3, 10);

    const event = requestWithCookie(
      "http://localhost/api/admin/reports/orders?start=05/01/2024&end=05/31/2024",
      cookieValue,
    );
    const result = await getOrderCounts(event);

    expect(event.res.status).not.toBe(400);
    expect(result).toEqual({
      groupedBy: "Category",
      rows: expect.any(Array),
      totalSales: expect.any(Number),
    });
  });
});
