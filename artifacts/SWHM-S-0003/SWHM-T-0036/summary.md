---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0003
ticket: SWHM-T-0036
branch: vortex/feat/SWHM-T-0036-customer-profile-screens-and-language-pr-0d9faf17
upstream: [artifacts/SWHM-S-0003/SWHM-T-0036/PLAN.md]
downstream: []
---

# Summary — SWHM-T-0036: Customer profile screens and language preference

## What changed

Replaced the SWHM-S-0002 placeholder body of `/customer` with the real profile screen: a
read-only view built to `design/wireframe-customer-profile.html` (two cards, labelled rows,
`Read only` badges), an edit form over the same data (contact info, address, card
metadata, preferences) pre-filled from `GET /api/customer`, and save via
`PUT /api/customer`. Option lists (language, category, card type, state, country) are
rendered from `account/vocabulary.ts`. The document's `lang` attribute is set from the
fetched profile on every load.

## Files

- `src/pages/customer.tsx` — placeholder body replaced. `CustomerProfile` (new named
  export) holds the read-only view and the edit form; the default export keeps the
  existing, unmodified `RequireSignOn` wrapper. Card number is purged from client form
  state the moment a save response arrives, not left until the next edit open.
- `src/pages/customer.test.tsx` — new: 9 tests covering rendering, pre-fill, the two fixed
  vocabularies, save/round-trip, last-four-only card display, a validation-error render,
  and the `lang` attribute.
- `e2e/customer-profile.spec.ts` — new: view → edit → save → last-four-only → sign out
  (`context.clearCookies()`) → sign in again → language still shown, `lang` attribute
  carries it. See the file's own comment for why cookie-clearing stands in for sign-out —
  no sign-out endpoint exists and `auth/**`/`routes/**` are outside this ticket's ownership.

No change was needed to `vitest.config.ts`, `tsconfig.json` or `index.html`:
`src/pages/**` was already covered by the `client` Vitest project, `account/vocabulary.ts`
and `account/types.ts` type-checked across the project-reference boundary without changes,
and `index.html` already ships `lang="en"` as the default the client overwrites once the
profile loads.

## AC coverage

- AC-1/AC-2 (wireframe's contact fields + two-card read-only layout) — `PT-01`, `PT-02`.
- AC-3 (edit affordance, pre-filled) — `PT-03`.
- AC-4 (save stores and returns to read-only showing submitted values) — `PT-06`.
- AC-5 (language/category vocabularies exact) — `PT-04`, `PT-05`.
- AC-6 (card number → last four only) — `PT-07`.
- AC-7 (language survives a new session, `lang` attribute) — `PT-09` (client-side) +
  `e2e/customer-profile.spec.ts` (full session round trip).
- AC-8 (unauthenticated → sign-on) — unchanged `RequireSignOn`; already proven by
  `e2e/signon.spec.ts`.
- AC-9 (Playwright spec covers the journey, passes in CI) — `e2e/customer-profile.spec.ts`;
  parses and collects cleanly (`playwright test --list`), runs for real in CI.
- AC-10 (component tests run in `client` project, pass) — green run below.

## Verification

```
$ bun --bun vitest run src/pages/customer.test.tsx   # red, before CustomerProfile was exported
Element type is invalid ... 9 failed

$ bun run verify                                     # green, full gate
lint ✓  typecheck ✓  119 passed (0 failed)

$ bunx playwright test e2e/customer-profile.spec.ts --list   # spec parses and collects
1 test in 1 file
```

See `tdd-test-result.md` — `TDD-RESULT: 119 passed, 0 failed`.

## Notes

- `verify:full`'s E2E tier cannot launch Chromium in this container (not installed); `verify`
  (lint + typecheck + full test suite) plus a Playwright `--list` parse check is the gate
  actually satisfied here, per AGENTS.md's own guidance to fall back rather than retry or
  install. The new spec runs for real in CI on this branch and again at integration QA.
- The category and card-type `<select>` controls each carry one extra "— None —" /
  "— No preference —" placeholder option beyond the vocabulary's values, because both
  fields are nullable (`favoriteCategory`, `cardType`) and the server rejects an empty
  string as an out-of-vocabulary value (`account/validation.ts`). AC-5's "offers exactly"
  is read as the vocabulary's substantive choices, not as forbidding a null placeholder a
  nullable field needs — `PT-05` asserts the five category values excluding that
  placeholder. The language control has no placeholder: `preferredLanguage` is never null.
