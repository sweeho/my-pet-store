# SWHM-T-0208 — Approval screen: pending orders table with editable status

Change: `swhm-i-0011-order-approval-workflow` · `tasks.md` group 5 · Requirement: **Orders Approval screen displays pending orders with editable status**

Read `openspec/changes/swhm-i-0011-order-approval-workflow/design.md` first — § Decisions D8, D9 and § Spec discrepancies S3, S14 are what this ticket rests on.

## Objective

A new page at `/admin/orders-approval` listing every pending order in a table whose Status column carries a per-row control offering PENDING, APPROVED and DENIED. This ticket builds the table and the control. SWHM-T-0209 colours it; SWHM-T-0210 adds selection and the three actions.

## Read S3 before writing anything

`tasks.md` group 5 is Swing: `OrdersApprovePanel`, `createUI()`, a combo-box cell editor, `DefaultTableCellRenderer`, and line numbers into a Java file. None of it describes anything to build — `PRODUCT.md § Non-goals` forbids a rich client outright and the replacement is a page in the application already being served. Build what the mockup shows.

## Design reference

**`artifacts/SWHM-S-0018/design/mockup-orders-approval.html` is the authority.** It fixes the title ("Orders Approval"), the subheading naming the auto-approval threshold as the reason an order is on the list, the six columns in order — selection · Order ID · User ID · Order Date · Order Amount · Status — the status control's three options and their dots, and the open-menu state. `artifacts/SWHM-S-0018/design/wireframe-orders-approval.html` carries the same layout unfinished. `artifacts/SWHM-S-0018/design/MANIFEST.md` lists both.

## Steps

1. Create `src/pages/admin/orders-approval.tsx` → `/admin/orders-approval`. Wrap in `RequireAdmin` and render inside `AdminShell` with `backTo="/admin"`, mirroring `src/pages/admin/orders.tsx`'s structure — the session fetch, the data fetch, the `role="status"` loading region and the empty state are all patterns that file already establishes. The `/admin` protected-resource entry guards by prefix, so no resource-list change is owed.
2. **Do not modify `src/pages/admin/orders.tsx`.** It is read-only by construction and excludes `PENDING` deliberately; this is a second screen beside it, not a mode on it (D8). A read-only table renders no control at all, an editable one carries per-row controls — they are different components under one standing rule.
3. Fetch `GET /api/admin/orders?status=PENDING`. That endpoint already exists and already serves PENDING; add nothing to it.
4. Render real `<table>` semantics through the existing `Table` primitives. Format the date and the amount on the screen, not in the API, reusing the formatting `src/pages/admin/orders.tsx` already uses.
5. Create `src/components/ui/status-select.tsx` — the per-row status control, built on `@headlessui/react` (already a dependency) following the mockup's listbox: a trigger showing the current status with its dot, and a menu of the three options. Export it from `src/components/ui/index.ts`. Render the status **text** inside the control, always: the dot is `aria-hidden` and colour is never the only cue. Leave the colour classes for SWHM-T-0209 — build it with the neutral surface for now.
6. **Every control in a row carries an accessible name that names that row's order** — `aria-label="Status for order 1047"`, never "Status". A control named only by its column is announced identically in every row, and it is what a test locates the control by.
7. Never synthesize a DOM event at the headless component to drive it — a headless listbox reacts to a full pointer and focus sequence, and the standing decision on this is in `ARCHITECTURE.md § Key Decisions`. Lift state and pass a callback.
8. Add a link to the new page on `src/pages/admin/index.tsx`. Its copy already promises "Approve or deny pending orders, several at a time" and today nothing delivers it — a second control beside "Launch Rich Client".
9. Tests: `src/pages/admin/orders-approval.test.tsx` and `src/components/ui/status-select.test.tsx`, both `client`-project tests by living under `src/`. Assert the five data columns render for each pending order, and that opening a row's status control reveals exactly PENDING, APPROVED and DENIED. Locate everything by role and accessible name, never by class name.

## File/module ownership

Create: `src/pages/admin/orders-approval.tsx`, `src/pages/admin/orders-approval.test.tsx`, `src/components/ui/status-select.tsx`, `src/components/ui/status-select.test.tsx`.
Modify: `src/components/ui/index.ts`, `src/pages/admin/index.tsx`, `src/pages/admin/index.test.tsx`.

`src/pages/admin/orders-approval.tsx` and `src/components/ui/status-select.tsx` are modified again by SWHM-T-0209 and SWHM-T-0210, each behind a dependency edge.

## Fixed interface contracts

```tsx
// src/components/ui/status-select.tsx
export function StatusSelect(props: {
  value: OrderStatus;
  orderId: number; // supplies the row-naming accessible label
  onChange: (next: OrderStatus) => void;
  disabled?: boolean;
}): JSX.Element;
```

`OrderSummary`, `Page` and `OrderStatus` come from `admin/types.ts` unchanged. The page's route path `/admin/orders-approval` is fixed — SWHM-T-0210's Playwright spec navigates to it.

## Definition of Done

AC-1 and AC-2, both observable in the screen test by role and accessible name.
