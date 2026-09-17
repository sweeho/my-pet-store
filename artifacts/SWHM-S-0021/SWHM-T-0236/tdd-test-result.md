---
ticket: SWHM-T-0236
sprint: SWHM-S-0021
type: task
---

# TDD result — SWHM-T-0236

## Test cases

| #   | File                                    | Case                                                                                                                                                                                            | AC    |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1   | `src/components/StoreHeader.test.tsx`   | AC-1 — the store mark links to `/`, a `Catalog` link to `/catalog`, a `Cart` link to `/cart` all render.                                                                                        | AC-1  |
| 2   | `src/components/StoreHeader.test.tsx`   | AC-2 — with the cart mock reporting `count: 2`, the cart link carries a visible "2".                                                                                                            | AC-2  |
| 3   | `src/components/StoreHeader.test.tsx`   | AC-3 — with `count: 0`, the cart link shows no digit.                                                                                                                                           | AC-3  |
| 4   | `src/components/StoreHeader.test.tsx`   | AC-4 — a child passed to the trailing slot sits, in DOM order, before the (signed-out) identity control.                                                                                        | AC-4  |
| 5   | `src/components/StoreHeader.test.tsx`   | AC-5 — while the session fetch never resolves: "Checking your session…" is shown; no `role="status"`; no Sign in link, no "Signed in as", no Admin link.                                        | AC-5  |
| 6   | `src/components/StoreHeader.test.tsx`   | AC-6 — resolved signed-out: only a Sign in link to `/signon`; no My account, no Sign out, no Admin.                                                                                             | AC-6  |
| 7   | `src/components/StoreHeader.test.tsx`   | AC-7 — resolved signed-on as "alice": "alice" is shown, a My account link to `/customer`, and a Sign out button.                                                                                | AC-7  |
| 8   | `src/components/StoreHeader.test.tsx`   | AC-8 — activating Sign out POSTs `/api/signon/logout`, navigates to `/`, and the header returns to its signed-out state (Sign in link reappears).                                               | AC-8  |
| 9   | `src/components/StoreHeader.test.tsx`   | AC-9 — signed on with role `"administrator"`: an Admin link to `/admin` renders, and precedes "Signed in as" in DOM order.                                                                      | AC-9  |
| 10  | `src/components/StoreHeader.test.tsx`   | AC-10 — signed on with no role: no Admin link.                                                                                                                                                  | AC-10 |
| 11  | `src/components/StoreHeader.test.tsx`   | AC-11 — `variant="admin"`: "· Administration", a Catalog link, a Cart link, the username and a Sign out control all render.                                                                     | AC-11 |
| 12  | `src/components/StoreHeader.test.tsx`   | AC-12 — `variant="admin"`: no Admin link and no My account link.                                                                                                                                | AC-12 |
| 13  | `src/components/StoreHeader.test.tsx`   | AC-17 — the store variant's inner container class includes `CONTENT_WIDTH`; the admin variant's includes `ADMIN_CONTENT_WIDTH` (both from `src/components/layout.ts`).                          | AC-17 |
| 14  | `routes/api/signon/session.get.test.ts` | Unchanged case, updated shape — an unsigned-on default now also reports `role: null`.                                                                                                           | AC-15 |
| 15  | `routes/api/signon/session.get.test.ts` | AC-13 — a session signed on as an identity holding `"administrator"` reports that role.                                                                                                         | AC-13 |
| 16  | `routes/api/signon/session.get.test.ts` | AC-14 — a session signed on as an identity holding no role reports `role: null`.                                                                                                                | AC-14 |
| 17  | `routes/api/signon/session.get.test.ts` | AC-15 — a signed-out visitor is reported with no username and no role.                                                                                                                          | AC-15 |
| 18  | `routes/api/signon/session.get.test.ts` | AC-16 — reading the session after `setOriginalUrl(session, "/cart")` leaves `original_url` at `/cart`, both in the read's own response and on a follow-up read of the same cookie.              | AC-16 |
| 19  | `routes/api/signon/flows.test.ts`       | Collateral — three pre-existing exact-equality assertions on the session response (FT-01, FT-05, FT-06) updated to include `role: null`, since adding the field changes what `toEqual` matches. | —     |

## Red run

`StoreHeader.tsx` and `src/components/layout.ts` did not exist yet, and `session.get.ts` did not report `role`, so the new/updated tests failed for the expected reasons before any implementation was written:

```
$ NODE_ENV=test bun --bun vitest run src/components/StoreHeader.test.tsx routes/api/signon/session.get.test.ts routes/api/signon/flows.test.ts

FAIL routes/api/signon/session.get.test.ts > AC-13: reports the administrator role for a signed-on administrator
  AssertionError: expected { j_signon: true, …(2) } to deeply equal { j_signon: true, …(3) }  (role: "administrator" missing)
FAIL routes/api/signon/session.get.test.ts > AC-14: reports no role for a signed-on shopper whose identity holds none
  AssertionError: (role: null missing)
FAIL routes/api/signon/session.get.test.ts > AC-15: reports a signed-out visitor as such, with no username and no role
  AssertionError: (role: null missing)
FAIL routes/api/signon/session.get.test.ts > creates a session and reports its unsigned-on default for a caller with no cookie
  AssertionError: (role: null missing)
FAIL routes/api/signon/flows.test.ts > FT-01, FT-05, FT-06
  AssertionError: (role: null missing)

Test Files  3 failed (3)
     Tests  7 failed | 4 passed (11)
```

(`StoreHeader.test.tsx` failed the whole file at import time — `Cannot find module "./StoreHeader"` / `"./layout"` — before either file existed; not reproduced verbatim here since it is a module-resolution failure, not a per-case assertion.)

## Green run

After adding `src/components/layout.ts`, `src/components/StoreHeader.tsx`, exporting it from `src/components/index.ts`, adding `role` to `routes/api/signon/session.get.ts`, and updating the three pre-existing `flows.test.ts` assertions:

```
$ NODE_ENV=test bun --bun vitest run src/components/StoreHeader.test.tsx routes/api/signon/session.get.test.ts routes/api/signon/flows.test.ts
Test Files  3 passed (3)
     Tests  25 passed (25)
```

Full pre-commit gate (`bun run verify` — lint + typecheck + the complete unit suite, not just the tests touched by this ticket):

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
Test Files  126 passed (126)
     Tests  875 passed (875)
```

Exit code: 0. Zero new failures against the pre-ticket baseline (all 126 files, including every file this ticket did not touch).

`bun run verify:full` was attempted; `verify` ran green as above, then it failed fast at the `pretest:e2e` Chromium preflight:

```
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
```

This is the documented container limitation (`AGENTS.md` § Notes from previous agents — "Implementation containers do not ship a Chromium"), not a regression from this change. This ticket owns no E2E spec and no page, so nothing here required the browser tier; it runs in CI and at INTEGRATION_QA.

TDD-RESULT: 875 passed, 0 failed
