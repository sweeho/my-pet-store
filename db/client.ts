import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { seedCatalog } from "../catalog/seed";
import { ADMIN_ROLE } from "../auth/protected-resources";

import { authUsers, category, users } from "./schema";

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
