---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0123
branch: vortex/feat/SWHM-T-0123-admin-sign-in-error-page-and-access-deni-b942c98c
upstream: [artifacts/SWHM-S-0012/SWHM-T-0123/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0123: Admin sign-in error page and access-denial coverage

## What changed

Added `/admin/signon-failed`, the mockup's failure screen (generic "not found in our records"
message, link back to `/admin/signon`), and extended `e2e/admin.spec.ts` with a second describe block
covering the three access-denial outcomes: anonymous → sign-on, signed-on non-admin → refused in
place, wrong credentials → the new failure page.

## Files

- `src/pages/admin/signon-failed.tsx` (+ `.test.tsx`) — the failure screen, per `mockup-login-error.html`.
- `e2e/admin.spec.ts` — extended only; the existing happy-path describe block is untouched. Added a second `test.describe("Administrator — access denial", …)` with the three cases from PLAN.md step 4.

## AC coverage

- AC-1 (error page shows after failed login, directing the user to verify credentials) — `src/pages/admin/signon-failed.tsx` renders the mockup's message verbatim. Covered by `signon-failed.test.tsx` and the `e2e/admin.spec.ts` "wrong credentials" case.
- AC-2 (a way back to the login page) — the `← Back to sign in` link targets `/admin/signon`. Covered by `signon-failed.test.tsx` and the same E2E case.
- The idea's third criterion (an E2E spec covering each denial path once the capability is assembled) — the two added `e2e/admin.spec.ts` cases (anonymous → sign-on; signed-on non-admin → refused in place, no loop) plus the wrong-credentials case above.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  69 passed (69)
      Tests  398 passed (398)
```

`bun run verify:full`'s E2E tier fails fast in this container (Chromium genuinely not installed,
`scripts/ensure-playwright-browser.mjs`) — the documented implementation-container limitation, and
PLAN.md step 6 says explicitly not to retry it here. The three `e2e/admin.spec.ts` additions were
written and reviewed against the unchanged `auth/signon-filter.ts` / `RequireAdmin.tsx` behaviour but
**not executed locally**; CI and integration QA observe the browser tier on this branch. See
`tdd-test-result.md` — `TDD-RESULT: 398 passed, 0 failed`.

## Notes

- `AdminSignOnFailed` does not use `AdminShell`, per PLAN.md step 1's explicit fallback: `AdminShell`'s
  null-username state renders "Signing in…", which describes a check in flight, not a failure — the
  wrong copy for this static page. It renders the header directly, mirroring `src/pages/admin/signon.tsx`
  (the other pre-auth admin screen) and the mockup. `AdminShell` itself was not touched.
- No defect found: the scope boundary's cross-cutting checkboxes (role validation, null-session denial,
  the `RemoteException`/`ServiceLocatorException` pair) were checked against the already-landed
  `admin/request.ts` and `auth/signon-filter.ts` and behave as design.md's S15 resolution describes;
  nothing here warranted a defect ticket.
- The anonymous-visit E2E case asserts a redirect to `/signon` (the shared sign-on page), not
  `/admin/signon` — that is `auth/protected-resources.ts`'s existing `SIGN_ON_PAGE` constant, used
  uniformly for every protected resource regardless of role. Unchanged by this ticket and consistent
  with PLAN.md's own wording ("reaches the sign-on screen"), not a discrepancy.
