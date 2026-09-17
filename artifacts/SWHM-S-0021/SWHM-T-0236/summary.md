---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0021
ticket: SWHM-T-0236
branch: vortex/feat/SWHM-T-0236-shared-storeheader-and-the-session-role-3b402537
upstream:
  [
    artifacts/SWHM-S-0021/SWHM-T-0236/PLAN.md,
    openspec/changes/swhm-i-0014-consistent-look-and-site-nav/design.md,
  ]
downstream: [artifacts/SWHM-S-0021/SWHM-T-0237, artifacts/SWHM-S-0021/SWHM-T-0238]
---

# Summary — SWHM-T-0236: Shared StoreHeader and the session role contract

## What changed

Built the header every other screen in this sprint renders, and extended the session read it
depends on. Read `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/design.md` first, per
the ticket — D2/D3 fixed the endpoint and shape, D6 the two widths, D7a the per-variant control
order, D5 the pre-session copy, and D12 to take structure and copy from the mockup
(`mk-states`) without copying its CSS or its Google-hosted font.

- `src/components/layout.ts` — the two shared content widths (D6), each declared once.
- `src/components/StoreHeader.tsx` — `variant?: "store" | "admin"` + a trailing `children` slot,
  matching the fixed interface contract verbatim. Fetches `/api/signon/session` and `/api/cart` on
  mount; renders the mockup's six states: pending ("Checking your session…", not `role="status"`
  per D5), signed-out (Sign in only), signed-on (username, My account, Sign out, plus an Admin
  link ahead of the username when `role === ADMIN_ROLE`), and the admin variant (mark ·
  "· Administration" · spacer · Catalog · Cart · username · Sign out — no Admin link, no My
  account link, since the visitor is already there). Sign-out POSTs `/api/signon/logout`, resets
  local state to signed-out, and navigates to `/`.
- `routes/api/signon/session.get.ts` — added `role`, resolved via `findUserRole()` from
  `auth/user.ts` (the same lookup `middleware/signon.ts` and `check.get.ts` already use). Still a
  pure read — no write, no `check.get.ts` call.
- `src/components/index.ts` — exports `StoreHeader`.

No page file was touched — this ticket owns no screen; `src/pages/index.tsx` (out-of-scope classic
home page still using the boilerplate header) is unchanged and belongs to SWHM-T-0237.

Collateral, required by adding `role` to the response shape: `routes/api/signon/session.get.test.ts`
rewritten with the new AC-13–AC-16 cases plus the updated default-shape case, and three pre-existing
exact-`toEqual` assertions in `routes/api/signon/flows.test.ts` (FT-01, FT-05, FT-06) updated to
include `role: null` — the field addition changes what those already-passing assertions match.

## Files

- `src/components/layout.ts` — new. `CONTENT_WIDTH = "max-w-[672px]"`,
  `ADMIN_CONTENT_WIDTH = "max-w-[52rem]"`.
- `src/components/StoreHeader.tsx` — new.
- `src/components/StoreHeader.test.tsx` — new. 15 cases, AC-1 through AC-12 and AC-17.
- `src/components/index.ts` — export added.
- `routes/api/signon/session.get.ts` — added `role`.
- `routes/api/signon/session.get.test.ts` — rewritten: default-shape case updated, four new cases
  (AC-13 through AC-16).
- `routes/api/signon/flows.test.ts` — three assertions updated to include `role: null` (FT-01,
  FT-05, FT-06); behaviour unchanged, only the expected shape.

## AC coverage

- AC-1 to AC-4 (header structure, cart count, trailing slot) — `StoreHeader.test.tsx`.
- AC-5 to AC-8 (identity states, sign-out) — `StoreHeader.test.tsx`.
- AC-9, AC-10 (administrative link) — `StoreHeader.test.tsx`.
- AC-11, AC-12 (administration variant) — `StoreHeader.test.tsx`.
- AC-13 to AC-16 (session read reports role, stays a pure read) — `session.get.test.ts`.
- AC-17 (two width declarations, header matches content) — `layout.ts`'s two constants;
  `StoreHeader.test.tsx` asserts each variant's inner container carries the matching one. The
  repository-wide "no screen declares its own width" conformance test is SWHM-T-0237/0238's D11
  scope, not this ticket's — no page exists here to scan.

Design.md D4 (hiding Admin is a convenience, not a guard) is deliberately not a test here, per
PLAN.md § Definition of Done.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  126 passed (126)
     Tests  875 passed (875)
```

`bun run verify:full` was attempted first; its E2E tier fails at the documented Chromium-missing
preflight in this container (`AGENTS.md` § Notes from previous agents — "Implementation containers
do not ship a Chromium") — not retried per that note. Not run, not needed: this ticket ships no
page and no E2E spec; the browser tier runs in CI and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 875 passed, 0 failed`.
