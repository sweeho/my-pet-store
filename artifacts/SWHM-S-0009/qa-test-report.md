---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0009
idea: Not Applicable
branch: vortex/sprint/swhm-s-0009-bd3fbd00
upstream: [artifacts/SWHM-S-0009/SPRINT-PLAN.md]
downstream:
  [
    artifacts/SWHM-S-0009/integration-test-result.md,
    artifacts/SWHM-S-0009/integration-defects-resolution.md,
  ]
---

# QA test report — SWHM-S-0009

## Executive Summary

**Verdict: PASS.** All three bugfix tickets (SWHM-T-0094, SWHM-T-0095, SWHM-T-0097) hold on the
integrated sprint branch, and every scenario in the change's three delta specs
(`application-foundation`, `catalog-browsing`, `user-authentication`) was exercised and passes. Ran
`bun install`, `bun run lint`, `bun run typecheck`, `bun run test` (311 tests), `bun run build`, and
the full Playwright suite (`bun run test:e2e -- --project=chromium`, 22 tests) against the integrated
build — all green. No defects found; no fix-in-place work required.

## E2E Test Status

22/22 Playwright tests passed, 0 failed, 0 skipped, across all 7 spec files. Full command, per-spec
table and the machine-checkable marker are in `artifacts/SWHM-S-0009/integration-test-result.md`.

## Unit Test Results

```
$ bun run test
$ NODE_ENV=test bun --bun vitest run
 Test Files  56 passed (56)
      Tests  311 passed (311)
   Duration  4.98s
```

Includes `catalog/seed-images.test.ts` (new, SWHM-T-0095: IT-01/IT-02 — every seeded image location
resolves to a shipped file, and the seed names exactly the 20 shipped illustrations) and
`auth/signon-filter.test.ts` (SWHM-T-0097: SF-04..SF-10 pin `isNavigationRequest`). Both pass.

## Code Review

Inspected the three tickets' changed files against `design.md`'s decisions while verifying:

- SWHM-T-0094 — `vite.config.ts` no longer registers `unplugin-fonts`; `configs/` is deleted;
  `unplugin-fonts` is removed from `package.json`/`bun.lock`. Matches D1 exactly.
- SWHM-T-0095 — `catalog/seed.ts`'s 40 `image` values now point at `.svg` paths; 20 distinct files
  exist under `public/images/{birds,cats,dogs,fish,reptiles}/` (confirmed by directory listing).
  Matches D3.
- SWHM-T-0097 — `middleware/signon.ts` calls `setOriginalUrl` only when
  `isNavigationRequest(event.headers)` holds, and answers `401` directly for a denied
  non-navigation request instead of redirecting. `auth/signon-filter.ts`'s `evaluateAccess` and
  `AccessVerdict` shape are unchanged, as the ticket's fixed-contract note requires. Matches D5/D6/D7.

No notable concerns observed. All three file-ownership maps stayed disjoint as `design.md`'s
Sequencing section predicted.

## Coverage Summary

No coverage tool is configured in this project (no `coverage` script in `package.json`, no
`vitest.config.ts` coverage block). Verified via the full test-runner output above (311/311 unit
tests, 56/56 files) plus the full Playwright run (22/22); no coverage percentage is available to
report.

## Issues Found

None. `artifacts/SWHM-S-0009/integration-defects-resolution.md` records the empty defect set and its
`COMPLETE` marker.

### Scenario verdicts

`application-foundation` — Product-branded application shell:

SCENARIO-VERDICT: Product-branded application shell / Home page names the product — pass
SCENARIO-VERDICT: Product-branded application shell / Browser tab and web app manifest name the product — pass
SCENARIO-VERDICT: Product-branded application shell / Home page requests no third-party asset — pass
SCENARIO-VERDICT: Product-branded application shell / No page fetches a web font from a third-party host — pass (e2e/home.spec.ts:42, SWHM-T-0094)
SCENARIO-VERDICT: Product-branded application shell / Boilerplate example screens are not reachable — pass

`catalog-browsing` — Item image association:

SCENARIO-VERDICT: Item image association / Item image location is retrieved — pass (catalog/item.test.ts, verified by inspection of existing unit coverage)
SCENARIO-VERDICT: Item image association / Every catalogued item's image location is served — pass (catalog/seed-images.test.ts IT-01, SWHM-T-0095)
SCENARIO-VERDICT: Item image association / Item detail screen shows the item's own image — pass (e2e/catalog.spec.ts, SWHM-T-0095)
SCENARIO-VERDICT: Item image association / Item detail screen shows a placeholder when the image is unavailable — pass (src/pages/catalog/item/[itemId].test.tsx PT-08, pre-existing and unchanged)

`user-authentication` — Intercept unauthenticated access to protected resources:

SCENARIO-VERDICT: Intercept unauthenticated access to protected resources / Unauthenticated user is redirected to sign-on page — pass (e2e/signon.spec.ts:59)
SCENARIO-VERDICT: Intercept unauthenticated access to protected resources / Authenticated user accesses protected resource without redirection — pass (auth/signon-filter.test.ts, evaluateAccess with j_signon true)
SCENARIO-VERDICT: Intercept unauthenticated access to protected resources / A background request to a protected resource is refused without a redirect — pass (auth/signon-filter.test.ts SF-04..SF-10; middleware/signon.ts answers 401, SWHM-T-0097)
SCENARIO-VERDICT: Intercept unauthenticated access to protected resources / Browsing before signing on does not change where the user lands — pass (e2e/signon.spec.ts:88, SWHM-T-0097)

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** Every acceptance criterion for SWHM-T-0094,
SWHM-T-0095 and SWHM-T-0097 holds on the integrated sprint branch, every delta-spec scenario passes,
and no defects were found.
