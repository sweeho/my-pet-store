---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0012
idea: SWHM-I-0006
branch: vortex/sprint/swhm-s-0012-04c8d46e
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Integration test result — SWHM-S-0012

## Commands run

```
$ bun install
$ bunx playwright install chromium   # missing in this container; installed once, see Notes
$ bun run build
$ bunx playwright test --list --project=chromium   # confirms selection: 28 tests, 8 files, single "chromium" project
$ bunx playwright test --project=chromium
```

## Results

| Spec                           | Result     | Notes                                                                                                |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts`            | pass (4/4) | sign-in → home → orders navigation; anonymous denial; non-admin refusal; wrong-credential error page |
| `e2e/catalog.spec.ts`          | pass (3/3) | —                                                                                                    |
| `e2e/customer-profile.spec.ts` | pass (1/1) | —                                                                                                    |
| `e2e/home.spec.ts`             | pass (4/4) | —                                                                                                    |
| `e2e/language.spec.ts`         | pass (6/6) | —                                                                                                    |
| `e2e/legacy-routes.spec.ts`    | pass (4/4) | —                                                                                                    |
| `e2e/signon.spec.ts`           | pass (3/3) | —                                                                                                    |
| `e2e/smoke.spec.ts`            | pass (3/3) | —                                                                                                    |

Playwright summary: `28 passed (7.8s)`

## Notes

This container did not ship Chromium (`node scripts/ensure-playwright-browser.mjs` failed fast, as AGENTS.md's "Implementation containers do not ship a Chromium" note describes for engineer containers). As the Validation role, installed it with `bunx playwright install chromium` and re-ran the preflight successfully before proceeding — this is the QA phase's browser-equipped run, not a retry of a flaky check.

No spec file was wholly skipped; every file ran its full test count.

E2E-RESULT: chromium 28 passed, 0 failed, 0 skipped
