# Tasks — SWHM-S-0008 bugfix batch

## 1. Planning

- [ ] 1.1 Root-cause all five defects against the code at `7a82318` and re-verify every claim in the reports (SWHM-T-0085)
- [ ] 1.2 Author the change — proposal, design, three spec deltas, tasks — and a `PLAN.md` per defect (SWHM-T-0085)
- [ ] 1.3 Bring `ARCHITECTURE.md` to target state: the shipped-surface constraint in § Routing and the synthetic-event decision in § Key Decisions (SWHM-T-0085)

## 2. Landing page shell

- [ ] 2.1 Add `src/components/StoreMark.tsx` and render it in place of both hotlinked `<img>` tags in `src/pages/index.tsx` (SWHM-T-0080)
- [ ] 2.2 Assert in `src/pages/index.test.tsx` that neither logo location requests an off-origin asset (SWHM-T-0080)
- [ ] 2.3 Point the nav, "Log in" and hero controls at `/catalog`, `/customer` and `/signon` with `react-router`'s `Link`, and remove the controls that name no screen (SWHM-T-0081)
- [ ] 2.4 Update `src/pages/index.test.tsx` and `e2e/home.spec.ts` to the new nav names and assert no link targets a placeholder fragment (SWHM-T-0081)

## 3. Boilerplate example screens

- [ ] 3.1 Delete `src/pages/users/index.tsx`, `src/pages/users/[id].tsx` and `src/pages/users/profile.tsx`, leaving `routes/api/users/**` and the `users` table untouched (SWHM-T-0082)
- [ ] 3.2 Add `e2e/legacy-routes.spec.ts` asserting the three paths render the not-found screen and that `GET /api/users` still answers (SWHM-T-0082)

## 4. Catalogue item image

- [x] 4.1 Add `public/images/placeholder.svg` and give the item detail `<img>` a single-shot `onError` fallback to it, preserving `alt` (SWHM-T-0083)
- [x] 4.2 Cover the fallback in `src/pages/catalog/item/[itemId].test.tsx`, asserting the alternative text is unchanged after it fires (SWHM-T-0083)

## 5. Language recovery control

- [ ] 5.1 Add the optional `label` prop to `src/components/LanguageSwitcher.tsx` (SWHM-T-0084)
- [ ] 5.2 Replace `openLanguageSwitcher()` in `src/pages/catalog/UnavailableInLanguage.tsx` with its own switcher driven by an optional `onChangeLocale` prop, and remove `LANGUAGE_SWITCHER_MOUNT_ID` (SWHM-T-0084)
- [ ] 5.3 Pass `setLocale` from the category, product and item screens and drop the mount-id wrappers (SWHM-T-0084)
- [ ] 5.4 Add a test that opens the panel's menu, selects a language, opens it again and selects another — the cycle the old code failed (SWHM-T-0084)
