---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0114
branch: vortex/feat/SWHM-T-0114-admin-authentication-and-role-based-acce-7cc64596
upstream: [artifacts/SWHM-S-0012/SWHM-T-0114/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0114: Admin authentication and role-based access

## What changed

Gave `auth_users` a nullable `role` column, seeded a development `jps_admin`/`admin` administrator
row, and grew `evaluateAccess()` to a second dimension so it distinguishes "not signed on" from
"signed on without the role". The admin path subtree joined `PROTECTED_RESOURCES` (prefix-matched,
with `/admin/signon` and `/admin/signon-failed` carved out as public entry points), both enforcement
points (`middleware/signon.ts`, `routes/api/signon/check.get.ts`) now answer 403 for the role-missing
case, and a `RequireAdmin` client guard plus an `/admin/signon` page (posting to the existing
`POST /api/signon`) were added.

## Files

- `db/schema.ts` — nullable `role` column on `auth_users`.
- `drizzle/0005_mighty_gertrude_yorkes.sql`, `drizzle/meta/*` — the generated migration.
- `db/client.ts` — seeds the `jps_admin`/`admin` row (hash inlined, not imported from `auth/user.ts` — see Notes).
- `auth/protected-resources.ts` — `ProtectedResource.requiresRole`, `ADMIN_ROLE`/`ADMIN_*_PAGE` constants, admin subtree entries, prefix matching via new `findProtectedResource`.
- `auth/signon-filter.ts` — `AccessVerdict` gains a `reason` discriminant (`not-signed-on` | `role-required`); `evaluateAccess` takes an optional `role`.
- `auth/user.ts` — `AuthUser.role`, new `findUserRole`, `insertUser` sets `role: null`.
- `middleware/signon.ts` — looks up the caller's role, answers 403 (no return address recorded) on `role-required`.
- `routes/api/signon/check.get.ts` — same role lookup; `setOriginalUrl` now only fires for `not-signed-on`.
- `src/components/RequireAdmin.tsx` (+ `.test.tsx`) — client guard: pending status, redirect on `not-signed-on`, in-place refusal on `role-required`.
- `src/components/index.ts` — exports `RequireAdmin`.
- `src/pages/admin/signon.tsx` (+ `.test.tsx`) — the admin sign-in page from `mockup-admin-login.html`.
- `auth/signon-filter.test.ts`, `auth/user.test.ts`, `routes/api/signon/check.get.test.ts` — extended/updated for the new verdict shape.

## AC coverage

- AC-1 (authenticate, create session, grant access to the admin interface) — `auth/signon-filter.ts` `evaluateAccess` allows a signed-on session holding `ADMIN_ROLE` on an admin resource; session creation is the existing `POST /api/signon` path. Covered by `signon-filter.test.ts › SF-11..SF-16`, `check.get.test.ts › CH-05/CH-06`, `RequireAdmin.test.tsx`.
- AC-2 (login form pre-populated with `jps_admin`/`admin`) — `src/pages/admin/signon.tsx` initial state. Covered by `signon.test.tsx › PT-01`.
- AC-3 (form posts credentials to sign the administrator in) — per design.md S3/S13, realized as a POST to the existing `/api/signon` (not `j_security_check`, which does not exist here) with `j_username`/`j_password`. Covered by `signon.test.tsx › PT-02..PT-05`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  58 passed (58)
      Tests  339 passed (339)
```

`bun run verify:full`'s E2E tier fails fast in this container — Chromium is genuinely not
installed (`scripts/ensure-playwright-browser.mjs`), the known implementation-container limitation
`AGENTS.md` already records. Did not retry or attempt to install a browser; E2E runs in CI and at
integration QA. See `tdd-test-result.md` — `TDD-RESULT: 339 passed, 0 failed`.

## Notes

`db/client.ts`'s admin seed does not import `hashPassword` from `auth/user.ts`. `auth/user.ts`
reaches `db/client.ts` circularly through `account/customer.ts` and `auth/validation.ts`; when a
test file imports an `auth/`/`account/` module before `db/client.ts` (most of them do), `auth/user.ts`
becomes the cycle's entry point and calling its `hashPassword` from `db/client.ts`'s top level ran
into a real TDZ `ReferenceError` on `SCRYPT_KEY_LENGTH` — reproduced during this ticket. `db/client.ts`
now inlines the same scrypt format instead. This is an implementation detail, not an interface
change: `auth/user.ts`'s `AuthUser`/`findUserRole` contract is unaffected.
