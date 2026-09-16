---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0141
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0137/PLAN.md,
  ]
---

# PLAN — SWHM-T-0141: Cart session lifecycle and clear on logout

## Objective

Tie the cart to the session that owns it: prove persistence across requests, and clear the cart when the session is invalidated.

## Steps

1. **Read § Codebase findings F4 first.** `PRAGMA foreign_keys` is never set in this repository, so SQLite's default applies and the `ON DELETE CASCADE` on `cart_items.session_id` enforces nothing. Deleting the session row leaves the cart rows behind. Nothing has ever depended on a cascade here, so this has never been observable — and it would not have been observable in this ticket either, because the cookie is cleared at the same moment. The orphaned rows would simply accumulate.
2. Extend `invalidateSession` in `auth/session.ts` to delete the session's cart rows **explicitly**, before deleting the session row (§ Decisions D4). Keep it idempotent: both deletes match zero rows without throwing when the session is already gone.
3. Persistence across navigation needs no new code — every cart read resolves the session through `useSignOnSession` (F2) and the rows are keyed on it. This ticket **verifies** it rather than building it: two reads with the same cookie agree, a read with a different cookie does not see those lines.
4. Extend `auth/session.test.ts` for the invalidation behaviour, and `routes/api/signon/logout.post.test.ts` for the end-to-end assertion that a cart does not survive logout. Assert against the real in-memory database that no `cart_items` row for that session id remains — an assertion on the API response alone would pass even with the rows orphaned.
5. Leave `routes/api/signon/logout.post.ts` alone unless the behaviour genuinely requires a change; the clearing belongs inside `invalidateSession` so every future caller of it inherits the rule rather than each logout path remembering.

## Out of scope, deliberately

- **Do not enable `PRAGMA foreign_keys`.** It would change delete semantics for six account tables and the whole catalogue at once, with no test covering the current behaviour. Raised as a separate improvement ticket.
- **Do not build session expiry.** Sessions do not expire for anyone, which `PRODUCT.md` § Not yet decided already records as an open decision belonging to the authentication capability (§ Spec discrepancies S6).
- **Do not add `/cart` to `auth/protected-resources.ts`.** The cart is public by § Decisions D3.

## File/module ownership

Create or modify only: `auth/session.ts`, `auth/session.test.ts`, `routes/api/signon/logout.post.test.ts`.

Nothing else. `cart/cart.ts` is complete and landed — import `clearCart`, do not edit it. SWHM-T-0140 may run in parallel and owns `cart/checkout.ts`.

## Design reference

None applies — no user-visible surface. The cart's empty state after logout is SWHM-T-0138's screen, unchanged.

## Definition of Done

AC-1 through AC-7 on the ticket. AC-1 is the delta spec's scenario verbatim; AC-3 and AC-5 are the ones that catch the cascade assumption, and AC-5 is the assertion that must read the database rather than the response.
