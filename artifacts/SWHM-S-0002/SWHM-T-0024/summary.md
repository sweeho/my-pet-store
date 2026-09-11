---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0024
branch: vortex/feat/SWHM-T-0024-integration-testing-f170bc06
upstream: [artifacts/SWHM-S-0002/SWHM-T-0024/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0024: Integration testing

## What changed

Added two test-only files proving the `user-authentication` capability end to end, on top of
the already-DONE implementation from this sprint: a cross-endpoint API integration file
(tasks 10.1–10.6) and a browser spec for the three behaviours only a real browser shows
(tasks 10.7–10.9). No implementation file was touched — this ticket owns tests only.

## Files

- `routes/api/signon/flows.test.ts` — new: 6 flows chaining `create-user` → `signon` → `session` across their real handlers, each crossing at least two endpoints rather than repeating a single-route assertion.
- `e2e/signon.spec.ts` — new: 2 Playwright tests — remembered-username pre-fill after a checked sign-in, and the `/customer` → `/signon` → back-to-`/customer` interception/return journey (both AC-9 and AC-10 in one continuous browser session, per PLAN.md's "from that same interception").

## AC coverage

- AC-1/AC-2/AC-3 (valid creation / username length boundary / `%` rejection) — `flows.test.ts` `FT-01`/`FT-02`/`FT-03`.
- AC-4 (special-character rejection, `%`/`*`) — `flows.test.ts` `FT-04`.
- AC-5/AC-6/AC-7 (authenticate: correct creds / wrong password / non-existent user) — `flows.test.ts` `FT-01`, `FT-05`, `FT-06`.
- AC-8 (remember-cookie created with `maxAge` 2,678,400) — `signon.spec.ts` "remembers the username…", asserted by reading the field back after a fresh `/signon` load.
- AC-9 (protected resource denies and redirects to sign-on) — `signon.spec.ts` "redirects an unauthenticated visit…", first half.
- AC-10 (redirect to original URL after sign-in) — same test, second half: signing in from the interception returns to `/customer`.

## Verification

```
$ bun --bun vitest run routes/api/signon/flows.test.ts   # 6/6 pass; sanity-mutated one assertion
                                                            and confirmed it fails, then reverted
$ bun run verify                                          # full gate: lint ✓ typecheck ✓ 74 passed (0 failed)
$ bun run test:e2e -- e2e/signon.spec.ts                  # blocked: no Chromium in this container
```

See `tdd-test-result.md` — `TDD-RESULT: 74 passed, 0 failed`.

## Notes

- No natural red phase exists for this ticket: every endpoint and page under test was built and
  individually proved by an already-DONE ticket (SWHM-T-0015–0023), so the flows and the
  browser spec pass on first write rather than failing before an implementation lands. Recorded
  this honestly in `tdd-test-result.md` rather than fabricating a failure, and instead
  sanity-checked `flows.test.ts` by temporarily mutating one expectation and confirming it
  fails before reverting.
- `e2e/signon.spec.ts` could not be executed here — this container has no Chromium installed
  (`scripts/ensure-playwright-browser.mjs` fails fast, same as every prior ticket in this
  sprint, and says to fall back to `verify` and let CI run the tier). Not retried, no browser
  installed, per PLAN.md step 4. CI's `verify:full` run is the actual execution of this spec;
  its result gates this ticket's CI check before DONE.
- Per ticket ownership, no implementation file was touched even though writing these tests
  required reading `auth/authenticate.ts`, `auth/session.ts`, `auth/signon-filter.ts`,
  `src/pages/signon.tsx`, `src/components/RequireSignOn.tsx` and `src/pages/customer.tsx` to
  confirm the real request/response shapes and accessible form structure. All flows passed as
  written — no defect found in the DONE tickets they exercise.
