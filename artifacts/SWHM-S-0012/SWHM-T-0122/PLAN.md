# SWHM-T-0122 — Orders View, read-only orders table

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 9. Rich Client UI — Orders View` (9.1–9.6)
**Requirements:** Orders View screen displays approved and completed orders in read-only table; Retrieve and display orders by status

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **S6 and S14 govern this ticket.** The group describes a Swing `JTable` and a
> `DefaultTableModel`; what is built is a React screen, and `isCellEditable()` becomes a property of
> the DOM.

## Objective

Build the screen an administrator reads the order queue from, and the shared table primitive it
introduces. After this ticket `/admin/orders` renders the orders the API serves, and the browser tier
covers the administrator's path through the product.

## Design reference

- `artifacts/SWHM-S-0012/design/mockup-orders-view.html` — **the authoritative reference for this
  screen.** It fixes: the "← Back to admin home" link, the "Orders" heading, the subtitle "Approved,
  completed and denied orders. Read-only.", the "12 orders" count, the five columns in order (Order ID,
  User ID, Order Date, Order Amount, Status), amounts as `$1,240.00`, dates as `MM/DD/YYYY`, statuses
  as uppercase `APPROVED` / `COMPLETED` / `DENIED`, and no form control anywhere inside the table.
- `artifacts/SWHM-S-0012/design/wireframe-orders-view.html` — its structure.
- `artifacts/SWHM-S-0012/design/MANIFEST.md`.

## Steps

1. **`src/components/ui/table.tsx`** — a shared primitive following the existing `ui/button.tsx`
   pattern exactly: variants via `class-variance-authority` in a separate `table-variants.ts` **only if
   it needs variants** (it likely does not — if there is one appearance, do not manufacture a variants
   file), class merging via `cn()` last so callers can override, and a `*.test.tsx` beside it
   (DESIGN.md § Components). Export the pieces the screen needs from `src/components/ui/index.ts`.
   Render real semantic table elements — `<table>`, `<thead>`, `<th scope="col">`, `<tbody>` — not divs
   with roles. A screen reader gets row and column association for free from the real element and not
   at all from divs, and the tests locate cells by role, which the real element already provides.
2. **The table renders no form controls at all.** No `<input>`, no `<select>`, no `<button>`, nothing
   `contenteditable`, inside the table. That is what `isCellEditable()` returning false becomes here,
   and unlike the Swing method it is checkable from the DOM (S6). Make it an assertion, not an
   intention — see step 6.
3. **`/admin/orders`** at `src/pages/admin/orders.tsx`, wrapped in `RequireAdmin`, inside `AdminShell`
   with `backTo="/admin"` and `backLabel="Back to admin home"`. Fetch
   `GET /api/admin/orders?status=APPROVED&status=COMPLETED&status=DENIED` — the three the requirement
   names, in one request. `PENDING` orders are deliberately excluded from this screen; the API serves
   them and the approval workflow that acts on them is `swhm-i-0011` (S14).
4. **Formatting is the screen's job**, not the API's. The API returns an ISO date and a number; the
   screen renders `MM/DD/YYYY` and `$1,240.00` as the mockup shows. Prices, dates and number formats
   are English/US throughout — PRODUCT.md § Scope settles this, so do not reach for locale-aware
   formatting here.
5. **States.** A `role="status"` pending element while the fetch is outstanding, with the heading and
   container still rendered — never an empty page (DESIGN.md § Loading states). An empty result gets a
   named state saying no orders are in those statuses, in the place the table would have been, not a
   blank region (DESIGN.md § Unavailable content states). The count line ("12 orders") reflects the rows
   actually rendered.
6. **Tests.** `src/components/ui/table.test.tsx`: the primitive renders semantic table elements and
   merges a caller's class last. `src/pages/admin/orders.test.tsx`: the five column headers in order,
   a rendered row's formatted date and amount, the pending state, the empty state, and — the one that
   matters — that the rendered table contains no `textbox`, `combobox`, `button` or `checkbox` role
   anywhere within it. Locate everything by role and accessible name, never by class name or DOM shape.
7. **`e2e/admin.spec.ts`** — create it. This ticket's spec covers the administrator's happy path:
   sign in at `/admin/signon`, reach `/admin`, follow the launch control to `/admin/orders`, and see the
   table with its five columns. SWHM-T-0123 extends the same file with the denial paths; leave it
   structured so a second describe block can be added without rewriting the first. Follow
   `e2e/signon.spec.ts` for how a session is established in this tier. **A spec you have not executed is
   not a test** — but implementation containers ship no Chromium, so run the browser-free gate locally,
   say so in your work log, and let CI observe the browser tier on your branch.

## Fixed interface contracts

```tsx
// src/components/ui/table.tsx — a primitive, consumed by the screen
export function Table(props: TableHTMLAttributes<HTMLTableElement>): JSX.Element;
export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>): JSX.Element;
export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>): JSX.Element;
export function TableRow(props: HTMLAttributes<HTMLTableRowElement>): JSX.Element;
export function TableHead(props: ThHTMLAttributes<HTMLTableCellElement>): JSX.Element;
export function TableCell(props: TdHTMLAttributes<HTMLTableCellElement>): JSX.Element;
```

Consumes `OrderSummary` and `GET /api/admin/orders` from SWHM-T-0118 and `AdminShell` from
SWHM-T-0115, both unchanged.

## File/module ownership

Create or modify only: `src/components/ui/table.tsx`, `src/components/ui/table.test.tsx`,
`src/components/ui/index.ts`, `src/pages/admin/orders.tsx`, `src/pages/admin/orders.test.tsx`,
`e2e/admin.spec.ts`.

Nothing else. The API is SWHM-T-0118's and is landed; `AdminShell` is SWHM-T-0115's and is landed.

## Definition of Done

AC-1 through AC-4 on the ticket. AC-3 asserts that "the model SHALL return false for all rows and
columns"; the observable outcome that replaces it is that the rendered table contains no interactive
control (S6). AC-4's status set is the three the screen requests — the API still serves `PENDING`
(S14).

## Gotchas

- Divs with ARIA roles do not give a screen reader what a real `<table>` does, and the tests locate by
  role either way — so the wrong choice passes its tests and fails its users.
- A variants file for a component with one appearance is ceremony. `button-variants.ts` exists because
  the button has variants.
- The count line must count rendered rows. Taking it from a total the API does not return is how it
  comes to disagree with the table beneath it — and the API returns `hasNext`, never a count
  (ARCHITECTURE.md § Key Decisions).
