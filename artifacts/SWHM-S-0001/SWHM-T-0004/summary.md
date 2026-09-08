---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0001
ticket: SWHM-T-0004
branch: vortex/feat/SWHM-T-0004-bootstrap-the-application-from-the-boile-92351f17
upstream: [artifacts/SWHM-S-0001/SWHM-T-0004/PLAN.md]
---

# Summary — SWHM-T-0004: Bootstrap the application from the boilerplate

## What changed

Rebranded the boilerplate as My Pet Store: `package.json` name, page title, `STORE_NAME`, a new
web app manifest, and the home page hero/nav/chip copy, with the assertions that pin them updated
in the same pass (design.md D1/D2/D3/D5). No new tooling was added — the boilerplate already ships
a full test harness, Playwright config and CI workflow (design.md D1/D4), so this ticket only
verifies and adjusts them.

## Files

- `package.json` — `name` → `my-pet-store`.
- `index.html` — `<title>` → `My Pet Store`.
- `src/constants/index.ts` — `STORE_NAME` → `"My Pet Store"`.
- `public/manifest.webmanifest` — new; resolves the link `index.html` already carried.
- `src/pages/index.tsx` — hero heading/eyebrow/body copy, both nav `sr-only` brand labels now read
  `STORE_NAME`, and the tech-stack chip list replaced with store highlights. Nav link labels
  (Features/Tech Stack/Docs/GitHub) and layout/Tailwind classes left unchanged — out of ownership
  and asserted by `e2e/home.spec.ts`.
- `src/pages/index.test.tsx` — heading assertion repointed at "My Pet Store"; tech-stack assertion
  repointed at the new highlights list.
- `e2e/home.spec.ts` — heading assertion repointed at "My Pet Store".
- `.github/workflows/ci.yml` — corrected the stale "CI for the boilerplate ITSELF" header comment.

`e2e/smoke.spec.ts` was not touched: the new manifest is a static JSON file referenced by an
existing `<link>`, so it introduces no new console output for the smoke spec's `consoleErrors`
assertion to catch.

## AC coverage

- AC-1 (home page names the product) — `src/pages/index.tsx` h1 now renders `STORE_NAME` ("My Pet
  Store"); no "Vortex"/boilerplate copy remains (verified by grep, zero matches). Pinned by
  `src/pages/index.test.tsx`.
- AC-2 (tab title + manifest + package name) — `index.html` title, `public/manifest.webmanifest`
  `name`, and `package.json` `name` all set as above.
- AC-3 (clean-checkout build) — see Verification; `bun run build` from a tree with no
  `auto-imports.d.ts`/`dist`/`.output` present produced `.output/public` (client bundle) and
  `.output/server` (Nitro server), per this repo's Nitro+Vite integration — there is no separate
  top-level `dist/`, which is pre-existing `vite.config.ts` behavior, out of this ticket's
  ownership map.
- AC-4 (static checks + tests green, heading test updated) — `bun run verify` green, 20/20 tests;
  `src/pages/index.test.tsx` asserts "My Pet Store".
- AC-5 (smoke E2E) — not runnable in this container (Chromium genuinely absent, confirmed via the
  preflight — see Verification); proven by CI's browser-tier job and at INTEGRATION_QA.
- AC-6 (green CI on a vortex branch) — branch pushed; CI verdict pending, tracked via
  `a2a_await_ci`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                 # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  7 passed (7)
      Tests  20 passed (20)

$ node scripts/check-doc-links.mjs
doc-links: 15 file(s) checked, all relative links resolve

$ bun run build
.output/public/... (client bundle)
.output/server/... (Nitro server)
✓ built in 286ms / 41ms

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at .../chrome-linux/chrome).
```

Exit code 1 on the last command is the expected preflight result in this container (design.md —
Context: "The browser tier could not be executed here"); not retried, no browser installed. The
E2E/smoke tier is proven by CI and at INTEGRATION_QA.

## Notes

No deviations from `PLAN.md`. Kept the nav link labels ("Features", "Tech Stack", "Docs", "GitHub")
unchanged — they are generic section labels, not product-identity strings, and `e2e/home.spec.ts`'s
ownership in `PLAN.md` is scoped to "assertion pinning the hero heading" only.
