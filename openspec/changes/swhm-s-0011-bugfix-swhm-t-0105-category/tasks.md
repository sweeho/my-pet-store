# Tasks — SWHM-S-0011

## 1. Planning

- [ ] 1.1 Root-cause SWHM-T-0105 against the sprint branch at `c65c507`, re-verifying every claim in the report rather than trusting it (SWHM-T-0106)
- [ ] 1.2 Author the change — proposal, technical design, the `internationalization` delta, this task list — and the defect's `PLAN.md` (SWHM-T-0106)
- [ ] 1.3 Promote the one decision that binds later work into `ARCHITECTURE.md` § Key Decisions (SWHM-T-0106)

## 2. Name the subject at every call site

- [ ] 2.1 Make the language-unavailable panel's subject a required prop covering category, product and item, and delete the default that supplied one (SWHM-T-0105)
- [ ] 2.2 Delete the plural-noun lookup table the subject was derived from, keeping the plural noun for the heading and the body clause it still decides (SWHM-T-0105)
- [ ] 2.3 Pass a category as the subject from the category screen's untranslated branch — the defect — and give the four other call sites the explicit subject each already renders (SWHM-T-0105)
- [ ] 2.4 Cover a category subject in the panel's own tests, alongside the item and product cases already there (SWHM-T-0105)
- [ ] 2.5 Assert the body text, not only the heading, in the category screen's untranslated-branch test (SWHM-T-0105)
- [ ] 2.6 Assert the untranslated category screen's text in `e2e/language.spec.ts`, mirroring the product assertion already there (SWHM-T-0105)
