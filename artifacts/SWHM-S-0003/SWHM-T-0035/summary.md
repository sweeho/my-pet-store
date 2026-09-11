---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0003
ticket: SWHM-T-0035
branch: vortex/feat/SWHM-T-0035-customer-account-api-860fd3e5
upstream: [artifacts/SWHM-S-0003/SWHM-T-0035/PLAN.md]
downstream: [artifacts/SWHM-S-0003/qa-test-report.md]
---

# Summary — SWHM-T-0035: Customer account API

## What changed

Added `GET /api/customer` and `PUT /api/customer`, resolving the customer from the session and
calling only the existing `account/` module (SWHM-T-0034) — `getAccountOrDefaults`,
`validateAccountUpdate`, `updateAccount`. No `account/**` or `db/schema.ts` change.

## Files

- `routes/api/customer/index.get.ts` — reads the signed-on customer's account, 401 with no session.
- `routes/api/customer/index.put.ts` — validates and applies an `AccountUpdate`, 401/400 on failure.
- `routes/api/customer/index.get.test.ts` — read-path coverage.
- `routes/api/customer/index.put.test.ts` — update-path coverage, chained with a GET re-read.

## AC coverage

- AC-1 (one response carries contact/address/card/profile) — `index.get.ts`, `GC-01`.
- AC-2 (no account row → defaults, not an error) — `getAccountOrDefaults` call, `GC-02`.
- AC-3 (update reflected in a subsequent read) — `index.put.ts`, `PC-01`.
- AC-4 (no session → refused, no account data) — 401 branch in both routes, `GC-03` / `PC-02`.
- AC-5 (out-of-vocabulary language rejected, unchanged) — `validateAccountUpdate` call, `PC-03`.
- AC-6 (out-of-vocabulary category rejected, unchanged) — same call, `PC-04`.
- AC-7 (isolation between customers) — user name taken only from the session, `PC-05`.
- AC-8 (route tests under `routes/` and passing) — both test files, see `tdd-test-result.md`.

## Verification

```
$ bun --bun vitest run routes/api/customer   # red, before the routes existed
2 test files failed to import — see tdd-test-result.md
$ bun run verify                              # green, after implementation
lint ✓  typecheck ✓  110 tests passed, 0 failed
```

`bun run verify:full`'s E2E tier failed on Chromium not being installed in this container
(AGENTS.md § Notes from previous agents already records this for SWHM-S-0002); fell back to
`bun run verify` per that note. Full detail in `tdd-test-result.md`.

## Notes

- `readBody<AccountUpdate>(event)` can resolve to `undefined` for an empty body; defaulted to `{}`
  so `validateAccountUpdate`/`updateAccount` always receive an `AccountUpdate` — a typing detail,
  not a plan deviation.
- A test helper that calls `useSignOnSession` had to be named `useSignedOnCookie` (not a plain
  helper name) to satisfy `react-hooks/rules-of-hooks`, which treats any `use`-prefixed call site
  as a hook invocation regardless of file type.
- Response body for both 401 and 400 failures is a plain `{ error: string }` returned with
  `setResponseStatus`, not `createError` — `createError`'s JSON serialization adds
  `status`/`statusText`/`message` fields alongside `data`, which would not match the fixed
  `400 { error: string }` contract in `INTERFACES.md` exactly.
