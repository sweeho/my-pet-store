import { db } from "../db/client";

// A read composed of more than one statement must see one snapshot — D2/D3
// (design.md § Planning record) rely on a page's rows and its hasNext flag
// coming from the same view of the table. `fn` takes no argument: it calls
// through the module-level `db`, which is the same single bun:sqlite
// connection this transaction runs on, so every statement it issues is
// scoped to this BEGIN/COMMIT.
//
// S5 (design.md § Spec discrepancies): the legacy framing is an EJB
// `trans-attribute: Required` descriptor and a concurrent-writer isolation
// test. bun:sqlite is an embedded, single-connection database, so there is
// no concurrent writer to isolate from — what survives is the single-
// snapshot property this wrapper gives a composite read.
export function readConsistent<T>(fn: () => T): T {
  return db.transaction(() => fn());
}
