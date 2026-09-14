# PLAN — SWHM-T-0082: boilerplate `/users` scaffold pages still ship

Change: `swhm-s-0008-bugfix-found-by-inspector`
Requirement: _Product-branded application shell_ (`application-foundation`)

## Design reference

No design blocks — idea-less defect batch, no `artifacts/SWHM-S-0008/design/` directory. Nothing
visual is added; three screens are removed.

## Objective

Make `/users`, `/users/<id>` and `/users/profile` unreachable, without touching the database-backed
API that shares their name.

## Steps

1. Read `design.md` § D-3 first. It states precisely which half of the template's matched
   pages/API pair goes and which stays, and it is the one thing that makes this ticket go wrong if
   skipped.
2. Delete `src/pages/users/index.tsx`, `src/pages/users/[id].tsx` and `src/pages/users/profile.tsx`,
   and the now-empty `src/pages/users/` directory. Nothing imports them — the only references are
   the three files linking to each other. With the files gone, `src/pages/[...all].tsx` catches
   those paths.
3. Add `e2e/legacy-routes.spec.ts` asserting each of the three paths renders the not-found screen,
   and that `GET /api/users` still answers — the second assertion is what proves the deletion stayed
   on the page side.

**Do not** delete, move or edit `routes/api/users/index.get.ts`, `routes/api/users/[id].ts`, the
`users` table in `db/schema.ts`, or any of their tests. `e2e/smoke.spec.ts` probes `GET /api/users`
deliberately as the canary for the Bun/`bun:sqlite` constraint (ARCHITECTURE.md § Cross-cutting
constraints); breaking it is the failure mode § D-3 warns about.

## File / module ownership

Delete:

- `src/pages/users/index.tsx`, `src/pages/users/[id].tsx`, `src/pages/users/profile.tsx`

Create:

- `e2e/legacy-routes.spec.ts`

Do not modify any other file. In particular `routes/api/users/**`, `db/schema.ts` and
`e2e/smoke.spec.ts` are out of bounds.

## Definition of Done

- AC-1 and AC-2 on the ticket are met.
- `routes/api/users/index.get.test.ts`, `routes/api/users/[id].test.ts` and `e2e/smoke.spec.ts` are
  byte-identical to their state before this ticket and still pass.
- No file outside the ownership map above is changed.
