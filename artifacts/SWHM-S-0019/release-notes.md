---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0019
idea: Not Applicable
branch: vortex/sprint/swhm-s-0019-7bf1d6c1
upstream: [artifacts/SWHM-S-0019/qa-test-report.md]
---

# Release notes — SWHM-S-0019

## Fixed

- An order an administrator denied can no longer be shipped. Running fulfilment on a denied order previously shipped its line items, took the goods out of inventory, produced an invoice and marked the order completed — overwriting the denial. A denied order now comes back from a fulfilment run untouched, with no invoice. (SWHM-T-0214)
- An order still awaiting approval can no longer be shipped. The same run against a pending order left it marked completed before anyone had approved it; it is now left pending, with nothing shipped and no stock deducted. (SWHM-T-0214)

## Changed

- Fulfilment answers a refused run the same way it answers one with nothing in stock: the request succeeds and reports no invoice and the order's own unchanged status. A request naming an order that does not exist is still reported as not found, not as not approved. (SWHM-T-0214)

## Upgrade notes

None. No migration, no configuration change, no feature flag, and no change to any request or response shape. Approved orders fulfil exactly as before.

One operational note for anyone driving fulfilment directly: an order must now be APPROVED before a fulfilment run will do anything. An order placed by an account with no stored language preference is not auto-approved at placement, so it needs an explicit approval first — this applies to the seeded `jps_admin` administrator account, whose orders are always pending.

## Not included

Nothing planned for this sprint was dropped. Three findings turned up while root-causing and were deliberately left out of scope, recorded under `## Follow-ups / out of scope` in `openspec/changes/swhm-s-0019-bugfix-swhm-t-0214-fulfilmen/proposal.md`: an auto-approved order never gets a supplier purchase-order row, the seeded administrator account has no profile row, and two capability specs still carry placeholder Purpose text.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0019/qa-test-report.md` (PASS; unit 826/826, E2E 45/45, no defects found).

## Compliance / Control Evidence

| Control                        | Evidence                                       | Location                                  | Status    | Exception |
| ------------------------------ | ---------------------------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded      | this file                                      | `artifacts/SWHM-S-0019/release-notes.md`  | Satisfied | —         |
| Release verified before land   | QA PASS verdict, seven scenario verdicts       | `artifacts/SWHM-S-0019/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated | `## Upgrade notes` and `## Not included` above | `artifacts/SWHM-S-0019/release-notes.md`  | Satisfied | —         |
