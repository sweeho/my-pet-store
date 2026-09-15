# PLAN — SWHM-T-0094: every page hotlinks Google Fonts

Change: `swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00`. Read that change's `design.md` first — § RC-1, D1
and D2 carry the reasoning these steps rest on, including why the reported fix (self-hosting the
`.woff2` files) is the wrong one.

## Objective

No page fetches a font, stylesheet or preconnect hint from a host other than the application's own
origin, and the store's rendered type is unchanged.

## Design reference

The idea behind this sprint carries no design blocks — these are Inspector-raised defects with no
Ideas Canvas and no mockups, so there is nothing to export under `artifacts/SWHM-S-0009/design/`. The
standing visual rule this defect violates is DESIGN.md § Brand mark.

## Steps

1. Remove the `Fonts({ google: { families: fonts } })` entry from the `plugins` array in
   `vite.config.ts`, along with the `unplugin-fonts/vite` import and the
   `import { fonts } from "./configs/fonts.config"` line.
2. Delete `configs/` — `fonts.config.ts` and the `index.ts` barrel that only re-exports it. Confirm no
   remaining importer before deleting; at `81f55c7` the only one is the line removed in step 1.
3. Remove the `"configs"` entry from `tsconfig.node.json`'s `include` array, and the `unplugin-fonts`
   dependency from `package.json` (see design.md D1 for why the dependency goes rather than stays).
4. Add a browser-tier assertion to `e2e/home.spec.ts`: record every request the page issues while
   loading `/`, and read the `href` of every `<link>` in the document head. Assert each names the
   application's own origin. See design.md D2 — jsdom cannot see a head link Vite injects at build
   time, so this cannot be a unit test.
5. Confirm the store's type is visually unchanged. It will be: `Space Grotesk` is declared by no
   stylesheet in the repository, so the page already renders in the platform system stack.

## File / module ownership

Only these files. No other ticket in this sprint touches any of them.

- `vite.config.ts`
- `configs/fonts.config.ts`, `configs/index.ts` — deleted
- `tsconfig.node.json`
- `package.json`, `bun.lock`
- `e2e/home.spec.ts`

Fixed contract: `catalog/`, `routes/`, `auth/`, `src/**` and `src/index.css` are out of scope. This
change removes a build-time head injection and nothing else — if a page's appearance moves, stop and
re-read design.md D1 rather than adding a replacement font.

## Definition of Done

The ticket's acceptance criteria AC-1 and AC-2 hold. The browser-tier assertion added in step 4 is the
observation for both, and it runs in CI on this branch — see design.md § Verification note for why it
does not run in this container.
