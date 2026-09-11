---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0003
ticket: SWHM-T-0036
branch: vortex/feat/SWHM-T-0036-customer-profile-screens-and-language-pr-0d9faf17
upstream: [artifacts/SWHM-S-0003/SWHM-T-0036/PLAN.md]
---

# TDD result — SWHM-T-0036

## Test cases

| Test                                  | Covers           | Intent                                                                                                                              |
| ------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/customer.test.tsx › PT-01` | AC-1             | the wireframe's contact-information fields render with their values                                                                 |
| `src/pages/customer.test.tsx › PT-02` | AC-2             | account-details card renders as read-only labelled rows, `Read only` badge                                                          |
| `src/pages/customer.test.tsx › PT-03` | AC-3             | the edit form opens pre-filled with the current values                                                                              |
| `src/pages/customer.test.tsx › PT-04` | AC-5             | the language control offers exactly `en_US`, `ja_JP`, `zh_CN`                                                                       |
| `src/pages/customer.test.tsx › PT-05` | AC-5             | the category control offers exactly the five vocabulary categories                                                                  |
| `src/pages/customer.test.tsx › PT-06` | AC-4             | submitting PUTs the update and returns to the read-only view with new values                                                        |
| `src/pages/customer.test.tsx › PT-07` | AC-6             | a typed full card number is shown as only its last four digits on re-edit                                                           |
| `src/pages/customer.test.tsx › PT-08` | —                | a `400 { error }` response renders as an alert; the form stays open                                                                 |
| `src/pages/customer.test.tsx › PT-09` | AC-7             | `document.documentElement.lang` is set from the fetched profile                                                                     |
| `e2e/customer-profile.spec.ts`        | AC-1..AC-7, AC-9 | view → edit → save → last-four-only → sign out (cookie-cleared) → sign in again → language still shown, `lang` attribute carries it |

AC-8 (unauthenticated visit redirects to sign-on) is unchanged behaviour — `RequireSignOn` is
untouched, and is already proven by the existing `e2e/signon.spec.ts` test
("redirects an unauthenticated visit to /customer to /signon..."), which this ticket does not
duplicate. AC-10 (component tests run in the `client` project) is verified structurally: no
`vitest.config.ts` change was needed — `src/pages/**` was already covered by the `client`
project's default inclusion — and the green run below shows the file collected under
`|client|`.

## Red run

Before `CustomerProfile` was exported from `src/pages/customer.tsx`:

```
$ bun --bun vitest run src/pages/customer.test.tsx
 ❯ |client| src/pages/customer.test.tsx (9 tests | 9 failed)
Error: Element type is invalid: expected a string (for built-in components) or a class/function
(for composite components) but got: undefined. You likely forgot to export your component from
the file it's defined in, or you might have mixed up default and named imports.

 Test Files  1 failed (1)
      Tests  9 failed (9)
```

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + complete test suite).
`verify:full` also ran; its E2E tier cannot launch Chromium in this container (not installed),
per `scripts/ensure-playwright-browser.mjs`'s own guidance to fall back to `verify` here — the
new Playwright spec was validated with `playwright test --list` (parses and collects the one
test cleanly) and will run for real in CI and at integration QA:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  27 passed (27)
      Tests  119 passed (119)

$ bunx playwright test e2e/customer-profile.spec.ts --list
  [chromium] › customer-profile.spec.ts:33:3 › Customer profile › views, edits, saves, and keeps the language preference across a new session
Total: 1 test in 1 file
```

TDD-RESULT: 119 passed, 0 failed
