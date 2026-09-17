# SWHM-T-0238 — AdminShell on the shared header, and the route guards' column

Change: `swhm-i-0014-consistent-look-and-site-nav`.
Read `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/design.md` before this file; the
steps below cite it rather than repeat it.

Depends on SWHM-T-0236, which owns `StoreHeader` and `src/components/layout.ts`. Do not create or
edit either — consume them.

## Objective

Put the seven administration and supplier screens on the same header as the rest of the store, so
they gain the catalogue and cart links they have never had, and remove the duplicated session read
that the shell's `username` prop forced on each of them.

## Steps

1. **Reduce `AdminShell` to `StoreHeader` in its administration variant** plus the administration
   label, the back-link and the content frame. Design § Decisions D8. Its `backTo`/`backLabel`/
   `children` props are unchanged; `username` goes, because the header reads the session itself.
   The administration variant's control order — and what it deliberately omits — is D7a.
2. **Drop the dead session effect from the seven callers.** Finding F4: all seven run the same
   `useEffect` against `GET /api/signon/session` for no purpose but that prop.
3. **Leave the two page-level sign-out controls alone.** Finding F12 —
   `openspec/specs/admin-operations/spec.md` requires a logout option on the administration home
   page, so `admin/index.tsx` and `supplier/index.tsx` keep theirs. The header offering a second
   route to the same action is not a reason to remove a specified control, and removing it would be
   the screen-content redesign the idea puts out of scope.
4. **Move the route guards' states onto the shared administration column.** `RequireSignOn` and
   `RequireAdmin` both render a `max-w-[672px]` pending state and `RequireAdmin` a refusal state;
   design § Decisions D6.
5. **Keep both guards' `role="status"` indicators.** Design § Decisions D5 — retiring `AdminShell`'s
   own "Signing in…" element does not touch them, and the standing requirement _Observable pending
   state on data-gated screens_ is about the guards, not the shell.
6. **Read the mockup, copy none of its CSS.** Design § Decisions D12 and § Design reference; the
   administration stage in `mockup-header-states-...html` is this ticket's reference.
7. **Update the affected tests in place**, including `AdminShell.test.tsx`, which asserts the
   username-prop behaviour being removed.

## File/module ownership

Modify: `src/components/AdminShell.tsx`, `RequireSignOn.tsx`, `RequireAdmin.tsx` and the
`*.test.tsx` beside each; `src/pages/admin/index.tsx`, `admin/orders.tsx`,
`admin/orders-approval.tsx`, `admin/reports/orders.tsx`, `admin/reports/revenue.tsx`,
`supplier/index.tsx`, `supplier/inventory.tsx` and the `*.test.tsx` beside each.

Not `src/components/StoreHeader.tsx`, `src/components/layout.ts` or `src/components/index.ts`
(SWHM-T-0236), and no customer-facing screen (SWHM-T-0237). `src/pages/admin/signon.tsx` and
`src/pages/admin/signon-failed.tsx` are out of scope — the canvas names both among the four screens
that keep a bare centred card, and `admin/signon-failed.tsx` carries a comment saying why.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-10. AC-1 to AC-4 are the administration header,
AC-5 and AC-6 its identity and keyboard order, AC-7 and AC-8 the column, and AC-9 and AC-10 the two
standing requirements this ticket must not break.
