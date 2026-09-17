# SWHM-T-0209 — Status colour coding: the status token family and the colour-coded cell

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 6 · Requirement: **Orders Approval screen status column displays color-coded status**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D9 and § Spec discrepancies S3 are what this ticket rests on.

## Objective

Approved reads green, denied reads red, pending reads amber — through a token family added to the design system, not through three colour classes hard-coded in one component.

## Read S3 before writing anything

`tasks.md` group 6 is Swing: a `DefaultTableCellRenderer`, a `setValue()` override, `Color` constants. The behaviour is kept; the mechanism is CSS custom properties and Tailwind utilities.

## Design reference

**`artifacts/SWHM-S-0018/design/mockup-orders-approval.html` is the authority, and it already names the tokens** — its stylesheet declares `--status-{pending,approved,denied}-{bg,fg,border}` under a comment reading "status tints — proposed, not yet in the token file". Those nine light-theme values are the ones to adopt; take them from the file rather than re-deriving them.

## Steps

1. Add the nine light values to `:root` in `src/index.css`, author nine **dark** counterparts in `.dark`, and map all eighteen through the `@theme inline` block. All three places or Tailwind generates no class — the standing rule for this token file.
2. The dark triples are authored, not derived (D9). A light tint run through a darkening formula is not a dark tint. Each theme's `bg`/`fg` pair must be distinct in that theme and meet WCAG 2.1 AA for normal text (4.5:1) in light. These backgrounds are saturated, so the documented neutrals gotcha bites harder here than anywhere else in the system — measure, do not estimate.
3. Extend `src/theme-tokens.test.ts` to cover the three new pairs the way it already covers the destructive pair: distinctness in both themes, the ratio in light. This is the check that stops a later token edit from silently failing contrast.
4. Apply the tokens in `src/components/ui/status-select.tsx` — background, foreground and border per status, following the mockup's `.status-select.{pending,approved,denied}` rules and its focus/open treatment.
5. **The status text stays in the cell.** WCAG 2.1 1.4.1 forbids colour as the sole carrier of information, so AC-2's "without reading the text" is a claim about how fast a reader scanning a column finds a state — not a licence to remove the word. The dot stays `aria-hidden`; it is decoration beside the text, not a replacement for it.
6. Tests: extend `src/components/ui/status-select.test.tsx` to assert each status renders with its own status class, and that the status text is present in every case. Assert by accessible text and by the semantic class the component applies, never by a computed colour value — a jsdom test cannot resolve a custom property and a test that appears to check the colour would be checking nothing.

## File/module ownership

Create: nothing.
Modify: `src/index.css`, `src/theme-tokens.test.ts`, `src/components/ui/status-select.tsx`, `src/components/ui/status-select.test.tsx`.

This is the only ticket in the sprint that touches `src/index.css` or `src/theme-tokens.test.ts`.

## Fixed interface contracts

Token names are fixed, and are what the design system now documents:

```
--status-pending-bg   --status-pending-fg   --status-pending-border
--status-approved-bg  --status-approved-fg  --status-approved-border
--status-denied-bg    --status-denied-fg    --status-denied-border
```

`StatusSelect`'s props signature is SWHM-T-0208's and does not change — this ticket changes only what it renders.

## Definition of Done

AC-1 and AC-2. AC-1 is observable as each status rendering its own status treatment with the correct hue family; AC-2 as the three treatments being mutually distinct and each meeting the contrast bar, with the status text still rendered.
