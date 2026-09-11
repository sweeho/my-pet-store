---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0004
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/integration-test-result.md]
downstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Integration defects & resolutions — SWHM-S-0004

## DEFECT-1: customer-profile E2E races the sign-in navigation

- **Severity:** minor
- **Detected by:** E2E — `e2e/customer-profile.spec.ts › views, edits, saves, and keeps the language preference across a new session`
- **Symptom:** `bunx playwright test e2e/customer-profile.spec.ts --project=chromium` → `1 failed`. `expect(page.getByRole("group", { name: "First name" })).toContainText("Priya")` timed out with "element(s) not found" after signing back in.
- **Root cause:** the test clicks "Sign In" and immediately calls `page.goto("/customer")` without waiting for the click's async `fetch("/api/signon")` to resolve and its `Set-Cookie` to land. Network tracing (`--trace=on`) showed the `/customer` navigation reaching the server as a plain `302` (no session cookie attached yet) an instant before the `/api/signon` response completed, bouncing the page to `/signon`. `e2e/signon.spec.ts` avoids this by asserting `await expect(page).toHaveURL(/\/signon-welcome$/)` right after the same click; `customer-profile.spec.ts` was missing that wait. This is a race in the test file itself, not in the account/session/customer application code — a curl-driven replay of the identical create→sign-in→PUT→sign-out→sign-in→GET sequence against the same running dev server returned the correct persisted data every time, and the on-disk `sqlite.db` always held the correct row.
- **Not part of this sprint's catalog scope** (`e2e/customer-profile.spec.ts` and the account capability belong to SWHM-S-0003), but it blocked getting a clean E2E run of the integrated sprint branch, so it is fixed here rather than deferred.
- **Fix rounds:**
  1. Added `await expect(page).toHaveURL(/\/signon-welcome$/);` after the "Sign In" click, mirroring `e2e/signon.spec.ts`'s established pattern, in `e2e/customer-profile.spec.ts` — `bunx playwright test e2e/customer-profile.spec.ts --project=chromium` → `1 passed (1.1s)`.
- **Resolution:** FIXED-IN-PLACE (commit: see this ticket's branch head)
- **Validation evidence:** re-ran the single spec twice more (`1 passed` both times) to rule out a lucky pass, then the full suite: `bun run test:e2e -- --project=chromium` → `12 passed (4.4s)`, no failures, no skips.

## Summary

| Defect   | Severity | Resolution     |
| -------- | -------- | -------------- |
| DEFECT-1 | minor    | FIXED-IN-PLACE |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
