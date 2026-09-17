# Design — swhm-i-0014-consistent-look-and-site-nav

Sprint SWHM-S-0021. Idea SWHM-I-0014, "Consistent look and site navigation across every screen".

## Codebase findings

Measured on the sprint branch (`vortex/sprint/swhm-s-0021-5e503761`, at `0a77532`), not taken from
the idea text.

- **F1 — There is no `StoreHeader` today, and no in-flight change that creates one.**
  `openspec/changes/` holds only `archive/`. `src/components/` holds `StoreMark.tsx` (the inline
  SVG and wordmark), `AdminShell.tsx`, `LanguageSwitcher.tsx`, `ReportBars.tsx`,
  `RequireAdmin.tsx`, `RequireSignOn.tsx`. The idea's phrase "the `StoreHeader` being introduced
  for the catalog screens" describes work that has not landed, so **this change creates the
  component**, not merely spreads it.

- **F2 — There is no layout route.** `src/main.tsx` renders `useRoutes(routes)` over
  `~react-pages` directly; `vite-plugin-pages` is configured without a layout. A header therefore
  has to be a component each screen renders, which is already the pattern `AdminShell` uses.

- **F3 — Seven screens render `AdminShell`**: `admin/index`, `admin/orders`,
  `admin/orders-approval`, `admin/reports/orders`, `admin/reports/revenue`, `supplier/index`,
  `supplier/inventory`. The idea says eight; the eighth screen carrying a title bar is
  `admin/signon-failed.tsx`, which renders its own inline bar deliberately (its file comment says
  so) and is one of the four bare sign-on cards the idea puts out of scope. See A1.

- **F4 — All seven `AdminShell` callers fetch `GET /api/signon/session` themselves**, in an
  identical `useEffect`, solely to pass `username` into the shell. Once the header reads the
  session, those seven effects are dead code.

- **F5 — `GET /api/signon/session` does not report the role.** It returns `j_signon`,
  `j_signon_username`, `original_url` and nothing else. `findUserRole()` (`auth/user.ts`) exists and
  is already called by `middleware/signon.ts` and `routes/api/signon/check.get.ts`.

- **F6 — `GET /api/signon/check` writes the post-sign-on return address.** On a `not-signed-on`
  verdict `routes/api/signon/check.get.ts` calls `setOriginalUrl(session, resource)`
  unconditionally — it does not consult `isNavigationRequest()`, which `middleware/signon.ts` does.
  A header that probed `check?resource=/admin` to decide the Admin link would therefore rewrite
  every signed-out visitor's `original_url` to `/admin` on every page load. That is the mechanism
  behind the idea's "a shopper sent to /signon from the cart still returns to the cart" criterion
  and behind the standing requirement _Redirect to originally-requested resource after
  authentication_.

- **F7 — The cart already reports its line count.** `GET /api/cart` is public (no sign-on check)
  and returns `Cart { items, count, subtotal }`; `count` is the number of distinct lines
  (`cart/types.ts`).

