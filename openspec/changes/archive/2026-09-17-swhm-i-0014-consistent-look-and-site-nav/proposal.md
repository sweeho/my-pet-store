## Why

The store reads as several different products depending on where a visitor lands, and most
screens offer no way to get anywhere else.

**Navigation.** Counted on the sprint branch, the application routes 25 screens. Exactly one — the
home page (`src/pages/index.tsx`) — carries a navigation bar. Seven administration and supplier
screens render `AdminShell`, which is a title bar carrying the signed-in name and no links at all.
Every remaining screen renders no header: cart, checkout, payment, account, order confirmation, the
four catalogue screens, sign-on welcome, the account-creation error, About and the 404. Once a
shopper leaves `/`, nothing links back to it, and no catalogue screen links to the cart — the
browser's Back button is the only way out.

**Look and feel.** `src/pages/index.tsx` and `src/pages/about.tsx` still wear the generated
template's dark theme, written in raw Tailwind palette classes (`bg-gray-900`, `text-white`,
`text-gray-400`, `bg-indigo-500`, `ring-white/10`, `text-blue-600`). Every other screen uses the
OKLCH design tokens recorded in the design system. Main content sits in six different column
widths — `max-w-[672px]` on nine screens, `max-w-[52rem]` in `AdminShell`, `max-w-[1160px]` on
`/enter-order-information`, `max-w-4xl` on `/about`, `max-w-2xl` on `/`, and `max-w-md` on the
sign-on cards — so the page jumps sideways as a shopper moves through a purchase.

**Admin access.** Nothing in the customer-facing store links to `/admin`. An administrator types
the URL.

## What Changes

- A new `StoreHeader` component renders in the same position on every routable screen except the
  four bare sign-on cards (`/signon`, `/signon-failed`, `/admin/signon`, `/admin/signon-failed`).
- The header carries the store mark linking home, a **Catalog** link to `/catalog`, and a **Cart**
  link to `/cart` showing the cart's line count, with no number when the cart is empty.
- Signed out, the header offers **Sign in** and nothing else. Signed in, it shows the username,
  **My account** and **Sign out**; signing out ends the session and returns to `/`.
- A signed-in administrator additionally sees an **Admin** link to `/admin`, on every screen
  including the home page. Nobody without the role sees it.
- Until the session read resolves, the header shows neither Sign in nor a username nor Admin, so
  nobody briefly sees the wrong one.
- `GET /api/signon/session` gains a `role` field, so the header can decide the Admin link without
  calling `GET /api/signon/check`, which writes the post-sign-on return address as a side effect.
- `AdminShell` is reduced to `StoreHeader` in its administration variant plus the administration
  label and the existing back-link; its seven callers stop fetching the session themselves.
- `src/pages/index.tsx` and `src/pages/about.tsx` move onto the design tokens and drop every raw
  Tailwind palette class; the home page's bespoke navigation bar and its `@headlessui/react`
  mobile `Dialog` are replaced by the shared header.
- Every screen's main content moves to one shared column width, replacing the six in use today.
  `/enter-order-information`'s three-column form re-flows to two columns with a full-width order
  summary so the narrower column does not squeeze it.

Explicitly out of scope:

- **A new visual identity.** The token-based screens are the target; home and About move onto them.
  No new palette, typeface or brand work.
- **The four sign-on screens.** They deliberately render a bare centred card with no shell.
- **The root error boundary.** A header that fetches session state inside an error boundary can
  fail while reporting a failure.
- **A dark-mode toggle.** Dark tokens exist but nothing sets `.dark` on `<html>`; that stays true.
- **A footer, breadcrumbs, or a header search box.** The catalogue keeps its own search form and
  `/order-completed` keeps its checkout breadcrumb.
- **Restructuring routing into nested layouts.** The header is a component each screen renders, as
  `AdminShell` already is.
- **Redesigning administration or supplier screen content** — only their header and column width
  are in scope. The spec-mandated sign-out control on the two home screens stays where it is.
- **Role management.** Who is an administrator is decided as it is today, in `auth/user.ts`.

## Impact

Affected capabilities:

- **`application-foundation`** — the application shell. Two requirements are modified (the
  product-branded shell's third-party-asset scenario names the mobile navigation panel that is
  being removed; shell navigation generalises from the home page to every screen). Four are added:
  the persistent header, its identity states, the single content column width, and store-wide
  conformance to the design tokens.
- **`user-authentication`** — one requirement added: the session endpoint reports the signed-on
  identity's administrative role, and reading it never becomes a post-sign-on return address.

Affected code:

- `src/components/StoreHeader.tsx` (new) + `src/components/StoreHeader.test.tsx` (new)
- `src/components/layout.ts` (new) — the one shared content-width class
- `src/components/index.ts` — exports
- `src/components/AdminShell.tsx` + test — reduced to `StoreHeader` plus label and back-link
- `src/components/RequireSignOn.tsx`, `src/components/RequireAdmin.tsx` — their `max-w-[672px]`
  pending and refusal states follow the shared width
- `routes/api/signon/session.get.ts` + test — the `role` field
- `src/pages/index.tsx`, `src/pages/about.tsx` — tokens, shared width, shared header
- Header added to `cart.tsx`, `customer.tsx`, `payment.tsx`, `enter-order-information.tsx`,
  `order-completed.tsx`, `signon-welcome.tsx`, `user-creation-error.tsx`, `NotFound.tsx`,
  `catalog/index.tsx`, `catalog/category/[categoryId].tsx`, `catalog/product/[productId].tsx`,
  `catalog/item/[itemId].tsx`, and their page tests
- The seven `AdminShell` callers under `src/pages/admin/` and `src/pages/supplier/`
- `e2e/home.spec.ts` — the mobile-nav `Dialog` specification no longer describes the page

Risks this change accepts:

- **Hiding the Admin link is not access control.** It is a convenience. `/admin` stays protected by
  `middleware/signon.ts` + `auth/signon-filter.ts` server-side and by `RequireAdmin` in the browser.
- **A header on every screen adds two fetches per screen** (session and cart). There is no layout
  route to hoist them into, and introducing one is out of scope, so each screen pays them.
- **The blast radius is wide and shallow** — roughly 20 files plus their tests — so this change
  collides with anything else editing a page file in the same sprint.
- **The home page becomes quieter.** Moving the store's front door onto the neutral tokens is the
  point of the change, but it is a visible change to the first screen anyone sees.
