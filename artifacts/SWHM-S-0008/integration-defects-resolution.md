---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0008
branch: vortex/sprint/swhm-s-0008-6b835023
upstream: [artifacts/SWHM-S-0008/integration-test-result.md]
downstream: [artifacts/SWHM-S-0008/qa-test-report.md]
---

# Integration defects & resolutions — SWHM-S-0008

## DEFECT-1: Landing-page logo links still target the placeholder fragment `#`

- **Severity:** minor
- **Detected by:** AC verification against `openspec/changes/swhm-s-0008-bugfix-found-by-inspector/specs/application-foundation/spec.md`, scenario "No control leads nowhere" under the ADDED requirement "Application shell navigation".
- **Symptom:** `src/pages/index.tsx` header and mobile-panel logo anchors (`<a href="#">`, lines 23 and 55) still carried the Tailwind Plus template's placeholder `href="#"` after SWHM-T-0080/SWHM-T-0081 landed. Confirmed live: `bunx playwright test --project=chromium -g "logo link href"` → `LOGO HREF: #` for both header and mobile-panel logo links. `src/pages/index.test.tsx`'s "leaves no navigation or hero link as a placeholder fragment" test explicitly excludes the logo links from its check (`// The brand logo links … are out of scope for this ticket`), so the gap was not caught at the ticket tier.
- **Root cause:** `openspec/changes/.../design.md` § RC-1/D-2 identifies and fixes the `navigation` array, both "Log in" links, and the three hero anchors, but never names the logo anchors — SWHM-T-0080's scope was the `<img>` → `StoreMark` swap only, SWHM-T-0081's was the nav/hero `href`s only. The logo's own `href="#"` was never assigned to either ticket, so it survived both. The scenario as written ("every navigation … link on the page … in the header") does not carve out an exception for it.
- **Fix rounds:**
  1. Changed both `<a href="#">` logo wrappers in `src/pages/index.tsx` to `<Link to="/">` (the same `react-router` `Link` pattern every other in-app control in this file already uses) — `bun run verify` → `55 test files, 302 tests passed`; `bunx playwright test --project=chromium -g "logo link now routes"` → `1 passed`, confirming both logo links now resolve to `href="/"`.
- **Resolution:** FIXED-IN-PLACE (commit: `8bffebd`)
- **Validation evidence:** `bun run verify` → `Test Files 55 passed (55)`, `Tests 302 passed (302)`; `bun run test:e2e -- --project=chromium` → `20 passed (5.3s)`, 0 failed, 0 skipped, run after the fix.

## Summary

| Defect   | Severity | Resolution     |
| -------- | -------- | -------------- |
| DEFECT-1 | minor    | FIXED-IN-PLACE |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
