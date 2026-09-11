---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0002
idea: SWHM-I-0002
branch: vortex/sprint/swhm-s-0002-728cef7d
upstream: [artifacts/SWHM-S-0002/SPRINT-PLAN.md, artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md]
downstream: [artifacts/SWHM-S-0002/sprint-summary.md]
---

# QA test report — SWHM-S-0002

Note on section set: the QA acceptance criteria for this ticket (SWHM-T-0029) mandate exactly
these 7 `##` sections, superseding the 8-section template in `artifact-qa-test-report` (which adds
`## Design fidelity`). This is moot in substance: `SPEC-DISCREPANCIES.md` records that idea
SWHM-I-0002 carries no design blocks, so a Design fidelity section would have read "no design
reference on this idea" regardless.

## Executive Summary

**Verdict: PASS.** All 5 acceptance criteria for SWHM-I-0002 (User Authentication & Sign-On) hold
on the integrated sprint branch, and all 24 scenarios across the 14 requirements in the
`user-authentication` delta spec pass. `bun run verify` (lint + typecheck + 74 unit tests) and the
full Playwright E2E tier (8 tests, `--project=chromium`) both passed on first execution against
the built, deployed integration. No defects were found; nothing was fixed in place; nothing was
escalated.

## E2E Test Status

8/8 Playwright tests passed (`chromium` project — the only project in `playwright.config.ts`,
confirmed by `bunx playwright test --list` to cover all 3 spec files), 0 failed, 0 skipped. Full
command, per-spec table and Playwright's summary line are in `integration-test-result.md`.

## Unit Test Results

```
$ bun run verify
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  21 passed (21)
      Tests  74 passed (74)
   Duration  1.76s
```

Baseline before this sprint's build-out (SWHM-T-0015) was lower; all 74 are the cumulative
authentication-capability suite across `auth/**/*.test.ts`, `routes/api/signon/**/*.test.ts` and
`src/pages/signon*.test.tsx`, per each ticket's own `tdd-test-result.md`.

Scenario-level verdicts, read against
`openspec/changes/swhm-i-0002-user-authentication-sign-on/specs/user-authentication/spec.md`:

SCENARIO-VERDICT: Create new user account / User account is created with valid credentials — pass
SCENARIO-VERDICT: Create new user account / Username validation rejects length exceeding 25 characters — pass
SCENARIO-VERDICT: Create new user account / Username validation rejects special characters — pass
SCENARIO-VERDICT: Authenticate user with credentials / Authentication succeeds with correct credentials — pass
SCENARIO-VERDICT: Authenticate user with credentials / Authentication fails with incorrect password — pass
SCENARIO-VERDICT: Authenticate user with credentials / Authentication fails with non-existent username — pass
SCENARIO-VERDICT: Sign-in form displays username and password inputs / Sign-in form displays with correct fields — pass
SCENARIO-VERDICT: Sign-in form pre-populates username from cookie / Username field pre-populates from existing cookie — pass
SCENARIO-VERDICT: Sign-in form pre-populates username from cookie / Username field defaults to empty without cookie — pass
SCENARIO-VERDICT: Sign-up form displays registration fields / Sign-up form displays with correct fields — pass
SCENARIO-VERDICT: Sign-on error page displays authentication failure message / Error page shows after failed sign-in — pass
SCENARIO-VERDICT: Establish session on successful authentication / Session attributes are set after successful sign-in — pass
SCENARIO-VERDICT: Establish session on successful authentication / New sessions initialize with unsigned-on state — pass
SCENARIO-VERDICT: Redirect to originally-requested resource after authentication / User is redirected to original URL after successful sign-in — pass
SCENARIO-VERDICT: Intercept unauthenticated access to protected resources / Unauthenticated user is redirected to sign-on page — pass
SCENARIO-VERDICT: Intercept unauthenticated access to protected resources / Authenticated user accesses protected resource without redirection — pass
SCENARIO-VERDICT: Persist username in browser cookie when requested / Username cookie is created when remember checkbox is selected — pass
SCENARIO-VERDICT: Persist username in browser cookie when requested / Username cookie is removed when remember checkbox is not selected — pass
SCENARIO-VERDICT: Enforce maximum username length / Username at maximum length is accepted — pass
SCENARIO-VERDICT: Enforce maximum username length / Username exceeding maximum length is rejected — pass
SCENARIO-VERDICT: Enforce password length constraints / Password exceeding maximum length is rejected — pass
SCENARIO-VERDICT: Redirect to error page on authentication failure / User is redirected to error page on authentication failure — pass
SCENARIO-VERDICT: Protect specified resources with authentication / Protected resource requires authentication — pass

24/24 scenarios pass. No spec gaps found.

## Code Review

Reviewed incidentally while verifying, not as a line-by-line audit:

- `auth/user.ts` stores passwords as `scrypt$<salt>$<derived>` with a random per-user salt and
  compares with `timingSafeEqual` — matches `SPEC-DISCREPANCIES.md` §S3's deliberate deviation
  from the spec's plaintext `String.equals()` and avoids a timing side-channel the spec itself
  doesn't address.
- `auth/signon-filter.ts`'s `evaluateAccess()` is a small pure function reused identically by both
  the server middleware and the client-side `GET /api/signon/check` route, per §S6 — one decision
  point for two enforcement surfaces.
- `routes/api/signon/check.get.ts` rejects any `resource` query value that isn't a same-origin
  path (`isSameOriginPath`) before evaluating access, closing an open-redirect surface the spec's
  scenarios don't exercise but which the endpoint shape (a client-supplied redirect target)
  otherwise invites.
- No notable concerns beyond the two already-tracked, out-of-scope items in
  `SPEC-DISCREPANCIES.md` (§S9 session expiry, §S10 `middleware/auth.ts` stub, §S11
  `--destructive-foreground` token) — each already has its own backlog ticket
  (SWHM-T-0026, SWHM-T-0027, SWHM-T-0025).

## Coverage Summary

No coverage tool is configured in this project (`package.json` declares no `coverage` script and
`@vitest/coverage-v8`/`c8` are not in `devDependencies`). Verified via inspection of `package.json`
and `node_modules/@vitest`. Test-count evidence stands in its place: 74 unit/integration tests
across 21 files plus 8 E2E tests, with named test IDs (`UT-*`, `VT-*`, `AT-*`, `ST-*`, `SF-*`,
`RC-*`, `CU-*`, `SI-*`, `CH-*`) traceable one-to-one against every scenario above.

## Issues Found

None. See `integration-defects-resolution.md` — empty defect log, `INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`.

## Recommendation

Proceed. Fire `validation.all_acs_passed` — every acceptance criterion and every spec scenario
passed with no defects found; nothing to fix in place, nothing to escalate.
