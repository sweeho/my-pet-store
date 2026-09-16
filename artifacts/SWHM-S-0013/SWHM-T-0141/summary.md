---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0141
branch: vortex/feat/SWHM-T-0141-cart-session-lifecycle-and-clear-on-logo-ea5f81e9
upstream: [artifacts/SWHM-S-0013/SWHM-T-0141/PLAN.md]
---

# Summary — SWHM-T-0141: Cart session lifecycle and clear on logout

## What changed

`invalidateSession` (`auth/session.ts`) now calls `clearCart(session.id)` before deleting the
session row, because `PRAGMA foreign_keys` is never set in this database (F4) — the declared
`ON DELETE CASCADE` on `cart_items.session_id` enforces nothing, so without an explicit delete the
cart rows would be orphaned rather than removed. The clearing rule lives inside
`invalidateSession` itself (not the logout route), so every current and future caller of it
inherits the rule. `routes/api/signon/logout.post.ts` needed no change — it already calls
`invalidateSession`.

Persistence across navigation (AC-1/AC-2) needed no new code: every cart read already resolves the
session through `useSignOnSession`, and cart rows are keyed on the session id. This ticket verifies
that property with a new test rather than building it.

## Files

- `auth/session.ts` — `invalidateSession` now clears the session's cart before deleting the session row.
- `auth/session.test.ts` — appended ST-09 (explicit delete, not cascade), ST-10 (idempotent with cart rows present), ST-11 (scoped to the invalidated session only), ST-12 (cross-request persistence via the session cookie, verification only).
- `routes/api/signon/logout.post.test.ts` — appended LO-04 (end-to-end: no orphaned `cart_items` row after logout, and the old cookie sees an empty cart on the next read).

## AC coverage

- AC-1, AC-2 (cart persists across navigation; same cookie agrees, different cookie doesn't) — `auth/session.test.ts` ST-12.
- AC-3 (`invalidateSession` deletes cart rows explicitly, before the session row, not via cascade) — ST-09, ST-11; code order in `invalidateSession` (`clearCart` first).
- AC-4 (a request with the old cookie after logout gets an empty cart) — `logout.post.test.ts` LO-04.
- AC-5 (no `cart_items` row referencing a deleted session id remains) — LO-04, asserted directly against the db, not the API response.
- AC-6 (`invalidateSession` stays idempotent) — ST-10 (with cart rows present), plus the pre-existing ST-08 (without).
- AC-7 (all `auth/session.test.ts` and `logout.post.test.ts` assertions pass) — see `tdd-test-result.md`, `TDD-RESULT: 497 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  83 passed (83)
      Tests  497 passed (497)
```

`bun run verify:full`'s E2E preflight reported Chromium is genuinely not installed in this
container; fell back to `bun run verify` per the repository's own notes on implementation
containers. This ticket has no user-visible surface and adds no `e2e/` spec.

## Notes

- Did not add `/cart` to `auth/protected-resources.ts` (D3 — the cart is deliberately public) and
  did not enable `PRAGMA foreign_keys` (out of scope; tracked as SWHM-T-0144), per PLAN.md's
  explicit out-of-scope list.
