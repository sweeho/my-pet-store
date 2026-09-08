## Context

See proposal.md — Why. This section records only what was **measured** in the repository during planning, because the whole point of a bootstrap sprint is to replace assumptions about the starting codebase with observations of it.

Provenance: `bootstrap-tmpl.yaml` records the repo as generated from `cognizhi/vortex-boilerplate-ts-reactjs-vite-tailwindcss` at sha `b919022a97f15a9d810e27323dcce6878f37303b`, stack `ts-reactjs-vite-tailwindcss`, applied 2026-09-08.

Measured during planning, on this branch:

- **The browser-free gate already passes.** Linting is clean, `tsc --build` is clean, and the unit/integration suite reports 7 files / 20 tests green in under a second. The starting codebase is not broken; it is merely unbranded.
- **The browser tier could not be executed here.** The Playwright preflight (`scripts/ensure-playwright-browser.mjs`) reported Chromium genuinely absent from the planning container and exited before any spec ran. Per the stack rules this was not retried and no browser was installed. The E2E tier is therefore proven by CI and at integration QA, not by planning.
- **CI already exists.** `.github/workflows/ci.yml` triggers on push and pull_request to `vortex/**`, `dev` and `main`, and runs doc links → typecheck → lint → test → build → Chromium install → E2E. The idea's "a CI workflow is added" is already satisfied structurally; what is unproven is that it goes green with rebranded assertions.
- **Boilerplate identity is in five places**, and two of them are assertions: `package.json` `name: "react-ts-starter"`; `index.html` `<title>Vite + React + TS</title>`; `src/pages/index.tsx` (hero heading "Vortex: the AI-driven autonomous software factory", nav `sr-only` brand label, the "boilerplate behind Vortex" eyebrow, and the tech-stack chip list); `src/pages/index.test.tsx:20` pinning `/Vortex: the AI-driven autonomous/`; `e2e/home.spec.ts:17` asserting the h1 contains "Vortex".
- **`src/constants/index.ts` already exports `STORE_NAME = 'Your Store-Name'`** — a placeholder the boilerplate put there for exactly this purpose.
- **`index.html` links `/manifest.webmanifest`, which does not exist.** `public/` holds only `favicon.ico` and `vite.svg`. Whether the dangling link currently surfaces as a console error could not be confirmed without a browser, and `e2e/smoke.spec.ts` asserts `consoleErrors` is empty — so this is a live risk to a criterion, not merely untidiness.

## Goals / Non-Goals

**Goals:**

- One implementation session, one commit series, one green CI run. The bootstrap scope is small enough that splitting it costs more than it buys.
- Every identity string changed in the same pass as the assertion that pins it, so the suite is never transiently red for a reason unrelated to a defect.
- The design record for future sprints: what the stack is, what constrains it, and what was deliberately left alone.

**Non-Goals:**

- Deciding the pet-store domain model. Nothing here names an entity beyond the boilerplate's demo `users` table.
- Improving anything the measurements found wrong but that no acceptance criterion depends on. Those are recorded below and raised as separate tickets.

## Decisions

**D1 — Adopt the boilerplate as-is; the starting codebase is the implementation base.**
The measured gate is already green, so re-scaffolding trades a working foundation for an unproven one and forfeits the boilerplate's accumulated regression cover (the smoke spec's `/api/users` probe exists specifically because a Bun-runtime regression once shipped undetected). _Alternative considered:_ generate a fresh app and port pieces across — rejected, it converts a zero-risk sprint into a full re-verification.
_Binds future work:_ yes. Structure, tooling, routing, styling and dependency choices are fixed for subsequent sprints unless a change explicitly proposes otherwise.

**D2 — The project name lives in `src/constants/index.ts` as `STORE_NAME`, and the home page reads it from there.**
The constant already exists and is already named for this. _Alternative considered:_ hard-code "My Pet Store" in the JSX — rejected; the next screen would hard-code it again, and the boilerplate already provides the seam. This is not a new abstraction, it is the one that shipped with the template.

