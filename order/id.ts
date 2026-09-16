// Order id allocation (design.md § Decisions D3, § Spec discrepancies S1/S2).
// orders.order_id is already `integer primary key autoincrement`
// (db/schema.ts), so SQLite itself is the id generator — there is no
// allocation module holding a counter, no `max(order_id) + 1` read (two
// callers doing that race), and no UUID (forbidden outright,
// legacy-analysis/rebuild-guidance.md:90). This just pre-seeds the
// autoincrement sequence SQLite maintains in `sqlite_sequence` so the first
// id it allocates is 1001.
//
// Takes the db as a parameter rather than importing it from db/client.ts:
// db/client.ts is this seed's only caller, and calling it back would be a
// circular import into the module every other module's db access already
// goes through.
import { sql } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

const ORDER_ID_SEED = 1000;

// Idempotent by construction: SQLite adds a row to `sqlite_sequence` for
// `orders` the first time anything inserts into it — either this seed or a
// real order row, whichever runs first. This only ever INSERTs that
// still-missing row — it never UPDATEs one that already exists, so an
// already-used sequence is never lowered and existing order rows are never
// touched.
export function seedOrderIdSequence<TSchema extends Record<string, unknown>>(
  db: BunSQLiteDatabase<TSchema>,
): void {
  db.run(sql`
    INSERT INTO sqlite_sequence (name, seq)
    SELECT 'orders', ${ORDER_ID_SEED}
    WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'orders')
  `);
}
