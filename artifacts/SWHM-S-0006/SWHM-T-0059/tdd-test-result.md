---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0006
ticket: SWHM-T-0059
branch: vortex/fix/SWHM-T-0059-flaky-e2e-customer-profile-spec-ts-save-6ff89637
upstream: [artifacts/SWHM-S-0006/SWHM-T-0059/PLAN.md]
downstream: [artifacts/SWHM-S-0006/qa-test-report.md]
---

# TDD result — SWHM-T-0059

## Test cases

| Test                                                                                                                                               | Covers     | Intent                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/RequireSignOn.test.tsx › shows a status indicator naming what is loading while the access check is in flight`                      | AC-1       | pending access check renders `role="status"`, not an empty page                                                                                 |
| `src/components/RequireSignOn.test.tsx › renders its children once the access check answers allowed`                                               | AC-1       | pre-existing passing case, confirms the status indicator is gone once allowed                                                                   |
| `src/components/RequireSignOn.test.tsx › redirects and never renders children when the access check answers denied`                                | AC-4       | pre-existing passing case, confirms denial still navigates and never renders children                                                           |
| `src/pages/customer.test.tsx › PT-10: shows the heading and a status indicator while the account read is in flight, then replaces it with content` | AC-2, AC-3 | pending account read shows heading + `role="status"`; once resolved, `status` is gone and the contact-information region is present             |
| `src/pages/customer.test.tsx › PT-01` through `PT-09`                                                                                              | AC-6       | pre-existing suite, unmodified, still green                                                                                                     |
| `e2e/customer-profile.spec.ts › views, edits, saves, and keeps the language preference across a new session`                                       | AC-5       | waits for the contact-information region (15000ms) before asserting the saved first name (default 5000ms budget) — browser tier, observed in CI |

## Red run

`bun --bun vitest run src/pages/customer.test.tsx` (before the `customer.tsx` fix; PT-10 written first):

```
FAIL  |client| src/pages/customer.test.tsx > CustomerProfile > PT-10: shows the heading and a status indicator while the account read is in flight, then replaces it with content
TestingLibraryElementError: Unable to find an accessible element with the role "heading" and name "Customer Profile"
Ignored nodes: comments, script, style
<body>
  <div />
</body>
 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
```

`bun --bun vitest run src/components/RequireSignOn.test.tsx` (before the `RequireSignOn.tsx` fix; new file written first):

```
FAIL  |client| src/components/RequireSignOn.test.tsx > RequireSignOn > shows a status indicator naming what is loading while the access check is in flight
TestingLibraryElementError: Unable to find an accessible element with the role "status"
Ignored nodes: comments, script, style
<body>
  <div />
</body>
 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

## Green run

`bun run verify` (this stack's full gate — `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  51 passed (51)
      Tests  250 passed (250)
```

`bun run test:e2e` was attempted and fails its Chromium preflight in this container by design
(`.vortex/agents-generated.md` § "Implementation containers do not ship a Chromium";
`node scripts/ensure-playwright-browser.mjs` reports
`/ms-playwright/chromium-1155/chrome-linux/chrome` not installed). Not retried per that note; the
browser tier is observed in CI on this branch and again at INTEGRATION_QA.

TDD-RESULT: 250 passed, 0 failed
