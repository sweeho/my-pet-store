---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0017
idea: SWHM-I-0010
branch: vortex/sprint/swhm-s-0017-0206b1e7
upstream: [artifacts/SWHM-S-0017/qa-test-report.md]
---

# Release notes — SWHM-S-0017

## Added

- The store now holds a stock figure for every item it sells. (SWHM-T-0187)
- Administrators have a Supplier area at `/supplier`, reachable only when signed in as an administrator, describing what the module does and leading to the inventory screen. (SWHM-T-0194)
- `/supplier/inventory` lists every item with the quantity currently held, a field for a new quantity and a tick box per row, and writes the ticked rows together when Update Inventory is used. A typed value in an unticked row is not written, and an item that has never been stocked shows 0 rather than being absent. (SWHM-T-0195)
- An order can now be filled: each line is shipped in full when enough stock is held, the stock held drops by what went out, and a line that cannot be filled is left for a later run. Filling the same order twice does not ship anything twice. (SWHM-T-0188, SWHM-T-0191, SWHM-T-0192)
- Filling an order produces an invoice listing the order's details and every line that shipped, returned to whoever asked for the order to be filled. Nothing is returned when no line could be shipped. (SWHM-T-0189)
- `POST /api/fulfillment/process` fills one order by id, for administrators. It answers with the order's resulting status and its invoice; an unknown order answers 404, a malformed request 400, and any other failure a generic 500 that reveals nothing about the internals. (SWHM-T-0193, SWHM-T-0196)

## Changed

- An order reaches COMPLETED on its own once every one of its lines has shipped. Previously the only way an order took that status was an operator setting it in the order queue. An order with anything still outstanding stays PENDING. (SWHM-T-0190, SWHM-T-0192)

## Upgrade notes

- **Database migration `drizzle/0009_steady_microchip.sql`** adds the `inventory` table. It is applied automatically at startup; no manual step and no downtime handling is required for an embedded SQLite database.
- **Existing items start with no stock row, which reads as a quantity of 0**, so no order can be filled until an administrator sets quantities on `/supplier/inventory`. A development database created from empty seeds 100 of every catalogue item alongside the rest of the demo data; an existing database is never back-filled.
- No configuration, environment variable or feature flag was added, and nothing that worked before behaves differently.

## Not included

- Nothing reserves stock when an order is placed, so a shopper can still order more than the store holds — the consequence is an order that stays PENDING, not a refusal at checkout.
- Nothing schedules or retries a fulfilment run: something has to ask, per order.
- The invoice is returned to the caller and nowhere else — it is not stored, sent or shown to a customer.
- No carrier, tracking number, dispatch date or shipping notification. The store records what went out, not how it travels.
- Non-administrators have no fulfilment or inventory access of any kind; the Supplier area is administrator-only.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0017/qa-test-report.md` (PASS, no defect found).

## Compliance / Control Evidence

| Control                              | Evidence                              | Location                                  | Status    | Exception |
| ------------------------------------ | ------------------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded            | this file                             | `artifacts/SWHM-S-0017/release-notes.md`  | Satisfied | —         |
| Release verified before land         | QA PASS verdict, 23/23 scenarios      | `artifacts/SWHM-S-0017/qa-test-report.md` | Satisfied | —         |
| Schema change documented for upgrade | Migration named in `## Upgrade notes` | `drizzle/0009_steady_microchip.sql`       | Satisfied | —         |
| Known limitations communicated       | `## Not included`                     | this file                                 | Satisfied | —         |
