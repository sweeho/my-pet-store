# PLAN — SWHM-T-0005: light-mode `--destructive-foreground`

Change: `swhm-s-0005-bugfix-swhm-t-0005-light-mod`
Requirement: _Legible destructive surface colours_ (`application-foundation`)

**Read `openspec/changes/swhm-s-0005-bugfix-swhm-t-0005-light-mod/design.md` first.** It carries the
measurements, the chosen value and the reason the defect report's suggested reference is wrong. The
steps below cite it rather than repeat it.

## Objective

Make the light theme's destructive foreground legible against its own background, and add the
automated assertion that stops the pair collapsing again.

## Steps

1. **Change one token value.** In the `:root` block of `src/index.css`, set
   `--destructive-foreground` to `oklch(1 0 0)`. Leave line 22 (`--destructive`) and the whole
   `.dark` block untouched. → design.md § D1 for why this value and not the two obvious
   alternatives, § D4 for why the background stays as it is.

   Do **not** model the fix on the `.dark` block, whatever the ticket's original report says — that
   pair is itself below AA. → design.md § D2.

2. **Add the regression guard** at `src/theme-tokens.test.ts`: parse `src/index.css`, extract each
   theme block's `--destructive` / `--destructive-foreground`, assert both blocks' pairs are
   non-identical, assert the light pair is ≥ 4.5:1, and make the failure message name the offending
   theme. → design.md § D3 for the file location, the `process.cwd()` path convention, why the
   conversion math stays inside the test file, and why the dark block is checked for distinctness
   only.

3. **Confirm no collateral movement.** The four `text-destructive` consumers read `--destructive`,
   not the foreground token, so they should be untouched; `src/components/ui/button.test.tsx` asserts
   a class name, not a colour. There are no snapshot fixtures in the repository. → design.md
   § "Measured context" and proposal.md § Impact.

## File / module ownership

May create or modify:

| Path                       | Change                                                       |
| -------------------------- | ------------------------------------------------------------ |
| `src/index.css`            | one line — the `:root` `--destructive-foreground` value only |
| `src/theme-tokens.test.ts` | new file — the regression guard                              |

Must not touch: the `.dark` block, `--destructive` itself, `src/components/ui/button-variants.ts`,
any page under `src/pages/`, `tailwind.config.ts`, and the root docs (`AGENTS.md`, `PRODUCT.md`,
`ARCHITECTURE.md`, `DESIGN.md`) — `DESIGN.md` was already brought to target state on the planning
ticket.

No other ticket in this sprint writes these files, so there is no ordering dependency.

## Definition of Done

- AC-1, AC-2 and AC-3 on the ticket are met.
- `src/theme-tokens.test.ts` has been executed and observed to pass, and observed to fail when the
  light foreground value is temporarily reverted to the duplicate (check the guard actually guards
  before trusting it).
- The diff is two files and no more.
