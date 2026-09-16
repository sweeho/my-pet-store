import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

import { Database } from "bun:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { seedCatalog } from "../catalog/seed";
import { ADMIN_ROLE } from "../auth/protected-resources";
import { seedOrderIdSequence } from "../order/id";

import { authUsers, category, orderLineItem, orders, users } from "./schema";

// Same scrypt format auth/user.ts's hashPassword/matchPassword use
// ("scrypt$salt$derived"). Not imported from there: auth/user.ts pulls in
// db/client.ts through account/customer.ts and auth/validation.ts, and a
// module that reaches this one first (as most test files do, since they
// import a capability module rather than db/client directly) would call
// this seed's hashPassword() while auth/user.ts's own module body is still
// mid-evaluation — a genuine TDZ ReferenceError on its SCRYPT_KEY_LENGTH
// const, observed when this was tried.
const SCRYPT_KEY_LENGTH = 64;

function hashAdminPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

// Vitest sets VITEST=true in every worker; an in-memory db keeps route
// integration tests isolated from the file-backed dev/prod db and from
// each other (each test module gets its own fresh Database instance).
// Paths are cwd-relative rather than import.meta.url-relative because Vite
// (dev server, Nitro build, Vitest) transforms this module, so its
// import.meta.url isn't a real file:// URL — cwd is always the project root
// across dev/build/test.
const sqlite = new Database(
  process.env.VITEST ? ":memory:" : path.join(process.cwd(), "sqlite.db"),
);

export const db = drizzle(sqlite, { schema: { users } });

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// Seeds the orders autoincrement sequence so the first order allocated gets
// 1001 (order/id.ts, design.md § Decisions D3). Runs before the demo orders
// below so a fresh development database gives 1001 to the first of those,
// not to a row that follows them (design.md § Codebase findings F6).
seedOrderIdSequence(db);

// Seed the same two users the mock API used to hardcode, so the demo data
// (and the existing route tests) keep working out of the box.
if (db.select().from(users).all().length === 0) {
  db.insert(users)
    .values([
      { name: "John Doe", email: "john@example.com" },
      { name: "Jane Smith", email: "jane@example.com" },
    ])
    .run();
}

// The development administrator (design.md S9): jps_admin/admin, hashed like
// every other credential. Seeded alongside the rest of the demo data, so it
// is development data and nothing more — the admin login form's pre-filled
// values are real only because this row exists.
if (db.select().from(authUsers).all().length === 0) {
  db.insert(authUsers)
    .values({ userName: "jps_admin", password: hashAdminPassword("admin"), role: ADMIN_ROLE })
    .run();
}

// The demo catalog is deliberately absent under Vitest: unit and integration
// tests start with an empty catalog and control their own fixtures, so no
// assertion is ever unknowingly checked against seed data (design.md §
// Planning record, D9).
if (db.select().from(category).all().length === 0 && !process.env.VITEST) {
  seedCatalog();
}

// Demo orders (design.md D1/D4), seeded only alongside the rest of the demo
// data and only after the catalog exists — order_line_item.itemid is a real
// foreign key, so an id the catalogue seed never created fails at insert.
// Spans every OrderStatus, more than one category per some orders, and dates
// wide enough apart that a later date-range filter can exclude some of them.
type SeedOrder = {
  userName: string;
  daysAgo: number;
  status: string;
  lines: { itemid: string; quantity: number; unitPrice: number }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

const SEED_ORDERS: SeedOrder[] = [
  {
    userName: "alice_customer",
    daysAgo: 60,
    status: "PENDING",
    lines: [
      { itemid: "BIRDS-PARROTS-1", quantity: 1, unitPrice: 599.99 },
      { itemid: "CATS-SHORTHAIR-1", quantity: 2, unitPrice: 89.99 },
    ],
  },
  {
    userName: "bob_customer",
    daysAgo: 45,
    status: "APPROVED",
    lines: [{ itemid: "DOGS-BULLDOGS-1", quantity: 1, unitPrice: 449.99 }],
  },
  {
    userName: "alice_customer",
    daysAgo: 30,
    status: "COMPLETED",
    lines: [
      { itemid: "FISH-GOLDFISH-1", quantity: 3, unitPrice: 4.99 },
      { itemid: "REPTILES-LIZARDS-1", quantity: 1, unitPrice: 59.99 },
    ],
  },
  {
    userName: "carol_customer",
    daysAgo: 20,
    status: "DENIED",
    lines: [{ itemid: "BIRDS-FINCHES-1", quantity: 1, unitPrice: 24.99 }],
  },
  {
    userName: "bob_customer",
    daysAgo: 10,
    status: "APPROVED",
    lines: [{ itemid: "CATS-LONGHAIR-1", quantity: 1, unitPrice: 199.99 }],
  },
  {
    userName: "alice_customer",
    daysAgo: 2,
    status: "COMPLETED",
    lines: [
      { itemid: "DOGS-POODLES-2", quantity: 1, unitPrice: 349.99 },
      { itemid: "FISH-ANGELFISH-1", quantity: 2, unitPrice: 14.99 },
    ],
  },
];

if (!process.env.VITEST && db.select().from(orders).all().length === 0) {
  const demoCustomers = [...new Set(SEED_ORDERS.map((seedOrder) => seedOrder.userName))];
  for (const userName of demoCustomers) {
    if (!db.select().from(authUsers).where(eq(authUsers.userName, userName)).get()) {
      db.insert(authUsers)
        .values({ userName, password: hashAdminPassword("customer"), role: null })
        .run();
    }
  }

  for (const seedOrder of SEED_ORDERS) {
    const orderAmount = seedOrder.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );
    const { orderId } = db
      .insert(orders)
      .values({
        userName: seedOrder.userName,
        orderDate: new Date(Date.now() - seedOrder.daysAgo * DAY_MS),
        orderAmount: Math.round(orderAmount * 100) / 100,
        status: seedOrder.status,
      })
      .returning({ orderId: orders.orderId })
      .get();

    db.insert(orderLineItem)
      .values(
        seedOrder.lines.map((line, index) => ({
          orderId,
          lineNumber: index + 1,
          itemid: line.itemid,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      )
      .run();
  }
}
