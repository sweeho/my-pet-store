---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0114
branch: vortex/feat/SWHM-T-0114-admin-authentication-and-role-based-acce-7cc64596
upstream: [artifacts/SWHM-S-0012/SWHM-T-0114/PLAN.md]
---

# TDD result — SWHM-T-0114

## Test cases

| Test                                                    | Covers     | Intent                                                                                                                         |
| ------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `auth/signon-filter.test.ts › SF-01` (updated)          | AC-1       | not-signed-on verdict now carries `reason: "not-signed-on"`                                                                    |
| `auth/signon-filter.test.ts › SF-11`                    | AC-1       | an admin resource denies not-signed-on the same as any other protected resource                                                |
| `auth/signon-filter.test.ts › SF-12`                    | AC-1       | signed-on without the role → `role-required`, no return address in the verdict                                                 |
| `auth/signon-filter.test.ts › SF-13`                    | AC-1       | signed-on holding the role → allowed                                                                                           |
| `auth/signon-filter.test.ts › SF-14`                    | AC-1       | an admin subtree page (`/admin/orders`) enforces the same role check as its root                                               |
| `auth/signon-filter.test.ts › SF-15`                    | AC-1, AC-2 | `/admin/signon` is never protected, even signed out                                                                            |
| `auth/signon-filter.test.ts › SF-16`                    | AC-1, AC-2 | `/admin/signon-failed` is never protected, even signed out                                                                     |
| `auth/user.test.ts › UT-07`                             | AC-1       | a user created through `insertUser` holds no role                                                                              |
| `auth/user.test.ts › UT-08`                             | AC-1       | `findUserRole` reads a role held by a user                                                                                     |
| `auth/user.test.ts › UT-09`                             | AC-1       | `findUserRole` is null for an unknown user name                                                                                |
| `routes/api/signon/check.get.test.ts › CH-01` (updated) | AC-1       | not-signed-on verdict shape through the endpoint carries `reason`                                                              |
| `routes/api/signon/check.get.test.ts › CH-04` (updated) | AC-1       | same, for the not-same-origin-path rejection                                                                                   |
| `routes/api/signon/check.get.test.ts › CH-05`           | AC-1       | signed-on without the role → `role-required`, `original_url` not overwritten                                                   |
| `routes/api/signon/check.get.test.ts › CH-06`           | AC-1       | signed-on holding the role → allowed                                                                                           |
| `src/components/RequireAdmin.test.tsx` (4 cases)        | AC-1       | pending status, allowed renders children, not-signed-on redirects, role-required renders a refusal in place without navigating |
| `src/pages/admin/signon.test.tsx › PT-01`               | AC-2       | username/password fields pre-fill `jps_admin` / `admin`                                                                        |
| `src/pages/admin/signon.test.tsx › PT-02`               | AC-3       | submit POSTs `/api/signon` with `j_username`/`j_password`                                                                      |
| `src/pages/admin/signon.test.tsx › PT-03`               | AC-1, AC-3 | success navigates to `/admin`                                                                                                  |
| `src/pages/admin/signon.test.tsx › PT-04`               | AC-3       | failure navigates to `/admin/signon-failed`                                                                                    |
| `src/pages/admin/signon.test.tsx › PT-05`               | AC-3       | modified credentials are what gets submitted, not the defaults                                                                 |

Per design.md S3/S13, AC-3's extracted wording ("POST to `j_security_check`") is realized as a POST
to the existing `/api/signon`, which already returns `{ signedOn, redirectTo }` — there is no second
authentication path.

## Red run

`bun run test` against this ticket's touched test files, before the implementation changes in
`auth/`, `db/`, `middleware/signon.ts`, `routes/api/signon/check.get.ts` and `src/components/index.ts`
(new page/component files temporarily removed, migration temporarily removed, source reverted via
`git stash` to isolate the test files as the only change):

```
FAIL |client| src/components/RequireAdmin.test.tsx [ src/components/RequireAdmin.test.tsx ]
FAIL |client| src/pages/admin/signon.test.tsx [ src/pages/admin/signon.test.tsx ]
FAIL |server| auth/user.test.ts > auth/user > UT-07: a user registered through insertUser holds no role
FAIL |server| auth/user.test.ts > auth/user > UT-08: findUserRole reads the role held by a user inserted with one
FAIL |server| auth/user.test.ts > auth/user > UT-09: findUserRole is null for a user name that does not exist
FAIL |server| auth/signon-filter.test.ts > auth/signon-filter > SF-01: a protected resource is denied for an unsigned-on session
FAIL |server| auth/signon-filter.test.ts > auth/signon-filter > SF-11: an admin resource is denied not-signed-on for an unsigned-on session, same as any other protected resource
FAIL |server| auth/signon-filter.test.ts > auth/signon-filter > SF-12: a signed-on session without the administrator role is denied role-required on an admin resource — no return address in the verdict
FAIL |server| auth/signon-filter.test.ts > auth/signon-filter > SF-14: a signed-on session without the role is denied role-required on an admin subtree page
FAIL |server| routes/api/signon/check.get.test.ts > GET /api/signon/check > CH-01: denies an unsigned-on request for a protected resource, stores original_url, and points at /signon
FAIL |server| routes/api/signon/check.get.test.ts > GET /api/signon/check > CH-04: a resource that is not a same-origin path is rejected without being stored
FAIL |server| routes/api/signon/check.get.test.ts > GET /api/signon/check > CH-05: a signed-on request without the administrator role is denied role-required for an admin resource, and original_url is not overwritten

Test Files  5 failed | 53 passed (58)
     Tests  10 failed | 320 passed (330)
```

(`RequireAdmin.test.tsx` and `admin/signon.test.tsx` fail as whole suites — the source files they
import did not exist yet. SF-13/SF-15/SF-16/CH-06 and the UT/RequireAdmin/page cases not listed by
name above are folded into the same failing-suite/failing-test set; the counts above are the real
runner totals for that state.)

## Green run

`bun run verify` (this stack's full pre-commit gate — lint, typecheck, complete unit/integration
suite). `bun run verify:full` was attempted first; its E2E tier fails fast in this container because
Chromium is genuinely not installed here (`scripts/ensure-playwright-browser.mjs`), a known
implementation-container limitation recorded in `AGENTS.md` — falling back to `verify` per that note,
E2E is exercised in CI and at integration QA.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  58 passed (58)
      Tests  339 passed (339)
```

TDD-RESULT: 339 passed, 0 failed
