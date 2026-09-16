---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0117
branch: vortex/feat/SWHM-T-0117-admin-api-module-and-shared-request-guar-3b64c852
upstream: [artifacts/SWHM-S-0012/SWHM-T-0117/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0117: Admin API module and shared request guard

## What changed

Added the `admin/` module: `requireAdmin(event)` resolves the session via the existing
`useSignOnSession`, checks the role via `findUserRole`, and returns either an `AdminContext`
(username) or an `AdminError` (`{ error: string }`) with the response status already set (401/403).
Registered `admin/**` in both `vitest.config.ts` project lists so its tests run in the `server`
project rather than jsdom. No route exists yet — SWHM-T-0118 is the first caller.

No design mockup applies: this ticket has no user-visible surface (no route, no page).

## Files

- `admin/types.ts` — `AdminError` / `AdminContext` shared shapes (new).
- `admin/request.ts` — `requireAdmin` + `isAdminError` guard (new).
- `admin/request.test.ts` — guard tests, real `H3Event`, no server (new).
- `vitest.config.ts` — added `admin/**` to the `server` project's `include` and the `client`
  project's `exclude`.

## AC coverage

- AC-1 (no session → 401 JSON, no handler runs) — `admin/request.ts`, covered by `AR-01`.
- AC-2 (signed-on, no role → 403 JSON, distinct from 401) — `admin/request.ts`, covered by `AR-02`,
  `AR-03`.
- AC-3 (one `{ error: string }` shape, no XML, no discriminator) — `admin/types.ts` `AdminError`,
  same shape returned on both refusals; covered by `AR-01`, `AR-02`.
- AC-4 (administrator route gets the username from the guard) — `AdminContext.userName`, covered by
  `AR-04`.

## Verification

```
$ bun --bun vitest run admin/request.test.ts   # red, before admin/request.ts existed
Cannot find module './request' — 1 failed, no tests

$ bun run verify
lint: 0 errors
typecheck: 0 errors
test: 59 files passed, 343 passed, 0 failed
```

See `tdd-test-result.md` — `TDD-RESULT: 343 passed, 0 failed`.

`bun run test:e2e` (part of `verify:full`) fails at the Chromium preflight in this container, a
known gap for implementation containers (AGENTS.md § Notes from previous agents) — not retried.

## Notes

`requireAdmin` calls `useSignOnSession`, whose name incidentally starts with "use" but is not a
React hook (it's a server-side session accessor in `auth/session.ts`, owned by another ticket this
sprint). `eslint-plugin-react-hooks` flags calling it from a plain named function; suppressed with a
one-line justified `eslint-disable-next-line react-hooks/rules-of-hooks` on that call, since renaming
either function is out of this ticket's file ownership.
