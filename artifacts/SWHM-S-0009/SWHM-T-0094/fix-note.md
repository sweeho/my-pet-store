---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0009
ticket: SWHM-T-0094
branch: vortex/fix/SWHM-T-0094-every-page-hotlinks-google-fonts-contrad-21e01de4
upstream: [artifacts/SWHM-S-0009/SWHM-T-0094/PLAN.md]
downstream: [artifacts/SWHM-S-0009/qa-test-report.md]
---

# Fix note — SWHM-T-0094: every page hotlinks Google Fonts

## Root cause

`vite.config.ts` registered `Fonts({ google: { families: fonts } })` (`unplugin-fonts`), which
defaults `preconnect: true` for its Google loader. That plugin injects a `preconnect` link to
`https://fonts.gstatic.com/` and a stylesheet `<link>` to `https://fonts.googleapis.com/css2` into
every page's `<head>` at build time. The registered face, `Space Grotesk` (`configs/fonts.config.ts`),
is declared by no stylesheet in the repository — `src/index.css` sets no `font-family` and no
`--font-*` token, and `tailwind.config.ts` is 0 bytes — so the fetched face was applied to nothing.
Confirmed by root-causing in `openspec/changes/swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00/design.md`
§ RC-1/D1: this correction supersedes the original report's proposal to self-host the `.woff2` files,
which would have kept committing weights for a typeface no element selects.

## Fix

Removed the wiring rather than self-hosting it (design.md D1): deleted the `Fonts(...)` plugin entry
and its `unplugin-fonts/vite` + `./configs/fonts.config` imports from `vite.config.ts`; deleted the
now-orphaned `configs/` directory (`fonts.config.ts` and its `index.ts` barrel — no other importer);
removed the `"configs"` entry from `tsconfig.node.json`'s `include`; and removed the `unplugin-fonts`
dependency from `package.json` (`bun install` regenerated `bun.lock`). Nothing a visitor sees changes:
the page already rendered in Tailwind's default `--font-sans` system stack, since no stylesheet ever
read the `Space Grotesk` face.

## Regression test

`e2e/home.spec.ts › Home page › requests no font, stylesheet, or preconnect hint from a third-party
host` — records every network request the home page issues on load and every `<link>` in its
rendered `<head>`, and asserts each one's origin matches the application's own origin. Per design.md
D2, jsdom cannot observe a `<head>` link Vite injects at build time, so this could not be a unit test
under `src/**`; it has to run in the browser tier. Red→green proof recorded in `tdd-test-result.md`.

## Files touched

- `vite.config.ts` — removed the `Fonts(...)` plugin registration and its two imports.
- `configs/fonts.config.ts`, `configs/index.ts` — deleted (orphaned by the removal above).
- `tsconfig.node.json` — removed the `"configs"` entry from `include`.
- `package.json`, `bun.lock` — removed the `unplugin-fonts` dependency.
- `e2e/home.spec.ts` — added the regression test.

## Notes

The browser tier does not run in this implementation container (`scripts/ensure-playwright-browser.mjs`
reports Chromium genuinely absent — see `AGENTS.md`'s "Implementation containers do not ship a
Chromium" note and design.md's Verification note). The bug and its fix are additionally evidenced
directly against the build artifact in `tdd-test-result.md`; the Playwright assertion itself is
observed in CI on this branch and again at INTEGRATION_QA.
