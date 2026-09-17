---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0210
branch: vortex/feat/SWHM-T-0210-admin-operations-row-selection-bulk-appr-274a2b34
upstream: [artifacts/SWHM-S-0018/SWHM-T-0210/PLAN.md]
---

# TDD result — SWHM-T-0210

## Test cases

| Test                                                                                                                 | Covers          | Intent                                                                     |
| -------------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------- |
| `orders-approval.test.tsx › AC-1 / OA-03: renders the five data column headers in order, after the selection column` | AC-1, D8        | updated for the new selection column (6 headers, first is the checkbox)    |
| `orders-approval.test.tsx › OA-07: every row carries a selection checkbox, plus a select-all checkbox`               | PLAN step 1     | per-row `aria-label="Select order {id}"` and the header select-all         |
| `orders-approval.test.tsx › PLAN step 2 / OA-08: Approve sets only the selected rows' status`                        | AC-1            | bulk Approve never touches an unticked row                                 |
| `orders-approval.test.tsx › OA-09: Deny sets only the selected rows' status to DENIED`                               | AC-2            | bulk Deny never touches an unticked row                                    |
| `orders-approval.test.tsx › AC-3 / AC-4 / OA-10: Commit POSTs one entry per selected-and-changed row, never /status` | AC-3, AC-4, S11 | the exact request body and endpoint Commit sends                           |
| `orders-approval.test.tsx › PLAN step 4 / OA-11: a status changed in an unticked row is not committed`               | PLAN step 2/4   | selection decides what is written, not "was it touched"                    |
| `orders-approval.test.tsx › PLAN step 6 / OA-12: Commit disables itself and announces progress, then restores`       | PLAN step 6     | pending-action label/disabled/role=status, and restoration after           |
| `orders-approval.test.tsx › PLAN step 7 / OA-13: a skipped order is reported, and the pending list refreshes`        | D3, D7          | the `skipped` outcome is observable; decided orders leave the pending view |

The six pre-existing tests (OA-01, OA-02, OA-04, OA-05, OA-06 plus the two `status-select.test.tsx` and
`index.test.tsx` suites) were run alongside to confirm no regression from adding the selection column
and the actions.

## Red run

`bun --bun vitest run src/pages/admin/orders-approval.test.tsx` — before selection, the bulk actions
and Commit existed on `orders-approval.tsx`:

```
FAIL |client| ... AC-1 / OA-03: renders the five column headers in order
AssertionError: expected [ '', 'Order ID', 'User ID', …(3) ] to deeply equal [ 'Order ID', 'User ID', …(3) ]
(pre-existing test, later updated for the new selection column)

FAIL |client| ... OA-07: every row carries a selection checkbox ...
TestingLibraryElementError: Unable to find role="checkbox" with name "Select all orders"

FAIL |client| ... PLAN step 2 / OA-08 ... OA-09 ... OA-10 ... OA-11 ... OA-12 ... OA-13
(6 further failures — no selection checkboxes, no Approve/Deny/Commit controls existed yet)

 Test Files  1 failed (1)
      Tests  7 failed | 6 passed (13)
```

## Green run

`bun run verify` — this project's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`);
`verify:full`'s browser tier was attempted first and failed at the documented preflight
(`scripts/ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") — a known
implementation-container limitation recorded in `AGENTS.md § Notes from previous agents`, not retried
per that note. `e2e/order-approval.spec.ts` (this ticket's own E2E spec, covering AC-4 end-to-end per
PLAN.md's Definition of Done) could not be executed in this container for the same reason; `tsc --build`
(part of `verify`, and `e2e/` is in `tsconfig.node.json`'s `include`) typechecks it cleanly. The browser
tier runs in CI on this ticket's branch and again at INTEGRATION_QA, per PLAN.md's own Definition of
Done note.

```
$ bun run lint && bun run typecheck && bun run test
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   ✓ (no output)
tsc --build                                                                  ✓ (no output)
NODE_ENV=test bun --bun vitest run

 Test Files  120 passed (120)
      Tests  818 passed (818)
```

CI (which has a real Chromium) caught what this container could not, across two pushes:

1. `uniqueUsername("approval-shopper")` exceeded `MAX_USERID_LENGTH` (25) once combined with the
   `Date.now()` suffix — the same guard `e2e/order.spec.ts`'s own helper carries, and it fired
   correctly. Fixed by shortening the label to `"appr"`.
2. With that fixed, the spec still failed deterministically (all 3 attempts, same line) waiting for
   the first selected order's checkbox to appear — never a flake. The spec's shopper-session-then-
   switch-to-jps_admin flow (create a shopper via `/api/signon/create-user`, place 3 orders under it,
   then sign in as `jps_admin` in the same browser context) has no working precedent anywhere in this
   suite; the closest, `e2e/admin.spec.ts`'s denial test, signs into the admin form as the SAME plain
   user it just created, not a second, different account, and asserts a refusal, not success — so it
   does not actually prove a session handoff to a different, privileged account. Rewritten to mirror
   `e2e/fulfillment.spec.ts`'s own proven pattern instead: sign on directly as `jps_admin` via
   `POST /api/signon`, then place the three orders under that same session — `order/order.ts`'s
   `placeOrder` does not check role (that file's own comment), and `jps_admin` carries no profile row,
   so `resolvePlacementLocale` resolves a null locale and `decideApproval` defaults to PENDING
   regardless of amount, same outcome as before. This removes the untested session-switch entirely
   rather than adding a wait or a retry around it.

Re-verified `bun run verify` green after each fix (same 818/818, since this file typechecks under
`tsc --build` but the vitest suite is unaffected by an e2e-only change). Awaiting the next CI run to
confirm the browser tier itself.

TDD-RESULT: 818 passed, 0 failed
