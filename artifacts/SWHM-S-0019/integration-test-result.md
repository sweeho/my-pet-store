---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0019
idea: Not Applicable
branch: vortex/sprint/swhm-s-0019-7bf1d6c1
upstream: [artifacts/SWHM-S-0019/SPRINT-PLAN.md]
downstream: [artifacts/SWHM-S-0019/qa-test-report.md]
---

# Integration test result — SWHM-S-0019

## Environment

- Repo checked out on `vortex/test/SWHM-T-0219-integration-qa-report-swhm-s-0019-babd77e8`, forked
  off the sprint branch `vortex/sprint/swhm-s-0019-7bf1d6c1` at `4a6dc2a`.
- `bun install` — exit 0 (no changes, lockfile already satisfied).
- `bun run build` — exit 0 (`tsc --build && vite build`, `.output/` generated).
- Chromium preflight (`scripts/ensure-playwright-browser.mjs`) initially failed: the installed
  browser cache held `chromium-1223` but this Playwright version (`@playwright/test@1.50.1`)
  expects `chromium-1155`. Resolved by `bunx playwright install chromium`, which downloaded
  build v1155. This is a container image/Playwright-version mismatch, not a sprint defect —
  recorded here for visibility, not filed as a DEFECT.

## Command executed

```
$ bun run test:e2e --project=chromium
$ node scripts/ensure-playwright-browser.mjs
$ playwright test "--project=chromium"

Running 45 tests using 4 workers
...
  45 passed (13.6s)
```

Single `chromium` project in `playwright.config.ts` covers every spec under `e2e/` (confirmed via
`bunx playwright test --list`: 45 tests across 13 files, all under `[chromium]`) — no project
selection gap.

## Per-spec results

| Spec file                | Tests  | Result                             |
| ------------------------ | ------ | ---------------------------------- |
| admin.spec.ts            | 4      | 4 passed                           |
| cart.spec.ts             | 6      | 6 passed                           |
| catalog.spec.ts          | 3      | 3 passed                           |
| customer-profile.spec.ts | 1      | 1 passed                           |
| fulfillment.spec.ts      | 3      | 3 passed                           |
| home.spec.ts             | 4      | 4 passed                           |
| language.spec.ts         | 6      | 6 passed                           |
| legacy-routes.spec.ts    | 4      | 4 passed                           |
| order-approval.spec.ts   | 1      | 1 passed                           |
| order.spec.ts            | 3      | 3 passed                           |
| payment.spec.ts          | 4      | 4 passed                           |
| signon.spec.ts           | 3      | 3 passed                           |
| smoke.spec.ts            | 3      | 3 passed                           |
| **Total**                | **45** | **45 passed, 0 failed, 0 skipped** |

`fulfillment.spec.ts` carries this sprint's regression coverage specifically:

- "a fulfillable order answers with an invoice, and a second identical request answers with none
  and changes nothing" — approve→fulfil→refulfil idempotence path — passed (379ms).
- "a denied order's fulfilment run ships nothing and leaves it DENIED (SWHM-T-0214 regression,
  AC-1)" — passed (110ms).
- "signs in, reaches the inventory screen from the supplier home, and updates one ticked row" —
  unrelated supplier-inventory journey in the same file — passed (1.4s).

No spec file ran zero of its tests; no test in any file skipped.

E2E-RESULT: chromium 45 passed, 0 failed, 0 skipped
