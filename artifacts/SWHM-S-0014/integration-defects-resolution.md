---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0014
idea: SWHM-I-0008
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream: [artifacts/SWHM-S-0014/integration-test-result.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Integration defects & resolutions — SWHM-S-0014

## DEFECT-1: Order confirmation screen never shows order ID or email

- **Severity:** major
- **Detected by:** E2E — `e2e/order.spec.ts:126` › "places an order from a populated cart ... confirms it with an order id and the shopper's email ..."
- **Symptom:** `bun run test:e2e -- --project=chromium` → `1 failed`. Timed out waiting for `getByRole('group', { name: /^Your order Id is \d+$/ })` to be visible on `/order-completed` after a real order submission.
- **Scenario violated:** "Confirmation screen shows order ID" and "Confirmation screen shows customer email" (`openspec/changes/swhm-i-0008-order-submission-checkout/specs/order-placement/spec.md`, requirement "Order confirmation screen displays order ID and email").
- **Root cause:** `src/pages/enter-order-information.tsx`'s `handleSubmit` never reads the `POST /api/order` response body on the success path — it calls `navigate("/order-completed")` with no `state`. `src/pages/order-completed.tsx` only renders the order-id/email block when `location.state` is present, so the confirmation screen renders with the id and email box entirely absent on every real browser submission. The unit test at `src/pages/enter-order-information.test.tsx:229` encoded this same call (`navigate("/order-completed")`, no state) as the expected behaviour, so the unit tier never caught it — only the E2E round trip through the real route surfaced it.
- **Fix rounds:**
  1. Parsed the `{ orderId, email }` response body on the success path and passed it as `navigate("/order-completed", { state: { orderId, email } })`; updated the corresponding unit test assertion to expect that call. Re-ran `bunx playwright test e2e/order.spec.ts --project=chromium` → `3 passed`. Re-ran `bun run test` → `577 passed` (unit suite, includes the updated assertion).
- **Resolution:** FIXED-IN-PLACE (commit: `86b711e`)
- **Validation evidence:** `bunx playwright test --project=chromium` (full suite) → `37 passed`; `bun run verify` → lint + typecheck + `577 passed` unit tests.

## Summary

| Defect   | Severity | Resolution     |
| -------- | -------- | -------------- |
| DEFECT-1 | major    | FIXED-IN-PLACE |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
