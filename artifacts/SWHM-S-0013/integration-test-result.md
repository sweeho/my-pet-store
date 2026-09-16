---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0013
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
downstream: [artifacts/SWHM-S-0013/qa-test-report.md]
---

# Integration test result — SWHM-S-0013

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list --project=chromium   # confirmed single "chromium" project covers all 9 spec files, 34 tests
$ bunx playwright test --project=chromium
```

`playwright.config.ts` declares exactly one project (`chromium`), so `--project=chromium` is the full covering selection — verified with `--list` before the run rather than assumed.

First attempt failed preflight: `browserType.launch: Executable doesn't exist at /ms-playwright/chromium_headless_shell-1155/...`. Installed with `bunx playwright install chromium`, then re-ran.

## Results

| Spec                           | Result | Notes                                                                                                                                |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e/admin.spec.ts`            | pass   | 4/4                                                                                                                                  |
| `e2e/cart.spec.ts`             | pass   | 6/6 — add, update+subtotal, zero-quantity removal, last-item removal to empty state, persistence across navigation, anonymous access |
| `e2e/catalog.spec.ts`          | pass   | 3/3                                                                                                                                  |
| `e2e/customer-profile.spec.ts` | pass   | 1/1                                                                                                                                  |
| `e2e/home.spec.ts`             | pass   | 4/4                                                                                                                                  |
| `e2e/language.spec.ts`         | pass   | 6/6                                                                                                                                  |
| `e2e/legacy-routes.spec.ts`    | pass   | 4/4                                                                                                                                  |
| `e2e/signon.spec.ts`           | pass   | 3/3                                                                                                                                  |
| `e2e/smoke.spec.ts`            | pass   | 3/3                                                                                                                                  |

Playwright summary: `34 passed (8.9s)`

No skipped tests, no wholly-skipped spec files.

E2E-RESULT: chromium 34 passed, 0 failed, 0 skipped
