---
ticket: SWHM-T-0196
title: Integration, failure behaviour and the browser journey
---

## What changed

Hardened `routes/api/fulfillment/process.post.ts`'s error mapping: anything other
than `InvalidFulfillmentMessageError` (400, already mapped) or `OrderNotFoundError`
(404, already mapped) now answers 500 with a fixed, generic body (`{ error:
"Fulfilment processing failed." }`) — no stack trace, no internal error message —
and logs the failure to `console.error` naming the order id, the only mechanism
this product has (no logging dependency added).

Added `e2e/fulfillment.spec.ts` covering two journeys: the administrator's path
across both supplier screens (sign in → `/supplier` → **Display Inventory** →
`/supplier/inventory` → set a new quantity on a ticked row → submit → ticked row
shows the new figure, untouched row unchanged), and the fulfilment run's
idempotence (a fillable order returns an invoice once; the identical second
request returns none and leaves inventory as the first left it).

No `fulfillment/` module, screen, or `auth/protected-resources.ts` was touched —
this ticket only hardens the entry point SWHM-T-0193 built. AC-1's "leaves the
order exactly as it was" is a property of `processOrder`'s own single
`db.transaction()` (already asserted at the pass level by SWHM-T-0192's PT-07);
this ticket adds the route-level assertion that the _response_ the caller
actually sees carries none of that failure's detail.

## Files touched

- `routes/api/fulfillment/process.post.ts` — added the 500/logging branch.
- `routes/api/fulfillment/process.post.test.ts` — 2 new cases (PT-05, PT-06).
- `e2e/fulfillment.spec.ts` (new) — 2 Playwright tests.
- `artifacts/SWHM-S-0017/SWHM-T-0196/tdd-test-result.md`, `summary.md` (new)

## Acceptance criteria coverage

- AC-1 ("no inventory deducted, no shipped quantity written, no status moved... a
  500 carrying no stack trace"): PT-05.
- AC-2 ("written to the server's error output naming the order"): PT-06.
- AC-3 (the browser journey across both supplier screens): `e2e/fulfillment.spec.ts`
  — "signs in, reaches the inventory screen... and updates one ticked row".
- AC-4 (idempotence — invoice once, none on repeat, unchanged quantities):
  `e2e/fulfillment.spec.ts` — "a fulfillable order answers with an invoice...".

## Verification

```
$ bun run test -- routes/api/fulfillment/process.post.test.ts   → 1 file, 6 tests passed
$ bun run verify:full
  lint     → pass (covers e2e/fulfillment.spec.ts)
  typecheck→ pass (e2e/ is in tsconfig.node.json's include)
  test     → 112 files, 722 tests passed
  test:e2e → Chromium not installed in this container (documented gap, see
             AGENTS.md § Notes from previous agents); e2e/fulfillment.spec.ts
             type-checks and lints clean but was NOT executed here — not
             retried, no browser installed. Runs for the first time in CI/QA.
```

## Notes

- PT-05/PT-06 reuse the exact `vi.spyOn(db, "update")`-throws-on-second-call
  technique `fulfillment/fulfillment.test.ts`'s PT-07 already uses, applied at
  the route level to prove the response/logging behavior rather than
  re-proving the transaction rollback itself.
- The e2e spec signs in as the seeded `jps_admin` account for both journeys —
  placing an order only requires a signed-on session (`order/order.ts`'s
  `placeOrder` does not check role), so one session covers the shopper steps
  and the admin-only fulfilment/inventory calls.
- Could not execute `bun run test:e2e` in this container (Chromium missing);
  this is a known, documented environment gap, not a defect in the spec.
