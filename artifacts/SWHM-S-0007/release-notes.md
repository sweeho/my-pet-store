---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0007
idea: SWHM-I-0005
branch: vortex/sprint/swhm-s-0007-d3b37ac1
upstream: [artifacts/SWHM-S-0007/qa-test-report.md]
---

# Release notes — SWHM-S-0007

Shoppers can now read the catalogue in English (US), 日本語 or 中文, and are told plainly when something has not been translated yet.

## Added

- A language button in the header of every catalogue screen — home, category, product and item — showing the language you are reading and offering English (US), 日本語 and 中文. (SWHM-T-0072, SWHM-T-0075)
- You do not need an account to choose a language. A visitor's choice is remembered in their browser and still applies after a reload and after moving to another catalogue screen. (SWHM-T-0072)
- A signed-on customer's choice is saved to their profile, so it applies on their next visit and in a different browser. (SWHM-T-0072)
- Where a category, product or item has no content in the chosen language, the page now says so — naming that language in its own script — and offers **View in English (US)** in one click, plus **Change language**. An unknown address still shows the Not Found page, so a broken link never looks like a missing translation. (SWHM-T-0074, SWHM-T-0075)

## Changed

- Catalogue screens show a "loading" indicator while they fetch, instead of a blank page. (SWHM-T-0075)
- Every catalogue page's `html lang` attribute now matches the language on screen, so assistive technology and the browser are told which language they are reading. (SWHM-T-0075)

## Fixed

- A category or product with nothing translated into the chosen language no longer shows an empty list, and an untranslated item no longer shows a page that reads like a broken link. (SWHM-T-0074, SWHM-T-0075)

## Upgrade notes

No migration, no configuration change and no feature flag. Two additive changes worth knowing about if you consume the API or the browser storage:

- The catalogue detail endpoints (`/api/catalog/categories/{id}`, `/products/{id}`, `/items/{id}`) now include a `reason` field of `not-found` or `missing-translation` in their 404 body. Status codes and error text are unchanged, so a client that ignores the field behaves exactly as before. (SWHM-T-0074)
- A new `petstore_locale` cookie stores a visitor's chosen language for a year. Clearing it returns the shopper to their profile language, or to English (US).

English (US) behaviour is unchanged throughout, including its empty and not-found states.

## Not included

- Chinese product and item content. Category names appear in 中文; drilling into a category shows the untranslated message described above. Adding that content is out of scope for SWHM-I-0005 and is a content decision, not a code change.
- Translating the store's own interface. Labels, buttons, headings and validation messages stay in English in all three languages, as do prices, dates and number formats.
- Guessing a language from the browser's `Accept-Language` header. The language is chosen, or it is English (US).

## Verification

Verified at integration QA on the sprint branch — see `artifacts/SWHM-S-0007/qa-test-report.md` (PASS: 12/12 acceptance criteria, unit 297/297, E2E 16/16, zero defects).

## Compliance / Control Evidence

| Control                                  | Evidence                           | Location                                  | Status    | Exception |
| ---------------------------------------- | ---------------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded                | this file                          | `artifacts/SWHM-S-0007/release-notes.md`  | Satisfied | —         |
| Release verified before land             | QA PASS verdict                    | `artifacts/SWHM-S-0007/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated           | § Not included, § Upgrade notes    | this file                                 | Satisfied | —         |
| Behavioural change traceable to a ticket | every entry carries its ticket key | this file                                 | Satisfied | —         |
