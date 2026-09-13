# Fix the invisible light-mode destructive foreground

## Why

In the light theme, `--destructive` and `--destructive-foreground` are byte-identical
(`src/index.css:22-23`, both `oklch(0.577 0.245 27.325)`). The only consumer of the pair is the
`destructive` button variant (`src/components/ui/button-variants.ts:9`), which applies
`bg-destructive text-destructive-foreground` — so a destructive button renders its label in exactly
its own background colour. Measured contrast ratio: **1.00:1**. The label is not merely hard to
read, it is absent.

Nothing in `openspec/specs/` currently says anything about theme tokens or colour contrast, which is
why the duplication survived four sprints and why this delta ADDS a requirement rather than
modifying one. The gap is already known to the project: `DESIGN.md` carries a "Known bug" line about
it, which is documentation standing in for a guarantee.

## What Changes

- Give the light theme's `--destructive-foreground` a value distinct from `--destructive` that meets
  the WCAG 2.1 AA minimum for normal text (4.5:1).
- Add an automated unit assertion over the token definitions so an identical pair fails the suite in
  either theme, instead of shipping unnoticed.
- Record the contrast rule as a standing design-system standard in `DESIGN.md`, replacing the "Known
  bug" note (done on the planning ticket, not by the fix).

## Impact

- **Capability affected:** `application-foundation` — one ADDED requirement, _Legible destructive
  surface colours_.
- **Code:** `src/index.css` (one token value), plus one new test file. No component, page or route
  changes. The four `text-destructive` usages (`src/pages/signon.tsx:157`,
  `src/pages/signon-failed.tsx:7`, `src/pages/user-creation-error.tsx:10`,
  `src/pages/customer.tsx:202`) read `--destructive` as text on the page background and are
  untouched by a change to the _foreground_ token.
- **User-visible blast radius today: none.** No page currently renders
  `<Button variant="destructive">`; the variant is exercised only by
  `src/components/ui/button.test.tsx`, which asserts the `bg-destructive` class and not a colour
  value. The defect is latent, not live — it is worth fixing because the next destructive button
  added would ship invisible, not because a user is hitting it now.
- **No snapshot tests exist** anywhere in `src/` or `e2e/`, so no fixture pins the broken value.

## Out of scope — follow-ups for a later sprint

These were found while root-causing and are deliberately **not** fixed here. Planning has no
defect-creation authority, so they are recorded here rather than ticketed.

- **F1 — The dark-mode destructive pair also fails WCAG AA.** The defect report names the `.dark`
  pair (`src/index.css:58-59`) as "correctly contrasting" and as the reference for constructing the
  light-mode fix. That claim does not survive measurement: background `oklch(0.396 0.141 25.723)`
  (`#82181a`) against foreground `oklch(0.637 0.237 25.331)` (`#fb2c36`) is **2.63:1** — legible, but
  short of the 4.5:1 AA minimum for normal text. It is a genuinely distinct defect from the
  light-mode one (which is 1.00:1) and is out of this change's scope, but the implementation agent
  must not copy the dark pair's construction. See `design.md` § "Why the AA guarantee is
  light-theme-only".
- **F2 — The same duplication is almost certainly upstream.** This repository was bootstrapped from
  `cognizhi/vortex-boilerplate-ts-reactjs-vite-tailwindcss`, and the duplicated line has been present
  since the initial commit. The fix should be reported upstream so every future generated project
  does not inherit it. Out of scope for this repository's own fix.
- **F3 — An empty `tailwind.config.ts` sits at the repository root.** It is 0 bytes and dates from
  the initial commit. `AGENTS.md` states this project is Tailwind CSS-first and that adding such a
  file is a defect; an empty one is inert today but contradicts the documented convention and will
  mislead the next person who opens it. Deleting it is unrelated to this change.
