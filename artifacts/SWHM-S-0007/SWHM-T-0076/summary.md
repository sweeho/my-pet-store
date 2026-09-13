---
artifact: summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0076
branch: vortex/feat/SWHM-T-0076-testing-prove-the-three-locales-end-to-e-05d2f73c
upstream: [artifacts/SWHM-S-0007/SWHM-T-0076/PLAN.md]
---

# Summary — SWHM-T-0076

Added `e2e/language.spec.ts`, proving in a real browser what SWHM-T-0072/SWHM-T-0075 already built:
a locale choice surviving a reload, travelling across navigation, following a signed-on customer into
a second browser context, and an untranslated drill-in being distinguishable from a broken link. No
product code changed — this ticket owns no `src/`, `catalog/`, `routes/`, or `db/` files.

## Changed

- `e2e/language.spec.ts` (new, 4 tests) — see `tdd-test-result.md` for what each one covers.
- `e2e/catalog.spec.ts` — unchanged. Its three existing tests (including the signed-on-locale test at
  `:76`) still pass unmodified under the new resolution order; no chrome it observes moved.

## Acceptance criteria

- AC-1 (visitor: reload + navigate keeps 日本語) — `language.spec.ts` test 1.
- AC-2 (signed-on: profile stores the choice, follows into a fresh context) — `language.spec.ts` test 2.
- AC-3 (中文: five category names, unavailable drill-in, one-click return to English) —
  `language.spec.ts` test 3.
- AC-4 (unknown item id under ja_JP reaches Not Found, not the unavailable message) —
  `language.spec.ts` test 4.
- AC-5 (four new behaviours asserted; existing `e2e/catalog.spec.ts` specs still pass) — all four new
  tests plus all three pre-existing `catalog.spec.ts` tests passed in the same CI run (see Verification).
  The ticket text says "the two existing specs in `e2e/catalog.spec.ts`"; the file actually has three
  `test()` blocks (browse-to-item, unknown category, signed-on locale) — PLAN.md's step 6 correctly
  names all three, including the signed-on-locale one this ticket cared most about. All three pass;
  the AC's substance (nothing regressed) holds regardless of the count in its wording.
- AC-6 (every added spec executed at least once, outcome stated in the work log) — see Verification;
  stated in full in the ticket comment.

## Verification

This container has no Chromium (`node scripts/ensure-playwright-browser.mjs` fails fast — documented,
known gap for implementation containers, `AGENTS.md` § Notes from previous agents /
`artifacts/SWHM-S-0007/SWHM-T-0076/PLAN.md` § Gotchas). Per that policy, did not retry or install a
browser; the real first execution is CI on this ticket's branch, run twice:

- Commit `e36b717` (https://github.com/sweeho/my-pet-store/actions/runs/34753277203): **red**. 15/16
  E2E tests passed; `language.spec.ts`'s fresh-context test failed on a genuine bug in the test itself
  — `uniqueUsername("lang-profile")` produced a 26-character username, one over `MAX_USERID_LENGTH`
  (25). Not a product bug.
- Fixed by shortening the label to `"lang-prof"`, pushed as commit `b3e0f3d`.
- Commit `b3e0f3d` (https://github.com/sweeho/my-pet-store/actions/runs/34753408761): **green**. Unit
  and integration: 297/297. Build: succeeded. E2E: 16/16, including all four new `language.spec.ts`
  tests and all three existing `e2e/catalog.spec.ts` tests.
- Locally: `bun run verify` (lint + typecheck + the same 297/297 unit suite) — green.

## Follow-ups

None — no product defect found; the one failure encountered was in this ticket's own test code and
was fixed within the ticket.
