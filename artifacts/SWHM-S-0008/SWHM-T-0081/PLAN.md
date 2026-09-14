# PLAN — SWHM-T-0081: landing nav and hero links are dead placeholders

Change: `swhm-s-0008-bugfix-found-by-inspector`
Requirement: _Application shell navigation_ (`application-foundation`)

## Design reference

No design blocks — this sprint is an idea-less defect batch, so there is no
`artifacts/SWHM-S-0008/design/` directory. The visual target is the existing header and hero layout,
unchanged apart from the link text and the two removed controls.

## Objective

Make every navigation and hero control on `/` reach a screen the application serves, and remove the
ones that name nothing this product has.

## Steps

1. Read `design.md` § RC-1 and § D-2 first — § D-2 carries the destination table this plan executes.
   Do not re-derive it.
2. Rewrite the `navigation` array (`src/pages/index.tsx:6-11`) to the two entries § D-2 names:
   "Catalog" → `/catalog`, "My account" → `/customer`. It is rendered twice (desktop at :43, mobile
   panel at :79); both loops keep working unchanged.
3. Point both "Log in" controls (`:50-53` desktop, `:90-95` mobile) at `/signon`, and the hero's
   "Get started" (`:135-140`) at `/catalog`.
4. Remove the hero's "View on GitHub" anchor (`:141-143`) and the eyebrow's "See how it works"
   anchor (`:120-123`). The eyebrow anchor carries an absolute-inset overlay span — remove the
   overlay with it and leave the "Now open for the neighborhood." text as plain copy.
5. Switch every in-app destination to `Link` from `react-router`, imported as
   `src/pages/catalog/index.tsx` does it. `Link` renders an `<a>`, so existing role-based queries
   keep matching (§ D-2).
6. Update `src/pages/index.test.tsx`'s mobile-dialog test — it names "Features" and "Tech Stack" —
   and `e2e/home.spec.ts`'s desktop-nav test, which asserts all four old names are visible. Both
   assert template copy; § D-2 calls this out as the one place an existing test is rewritten. Add an
   assertion that no anchor on the page has `href="#"`.
7. Anything rendered inside a `Link` needs a router context in a test — `src/pages/index.test.tsx`
   currently renders `<Home />` bare. Wrap the renders as the existing catalogue page tests do.

## File / module ownership

Modify:

- `src/pages/index.tsx` — the `navigation` array, both "Log in" anchors, the three hero anchors, and
  the `react-router` import
- `src/pages/index.test.tsx` — the nav-name assertions, the router wrapper, the new no-placeholder assertion
- `e2e/home.spec.ts` — the desktop-nav and mobile-dialog nav names

Do not modify `src/components/StoreMark.tsx` or the logo markup — that is SWHM-T-0080, which lands
before this ticket.

## Definition of Done

- AC-1, AC-2 and AC-3 on the ticket are met.
- `e2e/home.spec.ts`'s viewport/scrollbar test and its open/close dialog behaviour still pass; only
  the link names inside them move.
- No file outside the ownership map above is changed.
