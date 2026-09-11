---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0022
branch: vortex/feat/SWHM-T-0022-account-creation-workflow-e49ed622
upstream: [artifacts/SWHM-S-0002/SWHM-T-0022/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0022: Account creation workflow

## What changed

Added `POST /api/signon/create-user`, turning registration into one request: reject a
mismatched password confirmation without touching the database, create the account via
`createUser()`, sign the new customer's session on, and pass a `CreateUserError`'s message
through untouched on failure.

## Files

- `routes/api/signon/create-user.post.ts` — new: reads `j_username`/`j_password`/`j_password_2`, the confirmation check, the create-and-sign-on path, and the validation-error passthrough.
- `routes/api/signon/create-user.post.test.ts` — new: route cover, real-`H3Event` pattern from `routes/api/signon/index.post.test.ts`.

## AC coverage

- AC-1 (valid credentials create a new User entity) — the create-and-sign-on path, covered by `CU-01`.
- AC-2 (username > 25 chars fails with "User ID cant be more than 25 chars long") — `auth/validation.ts`'s `CreateUserError` passed through untouched, covered by `CU-02`.
- AC-3 (username with `%`/`*` fails with "User Id cannot have '%' or '\*' characters") — same passthrough, covered by `CU-03`.

## Verification

```
$ bun --bun vitest run routes/api/signon/create-user.post.test.ts   # red, before the implementation file existed
Cannot find module './create-user.post'

$ bun run verify                                                     # green, full gate
lint ✓  typecheck ✓  63 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 63 passed, 0 failed`.

## Notes

`verify:full`'s E2E tier could not run — this container has no Chromium installed
(`scripts/ensure-playwright-browser.mjs` fails fast and points at the QA-phase/CI container
instead of a local install); `verify` (lint + typecheck + full unit/integration suite) is
the gate actually satisfied here, per no-retry/no-install guidance. The sign-up form and
`/user-creation-error` page are SWHM-T-0023's scope, not this ticket's.