- **F8 — Six content widths are in use**: `max-w-[672px]` (cart, the four catalogue screens,
  customer, order-completed, payment, and the two route guards' pending states), `max-w-[52rem]`
  (`AdminShell`), `max-w-[1160px]` (`enter-order-information`), `max-w-4xl` (about), `max-w-2xl`
  (the home hero), `max-w-md` (the four sign-on cards, out of scope).

- **F9 — `/enter-order-information` lays its form out as `lg:grid-cols-[1fr_1fr_340px]`.** At a
  832px container that leaves ~222px for each address column, which is too narrow for its labelled
  inputs. Narrowing the screen therefore requires re-flowing the grid; it is not a one-line change.

- **F10 — The home page's mobile navigation is a `@headlessui/react` `Dialog`**, and it is the only
  consumer of `@heroicons/react` in the application (`Bars3Icon`, `XMarkIcon`).
  `e2e/home.spec.ts` has a dedicated "opens and closes the mobile nav from the hamburger button"
  test, and `src/pages/index.test.tsx` exercises the same panel. Both describe a page that will no
  longer exist. `LanguageSwitcher` still uses `@headlessui/react` (`Menu`), so that dependency
  stays; `@heroicons/react` loses its last consumer and is left installed but unused — removing it
  is a separate decision, not part of this change.

- **F11 — `openspec/specs/application-foundation/spec.md` already specifies the shell.** Two of its
  requirements describe the home page's bespoke header by name: _Product-branded application shell_
  (its third-party-asset scenario says "opens the mobile navigation panel") and _Application shell
  navigation_ (its sign-in scenario says "whether from the header or from the mobile navigation
  panel"). Both become false when the panel goes, so both must be MODIFIED rather than left alone.

- **F12 — `openspec/specs/admin-operations/spec.md` requires a logout control on the administration
  home page** (_Administrator home page with rich client launch and logout options_).
  `admin/index.tsx` and `supplier/index.tsx` render one. The header's Sign out does not replace it.

- **F13 — `NotFound.tsx` and `RootErrorBoundary.tsx` are themselves routable.** `vite-plugin-pages`
  excludes only `*.test.tsx` and `UnavailableInLanguage.tsx`, so `/NotFound` and
  `/RootErrorBoundary` are reachable paths in addition to the catch-all. Out of scope here; see O2.

- **F14 — `src/theme-tokens.test.ts` is the precedent for a repository-level conformance test**: a
  plain Vitest file that asserts a property of the codebase rather than of a component.

## Decisions

- **D1 — The header is a component each screen renders, not a layout route.** F2 makes a layout
  route a routing change, and the idea puts that out of scope. `AdminShell` already establishes the
  per-screen shell pattern and its seven callers prove it scales.

- **D2 — The header learns who the visitor is from `GET /api/signon/session`, extended with
  `role` — never from `GET /api/signon/check`.** F6 is the reason: `check` has a write side effect
  that would silently redirect every shopper to `/admin` after signing in. `session` reads the
  session row and writes nothing. The role is returned as the stored string, and the header compares
  it against `ADMIN_ROLE` from `auth/protected-resources.ts` (a dependency-free module), so
  "administrator" is spelled in one place.

- **D3 — Returning the role to its own owner is acceptable.** It is a marker on the caller's own
  identity record, it is already the basis of a 403 the same caller can observe, and the alternative
  — a derived `is_admin` boolean — hides which role was meant while protecting nothing.

- **D4 — Hiding the Admin link is a convenience, not access control.** `/admin` stays protected by
  `middleware/signon.ts` server-side and `RequireAdmin` in the browser. Nothing about the header may
  be relied on as a guard, and the header is not a place to add one.

- **D5 — The unresolved state renders no identity controls and no live region.** Until the session
  read answers, the header shows neither Sign in, nor a username, nor Admin — that is the idea's
  own criterion, and it is what stops a visitor seeing the wrong one for a frame. It does _not_
  announce itself with `role="status"`: the header is persistent chrome on every screen, so a live
  region there would announce on every navigation, and the screen's own content is not gated on the
  read. This retires `AdminShell`'s current "Signing in…" status element. The standing requirement
  _Observable pending state on data-gated screens_ is unaffected — it governs the route guards
  (`RequireSignOn`, `RequireAdmin`) and the screens beneath them, both of which keep their
  `role="status"` indicators.

- **D6 — One shared content width, `max-w-[52rem]` (832px), exported as a single constant.**
  `52rem` is chosen over `672px` because the administration tables and the checkout form need the
  room, and over `1160px` because a list of catalogue links reads badly at that width. It is
  exported from `src/components/layout.ts` as a class string rather than duplicated per screen, so
  a future change to it is one edit. The four sign-on cards keep `max-w-md` (out of scope).

- **D7 — `/enter-order-information` re-flows to `lg:grid-cols-2` with the order summary spanning
  both columns.** F9: the existing three-column grid does not fit the shared width. This is a
  consequence of D6, not a redesign of checkout — the fields, their order and their validation are
  untouched.

- **D8 — `AdminShell` keeps its `backTo`/`backLabel`/`children` props and loses `username`.** It
  becomes `StoreHeader` in its administration variant plus the administration label, the back-link
  and the content frame. Its seven callers drop the prop and the now-dead session effect (F4). The
  spec-mandated page-level sign-out controls stay (F12).

- **D9 — The catalogue language switcher moves into the header through a slot, not into the header
  component.** `StoreHeader` takes `children` and renders them at the end of its control row; the
  four catalogue screens pass their existing `<LanguageSwitcher …>` into it. Locale stays resolved
  in exactly one place, `useCatalogLocale()` in `src/pages/catalog/shared.ts`, which is the standing
  cross-cutting constraint; a header that resolved locale itself would be a second resolution site.

- **D10 — Two fetches per screen are accepted.** Every screen mounting the header issues
  `GET /api/signon/session` and `GET /api/cart`. With no layout route (D1) there is nowhere to hoist
  them, and a module-level cache would be per-visit state held in the process, which the standing
  constraint forbids for session state. Recorded as a cost, with a follow-up rather than a
  workaround.

- **D11 — Conformance is enforced by two repository-level Vitest files, following F14.** One scans
  `src/pages/**/*.tsx` for a page-level container `max-w-*` that is not the shared constant
  (exempting the four sign-on cards); one scans `src/pages/index.tsx` and `src/pages/about.tsx` for
  raw Tailwind palette classes. Both state a property of the codebase that no component test and no
  browser assertion can observe, and both fail loudly when a later screen reintroduces a one-off.

### Promoted to ARCHITECTURE.md § Key Decisions

D2 and D4 bind work beyond this change — every future screen reads identity the same way, and every
future privileged link is a convenience over a server-side guard. D6 binds every future screen's
container. The three are recorded there, citing this change by id.

## Phases

1. **Header and session contract.** `StoreHeader` + its test, `src/components/layout.ts`, the
   `role` field on `GET /api/signon/session` + its route test. Nothing else can start until the
   component and the response shape exist.
2. **Customer-facing screens.** Header onto the twelve customer-facing screens, home and About onto
   the tokens, the shared width everywhere, the checkout re-flow (D7).
3. **Administration and supplier screens.** `AdminShell` reduced (D8), the seven callers updated,
   the two route guards' widths.
4. **Test harness.** Runs inside phases 1–3, never as its own ticket. Each phase extends the tiers
   that already exist: component tests beside `src/components/StoreHeader.tsx` following
   `AdminShell.test.tsx`; page tests updated in place for every screen that gains a header; the
   route test for `session.get.ts` in `routes/`, which is where Vitest's `server` project picks it
   up; the two conformance files from D11 beside `src/theme-tokens.test.ts`. In the browser tier,
   `e2e/home.spec.ts`'s mobile-nav specification is replaced by header assertions (F10), and a
   narrow-viewport assertion covers the header's mobile behaviour — a real browser is the only tier
   that observes CSS-driven overlap.
5. **CI.** No workflow change is required: the existing workflows already trigger on pushes and pull
   requests to `vortex/**` branches, and the tiers above run inside them. The phase exists so that
   is verified rather than assumed — if the trigger does not cover the sprint and ticket branches,
   the ticket that finds it fixes it in place.

## Decomposition

One EPIC, one STORY, three TASKs, matching phases 1–3. Ownership maps do not intersect, so T2 and
T3 run in parallel once T1 lands.

| Ticket | Phase | Owns                                                                                                                                                                                                                                                                                       | Depends on |
| ------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| T1     | 1     | `src/components/StoreHeader.tsx`(+test), `src/components/layout.ts`, `src/components/index.ts`, `routes/api/signon/session.get.ts`(+test)                                                                                                                                                  | —          |
| T2     | 2     | `src/pages/index.tsx`, `about.tsx`, `cart.tsx`, `customer.tsx`, `payment.tsx`, `enter-order-information.tsx`, `order-completed.tsx`, `signon-welcome.tsx`, `user-creation-error.tsx`, `NotFound.tsx`, `catalog/**` (4 screens), their tests, `e2e/home.spec.ts`, the two conformance tests | T1         |
| T3     | 3     | `src/components/AdminShell.tsx`(+test), `RequireSignOn.tsx`, `RequireAdmin.tsx`(+tests), the seven `admin/**` and `supplier/**` screens and their tests                                                                                                                                    | T1         |

T1 owns `src/components/index.ts` outright; T3 does not re-export anything new, so the two never
edit it together.

### Fixed interface contracts

Set by T1, consumed by T2 and T3, and not changed by either:

```ts
// src/components/StoreHeader.tsx
export type StoreHeaderProps = {
  /** "store" (default) on customer-facing screens; "admin" adds the administration label. */
  variant?: "store" | "admin";
  /** Trailing slot in the control row — the catalogue screens pass their LanguageSwitcher. */
  children?: ReactNode;
};
export function StoreHeader(props: StoreHeaderProps): ReactElement;

// src/components/layout.ts
export const CONTENT_WIDTH = "max-w-[52rem]";

// GET /api/signon/session response
type SessionResponse = {
  j_signon: boolean;
  j_signon_username: string | null;
  original_url: string | null;
  role: string | null; // added by this change
};
```

## Assumptions

- **A1 — "The 8 admin and supplier screens" means the seven that render `AdminShell`.** F3: the
  eighth title bar belongs to `admin/signon-failed`, which the idea's own non-scope list puts out of
  scope. Taken as a counting discrepancy in the idea, not an instruction to shell a sign-on card.
- **A2 — `/user-creation-error` gets the header.** It is not one of the four screens the non-scope
  section names, and the idea's own impact list includes it.
- **A3 — The shared width is `52rem`.** The idea requires one width and does not name it; D6 gives
  the reasoning. A mockup naming a different figure overrides this — change the constant, not the
  screens.

## Open questions

- **O1 — The design mockups were not read.** `a2a_get_idea_design` and `a2a_get_idea_canvas` both
  refused for this run (see § Blocker), and the canvas renderer answered 403. Every visual decision
  here — the shared width, the header's control order, its narrow-viewport behaviour — is derived
  from the codebase and the idea text alone and should be checked against the mockup before
  implementation. There is consequently no `artifacts/SWHM-S-0021/design/` export.
- **O2 — `/NotFound` and `/RootErrorBoundary` are routable screens** (F13). `/RootErrorBoundary`
  renders a bare "An error occurred" page to anyone who types the path. Out of scope; worth a
  defect.
- **O3 — Two fetches per screen** (D10). A shared session/cart read is worth revisiting if a layout
  route is ever introduced.

## Blocker

This change was authored without the platform's ticket tools. Every project-scoped `vortex_a2a`
tool — `a2a_get_ticket`, `a2a_get_idea_canvas`, `a2a_get_idea_design`, `a2a_create_fsm_ticket`,
`a2a_sprint_plan_checklist`, `a2a_comment_ticket`, `a2a_transition_ticket` — refuses with
`requires a codebase context`, because this run's A2A binding carries no `VORTEX_A2A_CODEBASE_ID`.
Only unscoped tools (for example `a2a_list_agent_availability`) answer.

Two planning deliverables therefore do not exist yet and cannot be produced from this container:

- the EPIC / STORY / TASK tickets, and with them the ticket keys that `tasks.md` checkboxes must
  carry and the `artifacts/SWHM-S-0021/<TICKET-KEY>/PLAN.md` paths;
- the design export under `artifacts/SWHM-S-0021/design/` (O1).

The decomposition above is complete and ready to be created as-is once the binding is fixed.
