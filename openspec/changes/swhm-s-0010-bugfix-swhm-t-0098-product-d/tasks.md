# Tasks — SWHM-S-0010

## 1. Planning

- [ ] 1.1 Root-cause the defect against the working tree at `bf8a233` and re-verify every claim in the report (SWHM-T-0102)
- [ ] 1.2 Author the change — proposal, design, one spec delta, tasks — and the defect's `PLAN.md` (SWHM-T-0102)
- [ ] 1.3 Add the one-hook constraint to `ARCHITECTURE.md` § Cross-cutting constraints (SWHM-T-0102)

## 2. Reason-aware catalogue reads

- [x] 2.1 Change `useCatalogFetch` to return the 404 reason in place of the `notFound` boolean, parsing the body defensively (SWHM-T-0098)
- [x] 2.2 Delete the page-local `useItemFetch` and move the item screen onto the shared hook (SWHM-T-0098)
- [x] 2.3 Branch the product and category screens on the reason, so an untranslated entry gets the recovery panel and an absent one still gets the not-found screen (SWHM-T-0098)
- [x] 2.4 Give `UnavailableInLanguage` an optional entity prop so a product screen does not describe its subject as an item (SWHM-T-0098)
- [x] 2.5 Cover the new branches in the product, category, item, shared-hook and panel unit tests (SWHM-T-0098)
- [x] 2.6 Assert the untranslated-product and unknown-product cases in `e2e/language.spec.ts`, alongside the item assertion already there (SWHM-T-0098)
