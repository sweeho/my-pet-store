# SWHM-T-0236 — Shared StoreHeader and the session role contract

Change: `swhm-i-0014-consistent-look-and-site-nav`.
Read `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/design.md` before this file; the
steps below cite it rather than repeat it.

## Objective

Create the header every other screen in this sprint renders, and the session read it depends on.
Nothing else in the sprint can start until the component and the response shape exist.

## Steps

1. **Export the `role` on the session read.** `routes/api/signon/session.get.ts` already resolves the
   session; add the role from `findUserRole()`, which `middleware/signon.ts` and `check.get.ts`
   already call. Design § Decisions D2 and D3 say why this endpoint and not `check.get.ts`, and F5
   and F6 are the measurements behind it. The handler must stay a pure read — it writes nothing.
   Its test goes in `routes/`, which is where Vitest's `server` project picks it up (F-note in
   ARCHITECTURE.md § Cross-cutting constraints).
2. **Add `src/components/layout.ts`** with the two shared width constants. Design § Decisions D6 —
   including why there are two and not one, and what to tell QA about the deviation.
3. **Build `StoreHeader`.** Three variants and their control order are fixed by the mockup and
   restated in design § Decisions D7a; the identity states and the pre-session copy are D5. Take the
   props from design § Fixed interface contracts verbatim — two other tickets code against them.
   The cart's line count comes from `GET /api/cart`, which is public and already returns `count`
   (F7).
4. **Read the mockups, copy none of their CSS.** Design § Decisions D12 and § Design reference.
   `artifacts/SWHM-S-0021/design/mockup-header-states-visitor-customer-administr.html` is the
   authority for this ticket. The mockups link a Google-hosted font; the application must not.
5. **Export from `src/components/index.ts`.** This ticket owns that file for the sprint.
6. **Cover it.** Component tests beside `StoreHeader.tsx` following `AdminShell.test.tsx`; the route
   test from step 1. Design § Phases, phase 4.

## File/module ownership

Create: `src/components/StoreHeader.tsx`, `src/components/StoreHeader.test.tsx`,
`src/components/layout.ts`, `routes/api/signon/session.get.test.ts`.
Modify: `src/components/index.ts`, `routes/api/signon/session.get.ts`.

No page file belongs to this ticket. SWHM-T-0237 and SWHM-T-0238 depend on it and own disjoint sets
of screens, so nothing here may reach into `src/pages/`.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-17, each traceable to the scenario it names.
AC-1 to AC-4 are the header's structure, AC-5 to AC-8 its identity states, AC-9 and AC-10 the
administrative link, AC-11 and AC-12 the administration variant, AC-13 to AC-16 the session read,
and AC-17 the two width declarations.

Design § Decisions D4 is not a criterion and must not become one: hiding the Admin link protects
nothing, and no test here should be written as though it did.
