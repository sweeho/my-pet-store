---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0016
branch: vortex/feat/SWHM-T-0016-user-creation-validation-4dd8786b
upstream: [artifacts/SWHM-S-0002/SWHM-T-0016/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0016: User creation validation

## What changed

Added `auth/validation.ts` with `validateNewUser`, enforcing the username length/character
constraints and the password length constraint with the exact error text the delta spec
names. Wired it into `auth/user.ts`'s `insertUser` so the write path cannot persist a user
that violates them.

## Files

- `auth/validation.ts` — new: `MAX_USERID_LENGTH`, `MAX_PASSWD_LENGTH`, `CreateUserError`, `validateNewUser`.
- `auth/validation.test.ts` — new: one assertion per scenario.
- `auth/user.ts` — `insertUser` calls `validateNewUser` before the insert; nothing else changed.

## AC coverage

- AC-1 (username > 25 chars fails with exact message) — `validation.ts` length check, covered by `VT-02`.
- AC-2 (username with `%`/`*` fails with exact message) — `validation.ts` character check, covered by `VT-03`/`VT-04`.
- AC-3 (username at max length is accepted) — boundary at `MAX_USERID_LENGTH`, covered by `VT-01`/`VT-06`.
- AC-4 (username over max length is rejected) — same length check as AC-1, covered by `VT-02`.
- AC-5 (password over max length fails with exact message, `MAX_PASSWD_LENGTH = 32` per SPEC-DISCREPANCIES S8) — `validation.ts` password check, covered by `VT-05`.

## Verification

```
$ bun --bun vitest run auth/validation.test.ts   # red, before validation.ts existed
Cannot find module './validation'

$ bun run verify                                  # green, full gate
lint ✓  typecheck ✓  30 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 30 passed, 0 failed`.

## Notes

`verify:full`'s E2E tier could not run — this container has no Chromium installed
(`scripts/ensure-playwright-browser.mjs` fails fast and points at the QA-phase/CI container
instead of a local install); `verify` (lint + typecheck + full unit/integration suite) is
the gate actually satisfied here, per no-retry/no-install guidance.
