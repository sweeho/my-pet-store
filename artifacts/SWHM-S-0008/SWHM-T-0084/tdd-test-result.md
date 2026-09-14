---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0084
branch: vortex/fix/SWHM-T-0084-change-language-button-on-the-catalog-s-95ffe1a7
upstream:
  [
    artifacts/SWHM-S-0008/SWHM-T-0084/PLAN.md,
    openspec/changes/swhm-s-0008-bugfix-found-by-inspector/design.md,
  ]
---

# TDD result — SWHM-T-0084

## Test cases

| Test                                                                                                               | Covers     | Intent                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/catalog/UnavailableInLanguage.test.tsx › UL-05: the 'Change language' control still works on a second…` | AC-1, AC-2 | opens the panel's own menu, selects a locale, opens it a second time, selects another, asserts `onChangeLocale` fired twice — the exact property the old DOM-click mechanism failed at the second open |

AC-3 (existing UL-01–UL-04 and every LanguageSwitcher.test.tsx test pass unmodified) and
AC-4 (`LANGUAGE_SWITCHER_MOUNT_ID` gone from the repo) are covered by re-running those
files unmodified and a repo-wide grep, both below.

## Red run

`bun --bun vitest run src/pages/catalog/UnavailableInLanguage.test.tsx` against the
unmodified panel (plain "Change language" button calling `openLanguageSwitcher()`, no
`onChangeLocale` prop):

```
 ❯ src/pages/catalog/UnavailableInLanguage.test.tsx:85:29
     83|
     84|     await user.click(screen.getByRole("button", { name: "Change langua…
     85|     await user.click(screen.getByRole("menuitem", { name: /日本語/ }));
       |                             ^

TestingLibraryElementError: Unable to find an accessible element with the role "menuitem" and name `/日本語/`

Here are the accessible roles:

  button:
  Name "View in English (US)":
  ...
  button:
  Name "Change language":

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

No `menuitem` role exists because the old "Change language" button is a plain `<Button>`
calling a DOM-id `.click()`, not a real menu — the failure is structural, matching § RC-2.

## Green run

After the fix (panel renders its own `LanguageSwitcher` with `label="Change language"`):

`bun --bun vitest run src/pages/catalog/UnavailableInLanguage.test.tsx src/components/LanguageSwitcher.test.tsx src/pages/catalog/item src/pages/catalog/category src/pages/catalog/product`:

```
 Test Files  5 passed (5)
      Tests  30 passed (30)
```

`grep -rn "LANGUAGE_SWITCHER_MOUNT_ID" --include="*.ts" --include="*.tsx" .` (excluding
`node_modules`): no matches — AC-4 satisfied.

`bun run verify` — this stack's full browser-free gate (lint, typecheck, complete
unit/integration suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  299 passed (299)
```

`bun run verify:full` was attempted first; its E2E tier failed at the preflight
(`scripts/ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not
installed"), the documented limitation in this project's `AGENTS.md` Notes for this
sprint's implementation containers. Fell back to `bun run verify` per that note. This
ticket changes an existing panel's internal menu mechanism with no new route or navigable
flow, so there is no new E2E-observable behavior beyond what the unit-tier regression
already pins; CI and INTEGRATION_QA run the full pipeline including E2E before merge.

TDD-RESULT: 299 passed, 0 failed
