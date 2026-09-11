---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0020
branch: vortex/feat/SWHM-T-0020-cookie-persistence-cb5c0c96
upstream: [artifacts/SWHM-S-0002/SWHM-T-0020/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0020: Cookie persistence

## What changed

Added the server-side helpers that set and clear the `bp_signon` "remember my username" cookie
(`auth/remember-cookie.ts`), and the browser-side helper the sign-in form will pre-fill from
(`src/utils/cookies.ts`), exported through the existing `src/utils` barrel.

## Files

- `auth/remember-cookie.ts` — new: `REMEMBER_COOKIE`, `REMEMBER_COOKIE_MAX_AGE`, `rememberUsername`, `forgetUsername`.
- `auth/remember-cookie.test.ts` — new: `Set-Cookie` header assertions for both helpers.
- `src/utils/cookies.ts` — new: `readCookie(name)`, parses `document.cookie`.
- `src/utils/cookies.test.ts` — new: jsdom cover (present, missing, encoded, prefix-collision).
- `src/utils/index.ts` — re-exports `./cookies`, mirroring the existing `./cn` export.

## AC coverage

- AC-1 (selecting "remember" creates `bp_signon` with the username and `maxAge` 2,678,400) — `rememberUsername` in `remember-cookie.ts`, covered by `RC-01`.
- AC-2 (not selecting it removes `bp_signon` via `maxAge` 0) — `forgetUsername` in `remember-cookie.ts` (uses h3's `deleteCookie`, itself `setCookie(..., { maxAge: 0 })`), covered by `RC-02`.

## Verification

```
$ bun --bun vitest run auth/remember-cookie.test.ts src/utils/cookies.test.ts   # red, before the implementation files existed
Cannot find module './remember-cookie' / Failed to resolve import "./cookies"

$ bun run verify                                                                 # green, full gate
lint ✓  typecheck ✓  54 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 54 passed, 0 failed`.

## Notes

`verify:full`'s E2E tier could not run — this container has no Chromium installed
(`scripts/ensure-playwright-browser.mjs` fails fast and points at the QA-phase/CI container
instead of a local install); `verify` (lint + typecheck + full unit/integration suite) is
the gate actually satisfied here, per no-retry/no-install guidance. Wiring these helpers into
the sign-in request and form is SWHM-T-0021/SWHM-T-0023's scope, not this ticket's.
