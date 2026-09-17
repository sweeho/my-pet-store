# Tasks — SWHM-S-0019

## 1. Planning

- [x] 1.1 Reproduce SWHM-T-0214 by executing the real functions on this sprint branch, and establish that a denied order is fulfilled — inventory deducted, invoice produced — not merely mis-labelled (SWHM-T-0218)
- [x] 1.2 Measure the blast radius: the sixteen assertions across three test files that seed PENDING orders, and the browser journey whose order is PENDING because the seeded administrator has no profile row (SWHM-T-0218)
- [x] 1.3 Author the change — proposal, design, the `fulfillment-management` delta, this task list — SWHM-T-0214's `PLAN.md`, and the one `## Key Decisions` bullet the invariant earns (SWHM-T-0218)

## 2. Gate the fulfilment pass on APPROVED

- [x] 2.1 Express "which statuses may be fulfilled" once in `fulfillment/status.ts`, as an exported predicate beside the status read (SWHM-T-0214)
- [x] 2.2 Make `markOrderCompleted` write COMPLETED only from APPROVED, keeping its existing answers for an unknown order and an already-completed one (SWHM-T-0214)
- [x] 2.3 Make `processOrder` refuse a non-approved order before any inventory check, shipped-quantity write or invoice, after the read that raises `OrderNotFoundError` for an unknown id (SWHM-T-0214)

## 3. Correct the coverage that pins the old behaviour

- [x] 3.1 Re-seed the APPROVED path across `fulfillment/status.test.ts`, `fulfillment/fulfillment.test.ts` and `routes/api/fulfillment/process.post.test.ts`, and change their "stays PENDING" expectations to the status the order actually keeps (SWHM-T-0214)
- [x] 3.2 Add the regression assertions: a DENIED order and a PENDING order each leave status, shipped quantities and inventory untouched and produce no invoice, at both the module and the route tier (SWHM-T-0214)
- [x] 3.3 Approve the order in `e2e/fulfillment.spec.ts` between placing it and fulfilling it, so the browser journey exercises the real place → approve → fulfil path (SWHM-T-0214)
- [x] 3.4 Add a browser-tier case that denies an order and observes the fulfilment run shipping nothing and leaving it DENIED (SWHM-T-0214)
