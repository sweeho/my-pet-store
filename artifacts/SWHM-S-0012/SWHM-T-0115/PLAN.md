# SWHM-T-0115 — Admin home page and shell

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 2. Admin Home Page & Navigation` (2.1–2.5)
**Requirement:** Administrator home page with rich client launch and logout options

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **S2 and S8 govern this ticket**: the "Launch Rich Client" button does not
> launch a desktop client, and the 54-minute session footnote describes behaviour that does not exist
> yet.

## Objective

Build the screen an administrator lands on, and the chrome every administration screen shares. After
this ticket `/admin` renders, is unreachable without the role, and offers the two actions the mockup
shows. `AdminShell` is consumed by SWHM-T-0120, SWHM-T-0121 and SWHM-T-0122, so its props are fixed
here.

## Design reference

- `artifacts/SWHM-S-0012/design/mockup-admin-home.html` — the screen, its four capability lines, both
  actions, and the session footnote. Take the copy from it verbatim.
- `artifacts/SWHM-S-0012/design/mockup-orders-view.html` — the same header, rendered on a second
  screen. That header is `AdminShell`: the `MPS` mark, "My Pet Store · Administration", the "Signed in
  as _username_" slot, and the optional back link the orders screen shows and the home screen does not.
- `artifacts/SWHM-S-0012/design/wireframe-admin-home.html`, `artifacts/SWHM-S-0012/design/MANIFEST.md`.

## Steps

1. **`AdminShell`** in `src/components/AdminShell.tsx`. It renders the header both mockups share and
   its children beneath. Props are `{ username, backTo?, backLabel?, children }` — the back link
   renders only when `backTo` is given, which is what makes one component serve both screens. It is a
   behavioural component, not a design-system primitive, so it goes in `src/components/` beside
   `StoreMark` and does not follow the `ui/` variants pattern (DESIGN.md § Components, § Brand mark).
   Reuse `StoreMark` rather than drawing a second mark. Export from `src/components/index.ts`.
2. **`/admin`** at `src/pages/admin/index.tsx`, wrapped in `RequireAdmin` (SWHM-T-0114). Inside
   `AdminShell` with no `backTo`: the "Administration" heading, the description sentence, the four
   capability lines, then the two actions and the session footnote — all copy verbatim from the mockup.
3. **The username in the header** comes from the existing `GET /api/signon/session`. While that read is
   outstanding the screen renders its `role="status"` pending element and keeps its heading and
   container visible — a screen gated on a client-side read never renders nothing
   (ARCHITECTURE.md § Key Decisions). `RequireAdmin` already renders its own pending state for the
   access check; do not add a second competing one for the same window.
4. **"Launch Rich Client"** navigates to `/admin/orders`. It is a button, not a form POST: there is no
   `AdminRequestProcessor`, no `currentScreen` parameter and no JNLP (S2). The label stays as the
   mockup has it. `/admin/orders` is SWHM-T-0122's screen and does not exist yet — the control still
   navigates, and the route resolves once that ticket lands.
5. **"Logout"** calls `POST /api/signon/logout` and then navigates to `/`. That endpoint is
   SWHM-T-0116's and does not exist when this ticket is worked; call it anyway and mock `fetch` in the
   test. Do not implement session invalidation here — a second way to end a session is exactly the
   duplication the single-decision rule exists to prevent.
6. **Tests.** `src/components/AdminShell.test.tsx`: the header renders the username, and the back link
   renders only when `backTo` is passed. `src/pages/admin/index.test.tsx`: the heading, the description,
   both actions located by role and accessible name, the pending state before the session read
   resolves, and that the logout control issues a POST to `/api/signon/logout`. Locate everything by
   role and accessible name, never by class name or DOM shape — that is how everything else in this
   codebase is located (DESIGN.md § Loading states).

## Fixed interface contracts

SWHM-T-0120, SWHM-T-0121 and SWHM-T-0122 render inside `AdminShell`. Changing its props is a plan
revision, not an implementation choice.

```tsx
// src/components/AdminShell.tsx
export function AdminShell(props: {
  username: string | null; // null while the session read is outstanding
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
}): JSX.Element;
```

Route paths other tickets link to and test against: `/admin`, `/admin/orders`,
`/admin/reports/revenue`, `/admin/reports/orders`.

## File/module ownership

Create or modify only: `src/components/AdminShell.tsx`, `src/components/AdminShell.test.tsx`,
`src/components/index.ts`, `src/pages/admin/index.tsx`, `src/pages/admin/index.test.tsx`.

Nothing else. `auth/session.ts` and the logout route are SWHM-T-0116's; `src/components/ui/` is
SWHM-T-0122's.

## Definition of Done

AC-1 and AC-2 on the ticket. AC-2 names a POST to `AdminRequestProcessor` with
`currentScreen=manageorders`; what is built is the navigation that replaces it (S2), so the observable
outcome to satisfy is that activating the control takes an administrator to the orders screen.

## Gotchas

- The session footnote says a session ends after 54 minutes. It does not — sessions never expire here
  (S8). The copy is reproduced because the mockup has it; the behaviour is a recorded gap, and the
  follow-up ticket for it is linked from the sprint's planning record.
- Two pending states for the same window is worse than one. `RequireAdmin` owns the access check's
  pending state; this page owns only the session-read one, and only if it renders before the guard has
  resolved.
