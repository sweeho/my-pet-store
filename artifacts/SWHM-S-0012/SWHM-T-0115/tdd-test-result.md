---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0115
branch: vortex/feat/SWHM-T-0115-admin-home-page-and-shell-5e2e2f4d
upstream: [artifacts/SWHM-S-0012/SWHM-T-0115/PLAN.md]
---

# TDD result — SWHM-T-0115

## Test cases

| Test                                                                                                                                            | Covers | Intent                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `src/components/AdminShell.test.tsx › renders the signed-in username in the header`                                                             | AC-1   | header shows username once known                                                                                          |
| `src/components/AdminShell.test.tsx › shows a status indicator in place of the username while it is still loading`                              | AC-1   | screen never renders nothing during the session read                                                                      |
| `src/components/AdminShell.test.tsx › does not render a back link when backTo is omitted`                                                       | AC-1   | one component serves both the home screen and other admin screens                                                         |
| `src/components/AdminShell.test.tsx › renders a back link to backTo, with the default label, when backTo is given`                              | AC-1   | back-link contract used by later admin screens                                                                            |
| `src/components/AdminShell.test.tsx › renders a back link with a custom backLabel when given`                                                   | AC-1   | backLabel override honored                                                                                                |
| `src/pages/admin/index.test.tsx › shows a pending indicator for the username while the session read is outstanding, without hiding the heading` | AC-1   | stable chrome stays visible during the session fetch                                                                      |
| `src/pages/admin/index.test.tsx › renders the title, description and both actions once the session read resolves`                               | AC-1   | title, description, Launch Rich Client and Logout all present                                                             |
| `src/pages/admin/index.test.tsx › navigates to /admin/orders when Launch Rich Client is activated`                                              | AC-2   | Launch Rich Client takes the administrator to the orders screen (S2 — navigation replaces the AdminRequestProcessor POST) |
| `src/pages/admin/index.test.tsx › POSTs to /api/signon/logout and navigates to / when Logout is activated`                                      | AC-1   | Logout issues the sign-off request and returns to the storefront                                                          |

## Red run

`bun --bun vitest run src/components/AdminShell.test.tsx src/pages/admin/index.test.tsx` against a stub `AdminShell`/`AdminHomeContent` that each returned `null`:

```
FAIL  |client| src/pages/admin/index.test.tsx > AdminHomeContent > renders the title, description and both actions once the session read resolves
TestingLibraryElementError: Unable to find an element with the text: jps_admin.
FAIL  |client| src/pages/admin/index.test.tsx > AdminHomeContent > navigates to /admin/orders when Launch Rich Client is activated
FAIL  |client| src/pages/admin/index.test.tsx > AdminHomeContent > POSTs to /api/signon/logout and navigates to / when Logout is activated
...
 Test Files  2 failed (2)
      Tests  8 failed | 1 passed (9)
```

## Green run

`bun run verify` — this stack's full pre-commit gate (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`), run against the real implementation:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  60 passed (60)
      Tests  348 passed (348)
```

`bun run verify:full` (adds the E2E tier) was attempted first; its `pretest:e2e` preflight (`scripts/ensure-playwright-browser.mjs`) reported Chromium is genuinely not installed in this container, consistent with AGENTS.md's "Notes from previous agents" entry for this sprint — fell back to `bun run verify` per that guidance. E2E runs at INTEGRATION_QA and in CI.

TDD-RESULT: 348 passed, 0 failed
