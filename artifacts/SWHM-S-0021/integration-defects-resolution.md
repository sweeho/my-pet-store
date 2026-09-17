---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0021
idea: SWHM-I-0014
branch: vortex/sprint/swhm-s-0021-5e503761
upstream: [artifacts/SWHM-S-0021/integration-test-result.md]
downstream: [artifacts/SWHM-S-0021/qa-test-report.md]
---

# Integration defects & resolutions — SWHM-S-0021

## DEFECT-1: RequireSignOn's pending state takes the administration width, not the store width it guards

- **Severity:** minor
- **Detected by:** AC verification — "Shared content column widths" (openspec `application-foundation/spec.md`), cross-checked against `design.md` F8/D6 while verifying AC-8 of SWHM-T-0238
- **Symptom:** `src/components/RequireSignOn.tsx`'s `role="status"` pending state rendered at `ADMIN_CONTENT_WIDTH` (832px, `src/components/layout.ts`). `RequireSignOn` guards only customer-facing screens — `/customer`, `/payment`, `/enter-order-information`, `/order-completed`, `/signon-welcome` — every one of which renders its resolved content at the store's `CONTENT_WIDTH` (672px). A shopper landing on any of those five routes therefore saw an 832px-wide "Checking access…" box, unheaded, for the duration of the `GET /api/signon/check` round trip, followed by a re-render at 672px with the header — a visible one-time width jump on the exact class of page (`/enter-order-information`, `/payment`) `design.md` was written to stop jumping.
- **Root cause:** SWHM-T-0238's own `PLAN.md` step 4 ("Move the route guards' states onto the shared administration column") named the administration column for **both** `RequireSignOn` and `RequireAdmin` without distinguishing which surface each guard actually protects. `RequireAdmin` guards only `/admin` + `/supplier` screens (832px, correct). `RequireSignOn` guards only customer screens (672px) — `design.md` finding F8 itself lists "the two route guards' pending states" under the pre-change 672px group, so the two-width split in D6 was never meant to move `RequireSignOn`'s guard state to the wider figure. The implementer flagged the tension explicitly in `artifacts/SWHM-S-0021/SWHM-T-0238/summary.md` § Notes rather than silently resolving it, asking Planning to confirm; this is that confirmation, reached the other way.
- **Fix rounds:**
  1. Changed `RequireSignOn.tsx`'s pending-state container and its import from `ADMIN_CONTENT_WIDTH` to `CONTENT_WIDTH`; updated the matching assertion in `RequireSignOn.test.tsx` (AC-8) from `ADMIN_CONTENT_WIDTH` to `CONTENT_WIDTH`. Re-ran the one file: `NODE_ENV=test bun --bun vitest run src/components/RequireSignOn.test.tsx` → `4 passed`. `RequireAdmin.tsx` is untouched — its use of `ADMIN_CONTENT_WIDTH` is correct.
- **Resolution:** FIXED-IN-PLACE (commit: see `qa-test-report.md` § Recommendation for this ticket's merge commit)
- **Validation evidence:** full re-run after the fix — `bun run verify` (lint + typecheck + `NODE_ENV=test bun --bun vitest run`) → `132 test files, 901 tests, all passed`; `bun run build` → succeeds; `bun run test:e2e -- --project=chromium` → `45 passed, 0 failed, 0 skipped` (see `integration-test-result.md`). Manually verified in a real browser (signed-in shopper, `/enter-order-information` with a populated cart) that the header's left/right edges line up with the order form beneath it at both the pending and resolved states.

## Summary

| Defect   | Severity | Resolution     |
| -------- | -------- | -------------- |
| DEFECT-1 | minor    | FIXED-IN-PLACE |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
