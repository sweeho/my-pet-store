---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0123
branch: vortex/feat/SWHM-T-0123-admin-sign-in-error-page-and-access-deni-b942c98c
upstream: [artifacts/SWHM-S-0012/SWHM-T-0123/PLAN.md]
---

# TDD result — SWHM-T-0123

## Test cases

| Test                                                                                                                    | Covers                               | Intent                                                                           |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `src/pages/admin/signon-failed.test.tsx › renders the Sign In Failed heading`                                           | AC-1                                 | the mockup's heading is present                                                  |
| `src/pages/admin/signon-failed.test.tsx › renders the failure message verbatim`                                         | AC-1                                 | the generic credentials-not-found message, copied verbatim                       |
| `src/pages/admin/signon-failed.test.tsx › links back to /admin/signon for another attempt`                              | AC-2                                 | the retry link targets `/admin/signon`                                           |
| `e2e/admin.spec.ts › an anonymous visit to /admin/orders reaches the sign-on screen, not the table`                     | (idea's E2E denial-path requirement) | an unauthenticated navigation is redirected off the protected page               |
| `e2e/admin.spec.ts › a signed-on non-administrator is refused at /admin, not bounced back to sign on`                   | (idea's E2E denial-path requirement) | role-required denial renders in place; no sign-on loop (design.md D3)            |
| `e2e/admin.spec.ts › signing in at /admin/signon with wrong credentials lands on /admin/signon-failed, with a way back` | AC-1, AC-2                           | the failure page renders end-to-end and its back link returns to `/admin/signon` |

## Red run

`bun run test -- src/pages/admin/signon-failed.test.tsx`, with `src/pages/admin/signon-failed.tsx`
moved aside so only the test file exists:

```
FAIL |client| src/pages/admin/signon-failed.test.tsx [ src/pages/admin/signon-failed.test.tsx ]
Error: Failed to resolve import "./signon-failed" from "src/pages/admin/signon-failed.test.tsx".
Does the file exist?

Test Files  1 failed (1)
     Tests  no tests
```

Restored immediately after (`mv` the file back).

The three `e2e/admin.spec.ts` additions were **not executed in this container** — implementation
containers ship no Chromium (`scripts/ensure-playwright-browser.mjs` fails fast, confirmed below), and
PLAN.md step 6 says explicitly not to retry the preflight or install a browser here. They are written,
reviewed against the actual redirect/verdict behaviour in `auth/signon-filter.ts` and
`src/components/RequireAdmin.tsx` (unchanged by this ticket), and run in CI, which does have a browser.

CI's first run on this branch caught a real bug in the "signed-on non-administrator" case: it reached
`/admin` via `page.goto`, a fresh full-page navigation. `middleware/signon.ts` answers a `role-required`
verdict with a raw 403 JSON body for **any** navigation, not just a background fetch (design.md D3) —
so the browser never receives the SPA's HTML at all, and `RequireAdmin`'s in-place alert never gets a
chance to render. `getByRole('alert')` timed out on all 3 attempts:

```
✘  e2e/admin.spec.ts:68:3 › a signed-on non-administrator is refused at /admin, not bounced back to sign on
   Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   Locator: getByRole('alert')
   Expected: visible
   Received: <element(s) not found>
1 failed, 27 passed (26.8s)
```

Fixed by reaching `/admin` the way a real signed-on user would — through the admin sign-on form's
on-success `navigate("/admin")` (a client-side route change, so the SPA is already mounted and
`RequireAdmin`'s fetch to `/api/signon/check` runs as a background request, which is the path the
role-required in-place alert is actually reachable from), instead of a fresh `page.goto("/admin")`. No
production code changed — `middleware/signon.ts`'s behaviour is correct and intentional per D3; the
test was reaching the page the wrong way. Pushed the fix; CI re-run is `Pending Verification` as this
file is written — this is the evidence a real browser produced, not a fabricated result.

## Green run

`bun run verify` (this stack's full pre-commit gate — lint, typecheck, complete unit/integration
suite). `bun run verify:full` was attempted first; its E2E tier fails fast in this container:

```
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
```

the known implementation-container limitation `AGENTS.md` records — falling back to `verify` per that
note and PLAN.md step 6; the browser tier is observed by CI on this branch and at integration QA.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  69 passed (69)
      Tests  398 passed (398)
```

TDD-RESULT: 398 passed, 0 failed
