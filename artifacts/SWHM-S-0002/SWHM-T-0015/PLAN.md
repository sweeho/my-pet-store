# PLAN — SWHM-T-0015 · User entity

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirement: **Create new user account**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § User Entity and
§ Password Verification first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the surfaces
this ticket owns and `artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` for S2, S3 and S4.
Do not re-derive them here.

## Design reference

Idea SWHM-I-0002 carries **no design blocks** — the manifest is empty, so there is nothing
under `artifacts/SWHM-S-0002/design/` and no mockup to match. This ticket has no UI.

## Objective

Give the capability its stored User: an `auth_users` table, the module that reads and writes
it, and password hashing — plus the one-line Vitest change that lets a db-backed module
outside `routes/` be tested at all. This is the first ticket in the chain; everything else
imports what it leaves behind.

## Steps

1. **Schema.** Add `authUsers` to `db/schema.ts` exactly as INTERFACES.md § Data model
   declares it. Leave the existing `users` table alone — it is template demo data probed by
   `e2e/smoke.spec.ts` and is a fixed contract (S2).
2. **Migration.** Generate the migration into `drizzle/` and commit it, including the updated
   `drizzle/meta/`. A schema change without its migration is not complete (ARCHITECTURE.md
   § Data model).
3. **Module.** Create `auth/user.ts` with `findUser`, `insertUser` and `matchPassword`
   (INTERFACES.md § Module surfaces). `auth/` is a plain module directory — Nitro does not
   scan it, so nothing here becomes a route.
4. **Hashing** (design.md § Password Verification, deviating per S3). Store
   `scrypt$<salt>$<derived>` using `node:crypto` `randomBytes` + `scryptSync`; compare with
   `timingSafeEqual`. No new dependency. Matching stays exact and case-sensitive, so the
   scenarios' true/false outcomes are unchanged.
5. **Test placement.** Widen the `server` project include in `vitest.config.ts` to
   `["routes/**/*.test.ts", "auth/**/*.test.ts"]` and add `auth/**` to the `client` project's
   exclude. Keep the split rule itself intact — db-touching tests run under node, everything
   else in jsdom. No other ticket touches this file.
6. **Tests.** `auth/user.test.ts`: a user inserted with valid credentials is found by
   `findUser` with its `user_name` as the key; `matchPassword` is true for the exact password
   and false for a different-cased one; the stored `password` column is not the plaintext.

## File / module ownership

May create or modify — nothing else:

| Path                              | Why                                              |
| --------------------------------- | ------------------------------------------------ |
| `db/schema.ts`                    | adds `authUsers`; the `users` table is untouched |
| `drizzle/*.sql`, `drizzle/meta/*` | generated migration for that schema change       |
| `auth/user.ts`                    | NEW — entity access and password hashing         |
| `auth/user.test.ts`               | NEW — unit cover for the above                   |
| `vitest.config.ts`                | server/client project include + exclude only     |

Out of ownership: `db/client.ts`, `routes/`, `middleware/`, `src/`, `e2e/`, everything under
`openspec/` (including ticking a `tasks.md` box — the platform stamps those on merge),
`artifacts/`, and the repository-root narrative documents.

## Definition of Done

AC-1 is met by steps 1–4 and proved by the assertions in step 6. The criterion restates the
scenario "User account is created with valid credentials" in
`openspec/changes/swhm-i-0002-user-authentication-sign-on/specs/user-authentication/spec.md`,
which is what validation reports a verdict against at integration QA.
