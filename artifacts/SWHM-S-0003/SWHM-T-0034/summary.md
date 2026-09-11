---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0003
ticket: SWHM-T-0034
branch: vortex/feat/SWHM-T-0034-account-data-model-and-duplicate-account-41c69b85
upstream: [artifacts/SWHM-S-0003/SWHM-T-0034/PLAN.md]
downstream: [artifacts/SWHM-S-0003/SWHM-T-0035/PLAN.md, artifacts/SWHM-S-0003/SWHM-T-0036/PLAN.md]
---

# Summary — SWHM-T-0034: Account data model and duplicate-account rejection

## What changed

Added the six tables an account holds beyond credentials (`customers`, `accounts`,
`profiles`, `contact_info`, `addresses`, `card_metadata`) and a new `account/` capability
module (`createCustomer`, `findAccount`, `getAccountOrDefaults`, `updateAccount`, expiry
parsing, validation) exactly to `artifacts/SWHM-S-0003/INTERFACES.md`. Registration
(`auth/user.ts:insertUser`) now calls `createCustomer` on success, and a repeat
registration is rejected in `auth/validation.ts:validateNewUser` with a `CreateUserError`
naming the user name, instead of reaching the `auth_users` primary-key constraint.

## Files

- `db/schema.ts` — added the six tables per INTERFACES.md § Tables; 1:1 throughout, keyed
  on `user_name`, `ON DELETE CASCADE` upward.
- `drizzle/0003_quick_clea.sql` + `drizzle/meta/*` — generated migration for those tables.
- `account/types.ts`, `account/vocabulary.ts` — new: the fixed type shapes and value
  vocabularies, verbatim from INTERFACES.md.
- `account/card.ts` — new: `expiryMonth`, `expiryYear` (legacy `01`/`2010` fallbacks),
  `lastFour`.
- `account/customer.ts` — new: `createCustomer`, `findAccount`, `getAccountOrDefaults`,
  `updateAccount`. `createCustomer` writes all six rows so a fully-registered customer
  always has a full, readable row set; `getAccountOrDefaults` falls back to the spec's
  defaults only when no `accounts` row exists at all (a pre-SWHM-S-0002 customer).
  `updateAccount` reduces any supplied `cardNumber` to `lastFour` and never stores it.
- `account/card.test.ts`, `account/validation.test.ts`, `account/customer.test.ts` — new.
- `auth/validation.ts` — `validateNewUser` now checks `auth_users` for the user name and
  throws `CreateUserError("User ID ${userName} already exists")`; signature unchanged.
- `auth/user.ts` — `insertUser` calls `createCustomer(userName)` after the insert;
  signature unchanged.
- `auth/validation.test.ts`, `auth/user.test.ts` — extended with the duplicate-rejection
  and account-creation cases.
- `vitest.config.ts` — added `account/**` to the `server` project's include and the
  `client` project's exclude.
- `tsconfig.node.json` — added `"account"` to `include` (see Notes).

## AC coverage

- AC-1 (creation produces an account row `status="active"` + a profile row, one call) —
  `createCustomer`, covered by `CU-01`, `UT-05`.
- AC-2 (profile defaults) — `CU-02`.
- AC-3 (contact info + exactly one address row) — `CU-05`.
- AC-4 (`"12/2025"` → month `"12"`, year `"2025"`) — `CT-01`/`CT-02`, `CU-08`.
- AC-5 (card metadata holds only type/expiry/last-four; no card-number column) —
  `card_metadata` has no such column (`db/schema.ts`), and `CU-07` asserts a full number
  reduces to `lastFour`.
- AC-6 (duplicate registration → `CreateUserError` naming the user name, no new row) —
  `VT-07`, `UT-06`.
- AC-7 (migration committed) — `drizzle/0003_quick_clea.sql` + `drizzle/meta/*`.
- AC-8 (new module's tests run in the `server` project and pass) — `vitest.config.ts`
  change; green run below.

## Verification

```
$ bun run test                          # red, before account/*.ts and the auth/* changes existed
5 test files failed to even collect (module not found); VT-07 failed
1 failed | 70 passed (71)

$ bun run verify                        # green, full gate
lint ✓  typecheck ✓  102 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 102 passed, 0 failed`.

## Notes

- Planning's artifacts for this sprint (`PLAN.md` × 3, `INTERFACES.md`,
  `SPEC-DISCREPANCIES.md`, the design export, and the `design.md`/`proposal.md`/`tasks.md`
  rewrite) had been committed to `origin/vortex/ticket/swhm-t-0031` instead of the sprint
  branch `vortex/sprint/swhm-s-0003-849ec4ef`. That commit (`fd1c86f`) is a direct child of
  this ticket branch's fork point, so it was fast-forwarded in rather than re-authored —
  no content was invented, and the same commit now carries the same hash on this branch.
  Flagging for planning in case the sprint branch itself still needs it directly.
- `tsconfig.node.json`'s `include` never listed `account/` (a new directory this ticket
  creates). Additive, one line, no behavior change elsewhere — a minor deviation per the
  deviation protocol, not a block, same shape as the `"auth"` addition SWHM-T-0018 made.
- `createCustomer` inserts all six tables' rows (not just `accounts`/`profiles`), so a
  fully-registered customer never hits the "no row" fallback path in `getAccountOrDefaults`
  — that fallback is reserved for a customer who registered before this ticket shipped.
  This follows INTERFACES.md § Tables ("registration creates the rows before the customer
  has supplied anything") and is the reading `design.md` D4 assumes.
- `verify:full`'s E2E tier cannot launch Chromium in this container (not installed);
  `verify` (lint + typecheck + full test suite) is the gate actually satisfied here, per
  AGENTS.md's own guidance to fall back rather than retry or install.
