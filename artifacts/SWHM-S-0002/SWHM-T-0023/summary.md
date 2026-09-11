---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0023
branch: vortex/feat/SWHM-T-0023-user-interfaces-cfcd2f9e
upstream: [artifacts/SWHM-S-0002/SWHM-T-0023/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0023: User interfaces

## What changed

Built the capability's five screens and the client route guard: `/signon` (sign-in + new-customer sign-up), `/signon-failed`, `/user-creation-error`, and `/signon-welcome` + `/customer` wrapped in `RequireSignOn`. No design blocks exist on the idea (confirmed via `PLAN.md` § Design reference — `a2a_get_idea_design` returned an empty manifest); built from the existing design system (`DESIGN.md`) and the shape of `src/pages/*.tsx`/`src/components/ui/button.tsx`, avoiding the known-broken `bg-destructive`/`text-destructive-foreground` pair per S11.

## Files

- `src/pages/signon.tsx` — NEW. Sign-in form (`j_username`/`j_password`/`j_remember_username`, posts to `POST /api/signon`, navigates to `redirectTo`) and a sign-up form (`j_username`/`j_password`/`j_password_2`, client-side mismatch check, posts to `POST /api/signon/create-user`). The two forms use distinct field `id`s (`j_username` vs `signup_j_username`, etc.) and are each wrapped in an `aria-label`led `<form>` so tests can scope past the shared "Username"/"Password" label text.
- `src/pages/signon.test.tsx` — NEW. Field/checkbox/submit presence for both forms, plus the cookie pre-fill/empty-default cases.
- `src/pages/signon-failed.tsx` — NEW. Displays the scenario's exact failure message.
- `src/pages/signon-failed.test.tsx` — NEW. Verbatim-message cover.
- `src/pages/user-creation-error.tsx` — NEW. Displays the `error` passed via `navigate(..., { state })` from the sign-up handler, with a link back to `/signon`.
- `src/pages/signon-welcome.tsx`, `src/pages/customer.tsx` — NEW. Minimal protected pages (heading + signed-in username from `GET /api/signon/session`), each wrapped in `RequireSignOn`.
- `src/components/RequireSignOn.tsx` — NEW. Calls `GET /api/signon/check?resource=<current path>` on mount; renders nothing until allowed, navigates to `redirectTo` on denial.
- `src/components/index.ts` — exports `RequireSignOn`, matching the existing barrel pattern.

## AC coverage

- AC-1 (sign-in form shows username/password/remember-checkbox/submit) — `signon.tsx`; covered by `signon.test.tsx › renders the sign-in form...`.
- AC-2 (username pre-populates from the `bp_signon` cookie) — `readCookie("bp_signon")` seeds the field's initial state; covered by `› pre-populates the username field...`.
- AC-3 (username defaults to empty without the cookie) — covered by `› defaults the username field to empty...`.
- AC-4 (sign-up form shows username/password/password-repeat/submit) — covered by `› renders the sign-up form...`.
- AC-5 (sign-on error page shows the exact failure message) — `signon-failed.tsx`; covered by `signon-failed.test.tsx`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run src/pages/signon.test.tsx src/pages/signon-failed.test.tsx   # red
Failed to resolve import "./signon" / "./signon-failed"

$ bun run verify                                                                                    # green, full browser-free gate
eslint ✓  tsc --build ✓
Test Files  20 passed (20)
     Tests  68 passed (68)
```

See `tdd-test-result.md` — `TDD-RESULT: 68 passed, 0 failed`.

`bun run test:e2e` was attempted per CLAUDE.md's stated preference for `verify-full` in this project's containers; its preflight (`scripts/ensure-playwright-browser.mjs`) reported Chromium is genuinely not installed here and directed a fallback to `bun run verify` rather than installing it. I could not open a browser to manually click through `/signon` in this container; the browser-level flows across these screens are SWHM-T-0024's per `PLAN.md`'s Definition of Done.

## Notes

Per `PLAN.md`'s file/module ownership table, only `signon.test.tsx` and `signon-failed.test.tsx` are owned test files — `user-creation-error.tsx`, `signon-welcome.tsx`, `customer.tsx` and `RequireSignOn.tsx` have no dedicated test file, matching the same pattern SWHM-T-0019 used for `middleware/signon.ts` (thin/orchestration code exercised indirectly).
The sign-up form's mismatch-confirmation check is client-side only, per step 3 ("the server checks it too, and that is the enforcement") — no test asserts it since it is not in `PLAN.md`'s step 6 list.
