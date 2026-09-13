# Design — light-mode destructive foreground

Read this before `PLAN.md`. Every decision the fix depends on is here; the plan cites these
sections rather than repeating them.

## Measured context

All figures below were computed from the OKLCH triples in `src/index.css` by converting
OKLCH → linear sRGB (the standard OKLab inverse matrix) → WCAG 2.1 relative luminance, then applying
`(L1 + 0.05) / (L2 + 0.05)`. They are measurements, not estimates.

| Pair                                 | Background                            | Foreground                            | Ratio      | AA (4.5:1) |
| ------------------------------------ | ------------------------------------- | ------------------------------------- | ---------- | ---------- |
| Light destructive (`:root`, current) | `oklch(0.577 0.245 27.325)` `#e7000b` | same value, `#e7000b`                 | **1.00:1** | fail       |
| Dark destructive (`.dark`, current)  | `oklch(0.396 0.141 25.723)` `#82181a` | `oklch(0.637 0.237 25.331)` `#fb2c36` | **2.63:1** | fail       |
| Light `text-destructive` on page bg  | `oklch(1 0 0)` `#ffffff`              | `#e7000b`                             | 4.77:1     | pass       |

## D1 — Set the light `--destructive-foreground` to `oklch(1 0 0)`

The `--destructive` background is fixed (changing it would repaint the four existing
`text-destructive` usages, which are correct today at 4.77:1 — see § "D4 — rejected alternative"),
so the only free variable is the foreground. Against `#e7000b`, contrast rises monotonically as the
foreground lightens, and white is the ceiling:

| Candidate foreground | Resolves to | Ratio vs `--destructive` | Verdict                                               |
| -------------------- | ----------- | ------------------------ | ----------------------------------------------------- |
| `oklch(1 0 0)`       | `#ffffff`   | **4.77:1**               | **chosen** — passes with the largest margin available |
| `oklch(0.985 0 0)`   | `#fafafa`   | 4.56:1                   | passes, but only 1.4% above the threshold             |
| `oklch(0.97 0 0)`    | `#f5f5f5`   | 4.37:1                   | **fails** — do not copy `--secondary`/`--muted`       |

`oklch(0.985 0 0)` is what the sibling foreground tokens (`--primary-foreground`,
`--sidebar-primary-foreground`) use and what upstream shadcn ships, so it is the tempting choice. It
is rejected on margin: at 4.56:1 a 1.4% disagreement between the project's colour conversion and any
other implementation's flips the verdict, and this change is adding a test that asserts the
threshold. `oklch(1 0 0)` already appears three times in the light palette (`--background`,
`--card`, `--popover`), so it is not a foreign value in this file.

The third row is the trap worth naming explicitly: the nearest "light neutral" tokens in the light
block are `0.97`, and they fail.

## D2 — Do not use the `.dark` block as the construction reference

The defect report instructs the fix to be modelled on the `.dark` pair, describing it as correctly
contrasting. Measurement says otherwise: 2.63:1, below AA. Following that instruction would produce a
second failing pair and a test that cannot pass. The dark pair's own shortfall is recorded as
follow-up **F1** in `proposal.md` and is not fixed here.

This is the one place where the ticket as written and the code as measured disagree, so it is called
out rather than silently corrected.

## D3 — The regression guard reads the stylesheet, not a rendered page

The requirement is about token _definitions_, and jsdom does not resolve `oklch()` or cascade custom
properties in a way that would make a rendered-DOM assertion meaningful. The guard therefore parses
`src/index.css` directly.

- **Location:** `src/theme-tokens.test.ts`. It must sit outside `routes/`, `auth/`, `account/` and
  `catalog/` so it runs in Vitest's `client` project — the `server` project's `include` globs
  (`vitest.config.ts:59-64`) are path-based, and a test placed under one of those directories would
  switch projects for no reason. `src/` is the correct home.
- **jsdom is not a constraint here.** The client project sets `css: false`, which disables CSS
  _processing of imports_; reading the file with `node:fs` is unaffected, and `node:fs` is available
  because Vitest runs the jsdom environment inside Node.
- **Path resolution:** resolve from `process.cwd()`, matching the convention `db/client.ts` already
  uses and for the same reason recorded in `AGENTS.md` § Gotchas — these modules are transformed by
  Vite, so `import.meta.url` is not a real `file://` URL.
- **Conversion math lives in the test file.** It is used in exactly one place. A shared
  `src/utils/contrast.ts` would be a single-use abstraction that itself needs a test.
- **What it asserts:** parse the `:root` and `.dark` blocks, extract each block's `--destructive` and
  `--destructive-foreground`, assert the two differ in **both** blocks, and assert the light block's
  pair is at least 4.5:1. The failure message must name the offending theme — a bare
  `expected false to be true` on a colour token is the kind of failure that gets deleted rather than
  fixed.
- **The dark block is asserted for distinctness only, never for 4.5:1.** It is 2.63:1 today; an AA
  assertion on it would fail the suite on arrival.

## D4 — Rejected alternative: darken `--destructive` instead

Lowering the background's lightness would buy contrast headroom for any foreground. It is rejected
because `--destructive` is consumed as _text_ by four pages (`src/pages/signon.tsx:157`,
`src/pages/signon-failed.tsx:7`, `src/pages/user-creation-error.tsx:10`,
`src/pages/customer.tsx:202`), where it currently sits at a passing 4.77:1 on white. Changing it
repaints four working screens to fix one that no page renders yet — the wrong trade for a defect
whose live blast radius is zero.

## Why the AA guarantee is light-theme-only

The added requirement guarantees non-identical pairs in _both_ themes but the 4.5:1 minimum in the
_light_ theme only. That asymmetry is deliberate and temporary: a theme-agnostic AA requirement would
be violated by the dark pair the moment it is written, putting the spec of record in conflict with
the shipped code and failing integration QA for a defect this sprint did not commit to. Follow-up F1
raises the dark theme to the same bar; the requirement's AA clause widens to both themes then.

## Not promoted to `ARCHITECTURE.md`

This decision constrains one token pair and one test file. It binds nothing beyond its own change, so
it stays here. The standing _rule_ it implies — a `--x` / `--x-foreground` pair must never collapse
to one colour — belongs to the design system and is recorded in `DESIGN.md` § Tokens instead.
