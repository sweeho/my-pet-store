---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0076
branch: vortex/feat/SWHM-T-0076-testing-prove-the-three-locales-end-to-e-05d2f73c
upstream: [artifacts/SWHM-S-0007/SWHM-T-0076/PLAN.md]
---

# TDD result — SWHM-T-0076

## Test cases

| Test (`e2e/language.spec.ts`)                                                                                              | Covers | Intent                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `a visitor's language choice on /catalog survives a reload and travels to a category screen`                               | AC-1   | switch to 日本語 as a visitor, reload, still Japanese; click through to a category screen (drops the `?locale=` param) and it's still Japanese via the cookie                              |
| `a signed-on customer's chosen locale is stored in the profile and follows them into a fresh browser context`              | AC-2   | switch to 日本語 while signed on, read `ja_JP` back from `GET /api/customer`, then sign on as the same customer in a brand-new browser context (no shared cookies) and see Japanese        |
| `a visitor switched to 中文 sees Chinese category names, and an unavailable category offers a one-click return to English` | AC-3   | all five category names render in Chinese; drilling into DOGS (no `zh_CN` product data) shows the unavailable message; **View in English (US)** returns English product names in one click |
| `an unknown item id under a non-default locale reaches Not Found, not the unavailable-in-this-language message`            | AC-4   | `GET /catalog/item/NO-SUCH-ITEM?locale=ja_JP` reaches `NotFound`, never `UnavailableInLanguage`, proving the reason discriminator (not just "is the locale non-default") drives the branch |

AC-5 (existing `e2e/catalog.spec.ts` specs still pass) and AC-6 (every added spec executed at least
once) are covered by the CI run below, not a new test case — see `summary.md`.

Boxes 5.1–5.4's per-locale catalogue queries and the missing-locale-returns-null case already have
data-layer cover, confirmed unmodified and still green in the same run: `catalog/item.test.ts`,
`catalog/query.test.ts`, `catalog/performance.test.ts` (all included in the 297 unit/integration
tests below). No fourth copy was added, per PLAN.md's explicit instruction.

## Red run

This ticket owns no product code (`src/`, `catalog/`, `routes/`, `db/` are out of scope) — it proves
behavior SWHM-T-0072/SWHM-T-0075 already implemented, so there is no product-code red state to
demonstrate. The genuine red state this ticket produced was in its own test code: this container has
no Chromium (`node scripts/ensure-playwright-browser.mjs` fails fast — a known, documented gap for
implementation containers), so the specs' first real execution was CI on this ticket's branch.

That first CI run (commit `e36b717`, https://github.com/sweeho/my-pet-store/actions/runs/34753277203)
was red:

```
✘  9 [chromium] › e2e/language.spec.ts:49:3 › ... a signed-on customer's chosen locale ...
   Error: test bug: username "lang-profile-1789297308524" exceeds MAX_USERID_LENGTH (25) — shorten label
     at uniqueUsername (e2e/language.spec.ts:19:11)
     at e2e/language.spec.ts:53:22

  1 failed
    [chromium] › e2e/language.spec.ts:49:3 › ...
  15 passed (23.4s)
```

A genuine bug in the test itself: the `uniqueUsername("lang-profile")` label was long enough that the
generated username exceeded `MAX_USERID_LENGTH` (25). Fixed by shortening the label to
`"lang-prof"` (commit `b3e0f3d`).

## Green run

Pushed the fix and re-ran CI (commit `b3e0f3d`,
https://github.com/sweeho/my-pet-store/actions/runs/34753408761):

```
Unit and integration tests:
 Test Files  55 passed (55)
      Tests  297 passed (297)

Build: ✓ built in 1.40s / ✓ built in 241ms

E2E tests:
  ✓  1  e2e/catalog.spec.ts › browses categories to products to an item, then finds the same item via search
  ✓  2  e2e/catalog.spec.ts › an unknown category shows a not-found state rather than a blank screen
  ✓  3  e2e/catalog.spec.ts › a signed-on customer's preferred language is used as the catalog locale
  ✓  4  e2e/customer-profile.spec.ts › views, edits, saves, and keeps the language preference across a new session
  ✓  5-7 e2e/home.spec.ts (3 tests)
  ✓  8  e2e/language.spec.ts › a visitor's language choice on /catalog survives a reload and travels to a category screen
  ✓  9  e2e/language.spec.ts › a signed-on customer's chosen locale is stored in the profile and follows them into a fresh browser context
  ✓  10 e2e/language.spec.ts › a visitor switched to 中文 sees Chinese category names, and an unavailable category offers a one-click return to English
  ✓  11 e2e/language.spec.ts › an unknown item id under a non-default locale reaches Not Found, not the unavailable-in-this-language message
  ✓  12-13 e2e/signon.spec.ts (2 tests)
  ✓  14-16 e2e/smoke.spec.ts (3 tests)
  16 passed (21.5s)
```

Locally (this container, no Chromium): `bun run verify` — lint + typecheck + the same 297/297 unit
suite, green. `bun run verify:full` was not attempted locally; `node scripts/ensure-playwright-browser.mjs`
confirms Chromium is genuinely absent, the documented container gap — the browser tier's real
execution is the CI run above.

TDD-RESULT: 313 passed, 0 failed
