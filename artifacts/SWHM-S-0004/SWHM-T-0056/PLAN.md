---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0056
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0056/summary.md]
---

# Plan — SWHM-T-0056: Catalog browsing screens and end-to-end coverage

## Objective

The capability becomes something a person can use: four screens carrying the category → product → item journey plus search, with pagination controls driven by the `Page` the API already returns, and a Playwright spec that walks the whole path in a browser against the seeded catalogue.

## Steps

1. Add the four pages at exactly the paths in `artifacts/SWHM-S-0004/INTERFACES.md` § Screens. Routing is file-based — creating the file is the whole registration step.
2. Build them from the patterns already in the repository: the card, label-over-value and error-text shapes in `src/pages/customer.tsx`, and the `Button` primitive in `src/components/ui/`. There is no mockup for this capability — see the § Design reference below.
3. Keep pagination state in the URL as `?start=`, so a page is linkable and survives a reload. Disable previous when `start` is 0 and next when `hasNext` is false, reading both off the `Page` rather than recomputing them.
4. Put the search box on `/catalog` and keep the query in the URL as `?q=`, so a result page can be linked to.
5. Resolve the locale once: a signed-on customer's `preferredLanguage` from `GET /api/customer`, falling back to `en_US` for a visitor with no session. The catalogue itself requires no session, so a failed profile read is a fallback, never an error state.
6. Render a not-found state for an unknown id rather than letting a null response reach the render path as a blank screen.
7. Write component tests beside each page. They run in Vitest's `client` project automatically — `src/pages/**` is already covered, and no config change is needed.
8. Write `e2e/catalog.spec.ts` covering the journey and the search path. Run it at least once before committing: a spec that has never executed is not a test.

## File/module ownership

- `src/pages/catalog/` — the four pages and their `*.test.tsx` files
- `e2e/catalog.spec.ts`

## Definition of Done

- AC-1 — `/catalog` reachable with no session.
- AC-2 — the category → product → item journey.
- AC-3 — search with the query in the URL.
- AC-4 — pagination controls against `start` and `hasNext`.
- AC-5 — locale from the stored preference, `en_US` otherwise.
- AC-6 — the not-found state.
- AC-7 — component tests in the `client` project.
- AC-8 — `e2e/catalog.spec.ts`.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`._

This ticket owns the whole catalogue surface, so there is no split to negotiate with a peer. Build to `DESIGN.md`'s tokens and component pattern and to the page shapes already in `src/pages/`, exactly as SWHM-S-0002 built five sign-on screens with no mockup. One known trap, already recorded in `DESIGN.md` § Tokens: light-mode `--destructive-foreground` duplicates `--destructive`, so error text on the page background uses `text-destructive` — SWHM-T-0036 hit this.
