## Why

This repository was generated from the `ts-reactjs-vite-tailwindcss` boilerplate and still identifies itself as that boilerplate — the package is `react-ts-starter`, the browser tab reads "Vite + React + TS", and the home page advertises the template rather than a product. Before any feature work begins, the team needs a foundation it has actually watched run: an application that names itself My Pet Store, builds from a clean checkout, and reports a green verdict from CI on the sprint branch. Every later sprint inherits that verdict.

## What Changes

- The application identifies itself as **My Pet Store** — package name, browser tab title, the `STORE_NAME` constant, the home page hero, and a web app manifest that `index.html` already links but that does not exist yet.
- The home page's level-1 heading names the product, replacing the boilerplate hero copy. The assertions that currently pin the old heading (`src/pages/index.test.tsx`, `e2e/home.spec.ts`) move with it.
- The clean-checkout path is proven: install, production build (client bundle plus Nitro server output), linting, type-checking, and the unit/integration suite.
- The browser tier is proven against the running app via the existing smoke spec — page load with no console errors, `/api/hello`, and the `bun:sqlite`-backed `/api/users` route.
- CI is confirmed green on the sprint branch. `.github/workflows/ci.yml` **already exists** and already triggers on push and pull_request to `vortex/**`, `dev` and `main`; this change verifies and adjusts it rather than adding a workflow.

Explicitly out of scope:

- Feature work beyond the branded home page — no pet-store domain model, catalogue or checkout.
- Visual redesign. The boilerplate's design system (OKLCH tokens in `src/index.css`, the `cva` + `cn()` component pattern) is unchanged.
- Dependency or framework swaps, and any re-scaffolding.
- Custom infrastructure or deployment targets. `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `ecosystem.config.js` and `nitro.service` are inherited untouched.
- Replacing the boilerplate's demo data layer (`db/schema.ts`, `routes/api/users/*`), the stub `middleware/auth.ts`, or the leftover scaffolding files the README lists for deletion.

## Capabilities

### New Capabilities

- `application-foundation`: the running, product-branded application and the automated gate that proves it — what a visitor sees at `/`, what a clean checkout must produce, and what CI must report on a branch push.

### Modified Capabilities

None. `openspec/specs/` is empty; this is the project's first change.

## Impact

- **Affected code**: `package.json` (name), `index.html` (title), `public/manifest.webmanifest` (new), `src/constants/index.ts` (`STORE_NAME`), `src/pages/index.tsx` (hero, nav brand label, tech-stack chips), `src/pages/index.test.tsx` and `e2e/home.spec.ts` (assertions pinning the hero), `.github/workflows/ci.yml` (header comment; adjustment only if needed for a green run).
- **APIs**: unchanged. `/api/hello`, `/api/users` and `/api/users/[id]` keep their current shapes; the smoke spec asserts against them as regression cover for the Bun-runtime constraint.
- **Dependencies**: none added, removed or upgraded. `bun.lock` is unchanged.
- **Systems**: GitHub Actions is the only external system involved, through the workflow already in the repository.
- **Constraints carried forward**: the Bun runtime is mandatory wherever `db/client.ts` loads (`bun:sqlite`), and Tailwind v4 is CSS-first with no config file. Both predate this change and neither is relaxed by it.
