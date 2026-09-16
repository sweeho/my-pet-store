# SWHM-T-0118 — Order tables and retrieval by status

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 5. Order Management` (5.1–5.5)
**Requirement:** Retrieve and display orders by status

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **D1, D4, S1 and S4 govern this ticket.** This is the highest-consequence
> ticket in the sprint: four later capabilities inherit the table shape it defines.

## Objective

Define the order tables this repository does not have, and serve orders by status. After this ticket
`orders` and `order_line_item` exist with a committed migration, there is demo data to read, and
`GET /api/admin/orders?status=…` answers.

## Steps

1. **`orders` and `order_line_item` in `db/schema.ts`.** Both carry their own keys, because the
   relationships are 1:N — an account's 1:1 entities share `user_name`, and anything that is not 1:1
   takes its own key instead of widening one of those (ARCHITECTURE.md § Key Decisions). `orders`
   references `auth_users.user_name`; `order_line_item` references `orders.order_id` with
   `ON DELETE CASCADE` and `item.itemid`. Index `orders.status` and `orders.order_date` — the report
   queries filter on the date range and the queue query filters on status, and both are the whole
   read.
2. **`unit_price` on the line item is the price paid** and is written at creation, never joined back to
   `item.list_price` (D4). Carry `quantity` alongside it so an order count can be summed without
   re-reading the catalogue. `orders.order_amount` is the order's total, stored rather than derived:
   the mockup shows an amount per order and recomputing it on every read makes the queue query a join.
3. **`order_date` as an integer timestamp**, matching `sessions.updated_at` — the repository already has
   one timestamp convention and a second would make the report's date-range comparison depend on which
   table it touched.
4. **Generate the migration into `drizzle/` and commit it.** The schema change is not complete without
   it (ARCHITECTURE.md § Data model). Do not hand-write the SQL.
5. **Seed demo orders in `db/client.ts`**, beside the existing demo data and the administrator row
   SWHM-T-0114 added. Seed enough to exercise what the screens show: orders in each of `PENDING`,
   `APPROVED`, `COMPLETED` and `DENIED`, line items spanning more than one category, and dates spread
   across a range wide enough that a date filter can exclude some of them. Reference only `itemid`s the
   catalogue seed actually creates — a foreign key to an item that was never seeded fails at insert,
   and it fails during seeding, which is before any test has run.
6. **`admin/orders.ts`** — `getOrdersByStatus(status, start?, count?)`. Paginated as a page plus
   `hasNext`, never a COUNT: the decision names administrative lists explicitly, and it also fixes that
   a page needs a deterministic sort or the same row can appear twice
   (ARCHITECTURE.md § Key Decisions). Sort by `order_date` descending then `order_id` descending —
   newest first, as the mockup shows, with the id breaking ties between orders sharing a date.
7. **`GET /api/admin/orders`** at `routes/api/admin/orders/index.get.ts`. Call `requireAdmin` first and
   return its error as-is (SWHM-T-0117). Read `status` from the query — accept one status or several,
   because the orders screen asks for three at once and issuing three requests for one table is worse
   than accepting a list. Validate it against the known statuses and answer 400 with `{ error }` on
   anything else, following the `parsePagination` shape in
   `routes/api/catalog/categories/index.get.ts`. No XML (S4): the criterion's field names become the
   JSON keys below, so the scenario stays checkable.
8. **Tests.** `admin/orders.test.ts`: filtering by one status and by several, the sort order, the page
   boundary with `hasNext` true and false, and an empty result for a status with no orders.
   `routes/api/admin/orders/index.get.test.ts`: the 401 and 403 from the guard, a 400 for an unknown
   status, and the field names and shape of a successful response. Both run in the `server` project —
   SWHM-T-0117 registered `admin/**`; `routes/**` was already there.

## Fixed interface contracts

Four later changes (`swhm-i-0007`, `-0008`, `-0010`, `-0011`) extend these tables rather than
introducing a parallel set. SWHM-T-0119, SWHM-T-0120, SWHM-T-0121 and SWHM-T-0122 code against the
types. Changing any of it is a plan revision, not an implementation choice.

```ts
// db/schema.ts
export const orders = sqliteTable("orders", {
  orderId: integer("order_id").primaryKey({ autoIncrement: true }),
  userName: text("user_name").notNull().references(() => authUsers.userName),
  orderDate: integer("order_date", { mode: "timestamp" }).notNull(),
  orderAmount: real("order_amount").notNull(),
  status: text("status").notNull(),
}, (t) => [index("orders_status_idx").on(t.status), index("orders_order_date_idx").on(t.orderDate)]);

export const orderLineItem = sqliteTable("order_line_item", {
  orderId: integer("order_id").notNull().references(() => orders.orderId, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  itemid: text("itemid").notNull().references(() => item.itemid),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(), // the price PAID — never item.list_price (D4)
}, (t) => [primaryKey({ columns: [t.orderId, t.lineNumber] })]);
```

```ts
// admin/types.ts additions
export const ORDER_STATUSES = ["PENDING", "APPROVED", "COMPLETED", "DENIED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderSummary = {
  orderId: number;
  userId: string;      // the scenario's UserId — orders.user_name
  orderDate: string;   // ISO 8601; the screen formats it
  orderAmount: number;
  orderStatus: OrderStatus;
};

// admin/orders.ts
export function getOrdersByStatus(
  status: OrderStatus | OrderStatus[],
  start?: number,
  count?: number,
): Page<OrderSummary>;
```

`GET /api/admin/orders?status=APPROVED&status=COMPLETED&start=0&count=50` →
`{ items: OrderSummary[], hasNext: boolean }`, or `{ error: string }` with 400/401/403.

## File/module ownership

Create or modify only: `db/schema.ts` (the two order tables only — the `role` column is SWHM-T-0114's
and is already landed), `drizzle/` (their migration), `db/client.ts` (the order seed),
`admin/orders.ts`, `admin/orders.test.ts`, `routes/api/admin/orders/index.get.ts`,
`routes/api/admin/orders/index.get.test.ts`.

Nothing else. The status-update route is SWHM-T-0119's; the screen is SWHM-T-0122's.

## Definition of Done

AC-1 on the ticket, read against S4: it asserts XML containing `OrderId`, `UserId`, `OrderDate`,
`OrderAmount`, `OrderStatus`. The observable outcome that replaces it is the JSON response above
carrying those five fields under the keys in `OrderSummary`. Plus: the generated migration is
committed, and the demo seed produces orders in all four statuses.

## Gotchas

- A seeded line item referencing an `itemid` the catalogue seed never created fails during seeding, not
  during a test — read the catalogue seed before choosing ids.
- Sorting on `order_date` alone is not deterministic when several orders share a date, and the seed
  will have some that do. The page can then repeat a row across a boundary.
- `orders.order_amount` is stored, not derived. If it disagrees with the sum of its line items in the
  seed, the reports and the queue will show different numbers for the same order.