**D3 — Create `public/manifest.webmanifest` rather than deleting the link from `index.html`.**
`index.html` already declares the link; a web app manifest is also where a product name belongs, so the branding work and the dangling-reference fix are the same edit. Deleting the link would also satisfy the smoke spec but leaves the app with no manifest at the first point someone wants one. _Trade-off:_ one new file in a sprint whose rule is "minimum changes" — accepted because it closes a reference the repository already makes.

**D4 — Verify and adjust the existing CI workflow; do not author a new one.**
It already covers every tier and already matches `vortex/**`. Adding a second workflow would double every check run on every sprint branch. The header comment ("CI for the boilerplate ITSELF") is now false and is corrected in the same pass.

**D5 — Assertions move with the copy they pin, inside the same ticket.**
`src/pages/index.test.tsx` and `e2e/home.spec.ts` are listed in the implementation ticket's ownership map for this reason. A separate "update the tests" ticket would guarantee a red window between the two merges.

**D6 — Leave the design system untouched.**
No token, type-scale, grid, interaction pattern or accessibility standard changes. The rebranded home page is built from patterns that already exist, which is explicitly not a design-system change.

## Phases

Ordered, and all carried by the single implementation ticket (SWHM-T-0004) — the numbering matches `tasks.md`.

1. **Identity** — `package.json` name, `index.html` title, `STORE_NAME`, `public/manifest.webmanifest`.
2. **Home page** — hero heading, eyebrow, body copy, nav brand label and chip list in `src/pages/index.tsx`, sourcing the name from `STORE_NAME`.
3. **Test harness** — update the two assertions that pin the old hero (`src/pages/index.test.tsx`, `e2e/home.spec.ts`) so the suite pins the new one; confirm the browser-free gate is green. No new test tier and no new harness configuration is introduced: the boilerplate already ships one worked example per tier (unit `src/utils/cn.test.ts`, component `src/components/ui/button.test.tsx`, page `src/pages/index.test.tsx`, route `routes/api/hello.test.ts`, E2E `e2e/home.spec.ts`, smoke `e2e/smoke.spec.ts`), and Vitest's two-project split (`client` jsdom / `server` node for `routes/**`) already routes them correctly.
4. **Clean-checkout build** — confirm a checkout with no generated files installs and builds, emitting `dist/` and `.output/`. `auto-imports.d.ts` does not exist on a fresh clone; the `prebuild`/`pretypecheck` hooks generate it, which is why no new tsc-only script is added here.
5. **CI** — push to the sprint branch, correct the workflow's stale header comment, and confirm the check run's conclusion is success. The browser tier is proven here, since it cannot be proven in an agent container.

## Risks / Trade-offs

- **The manifest may not be the only source of console output** → the smoke spec's `consoleErrors` assertion is the detector; if something else surfaces, phase 5 fails loudly on CI rather than silently, and `e2e/smoke.spec.ts` is in the ticket's ownership map so the finding can be handled in the same session.
- **E2E was unproven at planning time** → CI installs Chromium and runs the full tier on every push to `vortex/**`, and validation runs it again at integration QA against the merged sprint branch. Two independent executions, neither of them in an engineer container.
- **Rebranding the hero changes what three files assert about the same string** → all three are owned by one ticket (D5), so they change together in one merge.
- **"Minimum changes" is a judgement call** → the ownership map in SWHM-T-0004 is the boundary; anything outside it is a separate ticket, not a discretionary extra.

## Deliberately left alone

Measured, real, and out of this change's scope — each raised as its own ticket rather than folded in:

- `src/index.css` light-mode `--destructive-foreground` duplicates `--destructive`, so destructive text is invisible against its own background. Dark mode is correct. DESIGN.md already documents it as a known bug.
- `tailwind.config.ts` exists as an empty tracked file, contradicting the CSS-first Tailwind v4 setup that both ARCHITECTURE.md and the agent guide describe.
- Boilerplate demo content the README's own "Make it yours" table marks for replacement: `routes/api/users/*` + `db/schema.ts`, the hardcoded-user stub in `middleware/auth.ts`, `src/helpers/demo.ts`, and `src/App.md`. The smoke spec depends on the `users` route today, so replacing it is a change with its own spec delta, not a tidy-up.
