---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0055
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0055/summary.md]
---

# Plan — SWHM-T-0055: Catalog facade and public HTTP surface

## Objective

The catalogue becomes reachable. One facade gives every caller the same seven operations with the same defaults, and seven GET routes put them on the network — public, because browsing a shop before signing in is the point.

## Steps

1. Create `catalog/catalog.ts` re-exporting the seven operations as one surface, applying the defaults fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § HTTP surface: `start = 0`, `count = 25`, `locale = "en_US"`. Defaults live here, once, so a route cannot drift from the facade.
2. The legacy's two access paths — transactional bean and read-only fast lane — collapse to this one function call. Say so in the module's own comment and do not build a choice; see `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, S2.
3. Add the seven route files at exactly the paths in § HTTP surface, each a `defineHandler` following the shape of `routes/api/customer/index.get.ts`.
4. Answer failures with `setResponseStatus` plus a plain `{ error: string }` body — never `createError`, whose serialization adds fields that break a fixed body contract. SWHM-T-0035 established this deliberately.
5. Validate query parameters in the routes: a missing `categoryId`, `productId` or `q` is 400; a non-numeric `start` or `count`, or a `count` outside 1–100, is 400. A missing entity is 404, never a 200 carrying `null`.
6. Read no session cookie anywhere, and leave `auth/protected-resources.ts` untouched (design.md § Planning record, D6).
7. Write one test file per route directory under `routes/`, each covering a success and a failure response. Route tests must live under `routes/` to land in Vitest's `server` project.

## File/module ownership

- `catalog/catalog.ts`
- `routes/api/catalog/` — all seven handlers and their test files

## Definition of Done

- AC-1 — the facade as the single entry point.
- AC-2 — the seven routes at the paths in § HTTP surface.
- AC-3 — the three defaults applied in the facade.
- AC-4 — 404 with `{ error: string }` for a missing entity.
- AC-5 — 400 for a missing required parameter.
- AC-6 — 400 for an invalid `start` or `count`.
- AC-7 — every route reachable with no session.
- AC-8 — the route tests under `routes/`.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
