---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0082
branch: vortex/fix/SWHM-T-0082-bootstrap-template-scaffold-routes-users-b226c149
upstream: [artifacts/SWHM-S-0008/SWHM-T-0082/PLAN.md]
downstream: [artifacts/SWHM-S-0008/qa-test-report.md]
---

# Fix note — SWHM-T-0082: Bootstrap-template scaffold routes (/users, /users/:id, /users/profile) still live in production build

## Root cause

The Tailwind Plus boilerplate shipped a matched demo pair: example pages under `src/pages/users/`
and an example API under `routes/api/users/`. `vite-plugin-pages` publishes any file that exists
under `src/pages/` as a public route with no registration step, so the three page files
(`index.tsx`, `[id].tsx`, `profile.tsx`) stayed reachable and rendered hardcoded placeholder people
("Alice Johnson", "John Doe", etc.) because nothing in the product ever linked to or replaced them
— the team built `/customer` and `/signon` beside them instead of on top of them. Root cause and the
pages/API split are recorded in `openspec/changes/swhm-s-0008-bugfix-found-by-inspector/design.md`
§ D-3.

## Fix

Deleted the three scaffold page files only. With no file at those paths, `vite-plugin-pages`'s
generated route table has no match for `/users`, `/users/:id` or `/users/profile`, so they fall
through to `src/pages/[...all].tsx` (the existing not-found catch-all) exactly like any other
unmatched path. `routes/api/users/index.get.ts`, `routes/api/users/[id].ts` and the `users` table in
`db/schema.ts` are untouched — the fix is scoped to the page side of the pair, per design.md § D-3's
explicit warning that deleting the API alongside the pages is the way this ticket goes wrong.

## Regression test

`e2e/legacy-routes.spec.ts` — a real browser navigates to `/users`, `/users/1` and `/users/profile`
and asserts the not-found heading renders and neither scaffold's copy ("Users List" / "User
Profile") appears, plus a fourth assertion that `GET /api/users` still returns `{ users: [...] }`.
Red→green recorded in `tdd-test-result.md`.

## Files touched

- `src/pages/users/index.tsx` — deleted (scaffold `/users` list page).
- `src/pages/users/[id].tsx` — deleted (scaffold `/users/:id` detail page).
- `src/pages/users/profile.tsx` — deleted (scaffold `/users/profile` page).
- `e2e/legacy-routes.spec.ts` — new regression test (see above).

## Notes

This container has no Chromium installed (`scripts/ensure-playwright-browser.mjs` fails the E2E
preflight), so `e2e/legacy-routes.spec.ts` could not be executed locally, before or after the fix —
see `tdd-test-result.md` § Red run / Green run for the documented, established limitation
(`AGENTS.md` § Notes from previous agents) and how it was verified instead.
