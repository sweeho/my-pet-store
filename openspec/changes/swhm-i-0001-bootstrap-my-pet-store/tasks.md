## 1. Identity

- [ ] 1.1 Set the package manifest `name` to `my-pet-store` and verify the field reads `my-pet-store` (SWHM-T-0004)
- [ ] 1.2 Set `index.html`'s `<title>` to "My Pet Store" and verify the browser tab shows it on the running app (SWHM-T-0004)
- [ ] 1.3 Set `STORE_NAME` in `src/constants/index.ts` to "My Pet Store", replacing the `Your Store-Name` placeholder (SWHM-T-0004)
- [ ] 1.4 Create `public/manifest.webmanifest` with `name` "My Pet Store", resolving the link `index.html` already carries, and verify the manifest fetches successfully instead of 404ing (SWHM-T-0004)

## 2. Home page

- [ ] 2.1 Replace the boilerplate hero in `src/pages/index.tsx` — heading, eyebrow, body copy — so the level-1 heading reads "My Pet Store", sourced from `STORE_NAME`, and verify no boilerplate product name remains in the file (SWHM-T-0004)
- [ ] 2.2 Update the nav `sr-only` brand label and the tech-stack chip list to match the product, and verify the rendered page carries no template placeholder copy (SWHM-T-0004)

## 3. Test harness

- [ ] 3.1 Update `src/pages/index.test.tsx` so its heading assertion pins "My Pet Store" instead of the boilerplate heading, and verify the page test file passes (SWHM-T-0004)
- [ ] 3.2 Update the heading assertion in `e2e/home.spec.ts` to the new hero, and verify the home end-to-end spec passes in a browser-equipped environment (SWHM-T-0004)
- [ ] 3.3 Confirm the browser-free tier — linting, type-checking, unit and integration tests — reports zero failures on the branded application (SWHM-T-0004)

## 4. Clean-checkout build

- [ ] 4.1 Verify that a checkout carrying no generated files installs and builds, emitting both `dist/` and `.output/` (SWHM-T-0004)

## 5. Continuous integration

- [ ] 5.1 Correct the stale "CI for the boilerplate ITSELF" header comment in `.github/workflows/ci.yml` and verify the workflow still triggers on push and pull_request to `vortex/**` (SWHM-T-0004)
- [ ] 5.2 Push to the sprint branch and verify the CI check run for that commit concludes successfully, including the browser end-to-end tier (SWHM-T-0004)
