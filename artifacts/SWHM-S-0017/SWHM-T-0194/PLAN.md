# PLAN — SWHM-T-0194

**Task group:** `## 9. Supplier Home Page` (checkboxes 9.1–9.5)
**Change:** `swhm-i-0010-order-fulfillment-shipping`
**Capability:** `fulfillment-management`
**Requirement:** Supplier home page displays navigation and module information (ADDED)

## Objective

The screen at `/supplier`: what this module does, a control into the inventory screen, and a way to sign out. **Read `design.md` first**, from `## Codebase findings` down — S8 (no JSP) and S10 (the whole subtree requires the administrator role, so there is no second variant of this page to navigate differently).

## Design reference

`artifacts/SWHM-S-0017/design/` — `mockup-supplier-home.html` is the authority; `wireframe-supplier-home.html` names the route. Build what the mockup shows: the heading **Supplier**, the lede describing what the module does, a "What this module does" card with its five statements, an "Inventory" card whose text ends "Administrators only." with a **Display Inventory** control beside it, and a **Logout** control below. The mockup's colours and type come from tokens this application already defines in `src/index.css`; take them from there, not from the mockup's inline `:root` block.

## Steps

1. **Create `src/pages/supplier/index.tsx`.** Creating the file is the whole registration step (`ARCHITECTURE.md § Routing`).
2. **Mirror `src/pages/admin/index.tsx`**, which is the same screen shape one capability over: a default export wrapping the content component in `RequireAdmin`, the content component rendering inside `AdminShell` with the signed-on username fetched from `/api/signon/session`. Reuse both components; do not write a second shell (F7).
3. **Render the five "What this module does" statements from the mockup**, which describe the pass SWHM-T-0192 built. Keep them accurate to what ships — an item in that list the product does not do is a claim, not copy.
4. **Display Inventory navigates to `/supplier/inventory`.** The screen it reaches is SWHM-T-0195's and may not exist yet when this ticket is worked; the control is still correct, and the route guard already refuses an unknown path with the not-found screen.
5. **Logout posts to `POST /api/signon/logout` and then navigates away**, exactly as the administration home does. No new session mechanism (S10).
6. **Write `src/pages/supplier/index.test.tsx`** — a `client` project test (it lives under `src/`). Locate the two controls by role and name, and assert the heading and the description.

## Fixed interface contracts

None owned by this ticket. It consumes `GET /api/signon/session`, `POST /api/signon/logout`, `AdminShell` and `RequireAdmin`, all unchanged.

## File / module ownership

Create or modify only:

- `src/pages/supplier/index.tsx` (new)
- `src/pages/supplier/index.test.tsx` (new)

Do not modify `src/components/`, `src/pages/admin/`, `auth/protected-resources.ts` (SWHM-T-0193 already registered `/supplier`), or `src/index.css`.

## Definition of Done

- AC-1 … AC-3 hold, each evidenced by the assertion that carries it.
- The screen's controls are reachable by their accessible names, which is how both this ticket's test and the browser journey (SWHM-T-0196) locate them.
- No new shared component and no new design token.
