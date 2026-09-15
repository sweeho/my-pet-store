# Tasks — SWHM-S-0009 bugfix batch

## 1. Planning

- [ ] 1.1 Root-cause all three defects against the working tree at `81f55c7` and re-verify every claim in the reports (SWHM-T-0099)
- [ ] 1.2 Author the change — proposal, design, three spec deltas, tasks — and a `PLAN.md` per defect (SWHM-T-0099)
- [ ] 1.3 Bring `ARCHITECTURE.md` to target state: § Stack, § Directory structure, § Request flow, § Cross-cutting constraints and one § Key Decisions entry (SWHM-T-0099)

## 2. Third-party web font

- [x] 2.1 Remove the `Fonts()` registration and its two imports from `vite.config.ts` (SWHM-T-0094)
- [x] 2.2 Delete `configs/` and its `include` entry in `tsconfig.node.json`, and drop the `unplugin-fonts` dependency (SWHM-T-0094)
- [x] 2.3 Assert in `e2e/home.spec.ts` that every request the page issues, and every link element in its head, names the application's own origin (SWHM-T-0094)

## 3. Catalogue item images

- [ ] 3.1 Add a committed SVG illustration under `public/images/<category>/` for each of the 20 distinct locations the seed names, each distinguishable from the others (SWHM-T-0095)
- [ ] 3.2 Point `catalog/seed.ts`'s 41 `image` values at those committed assets (SWHM-T-0095)
- [ ] 3.3 Add a test under `catalog/` asserting every distinct seeded image location resolves to a file the application serves (SWHM-T-0095)
- [ ] 3.4 Assert in `e2e/catalog.spec.ts` that an item detail screen shows the item's own image and issues no image request answered as not found (SWHM-T-0095)

## 4. Post-sign-on destination

- [ ] 4.1 Add a pure request-classification predicate to `auth/signon-filter.ts` and cover it in `auth/signon-filter.test.ts` (SWHM-T-0097)
- [ ] 4.2 In `middleware/signon.ts`, set the original URL only for a navigation, and answer a denied non-navigation request as unauthenticated instead of redirecting it (SWHM-T-0097)
- [ ] 4.3 Cover the corrupting sequence end-to-end in `e2e/signon.spec.ts`: browse the catalogue anonymously, sign on, land on the welcome screen (SWHM-T-0097)
- [ ] 4.4 Confirm CH-01, CH-02 and SI-01 still pass unchanged — `routes/api/signon/check.get.ts` does not move (SWHM-T-0097)
