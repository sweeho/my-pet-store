# PLAN — SWHM-T-0059: flaky `customer-profile.spec.ts` save-then-render timing

Change: `swhm-s-0006-multi-language-support`
Read `openspec/changes/swhm-s-0006-multi-language-support/design.md` FIRST — it carries the
measured context and every decision this plan rests on.

## Design reference

The source idea carries no design blocks, so there is nothing exported under
`artifacts/SWHM-S-0006/design/`. The screens this ticket touches keep their existing layout; the
only visual addition is the pending indicator, whose pattern is `DESIGN.md` § Loading states.

## Objective

`/customer` renders nothing at all until two serial client-side reads resolve, so a visitor sees a
blank page of unbounded duration and the browser test has no signal to wait on but a blind 5000ms
budget on the final content. Give the guard and the screen an accessible pending state, and anchor
the test's wait on the settled screen.

## Steps

1. **`src/components/RequireSignOn.tsx`** — replace the `if (!allowed) return null` branch with a
   `role="status"` element naming what is loading. The denial path still calls
   `navigate(result.redirectTo)` and still never renders children. See design.md § D2, § D3.
2. **`src/pages/customer.tsx`** — replace the `if (!account) return null` branch with the page shell
   (`<h1>Customer Profile</h1>`) plus a `role="status"` element, inside the same
   `mx-auto max-w-[672px] p-6` container the loaded view uses. See design.md § D4.
3. **`e2e/customer-profile.spec.ts`** — after the final `page.goto("/customer")`, wait for the
   contact-information region to be present with an explicit generous budget, then assert the first
   name and the `lang` attribute on the default budget. Do not raise the budget on the content
   assertions themselves. See design.md § D1.
4. **`src/components/RequireSignOn.test.tsx`** (new) — cover pending, allowed and denied. Mirror
   `src/pages/signon.test.tsx`'s `vi.stubGlobal("fetch", …)` shape; the component uses
   `useNavigate`/`useLocation`, so it needs a router wrapper, unlike the page tests.
5. **`src/pages/customer.test.tsx`** — add the pending-then-content case. Its existing
   no-account-yet assertion must keep passing unchanged (SWHM-T-0059 AC-3 in the defect report).

## File / module ownership

May create or modify, and nothing else:

- `src/components/RequireSignOn.tsx`
- `src/components/RequireSignOn.test.tsx` (new)
- `src/pages/customer.tsx`
- `src/pages/customer.test.tsx`
- `e2e/customer-profile.spec.ts`

Explicitly NOT owned by this ticket: any route handler under `routes/`, `db/schema.ts` and
`drizzle/`, `src/pages/catalog/**` (proposal § F1), `src/pages/signon-welcome.tsx` — that screen
inherits the guard's new pending state and needs no edit of its own — and the root documents, which
are the planning ticket's.

No other ticket is committed to this sprint, so there is no ownership overlap and no `depends_on`.

## Fixed interface contracts

- `RequireSignOn`'s props and its `AccessCheckResult` shape do not change, and neither does the
  `/api/signon/check?resource=` query it issues. `auth/signon-filter.ts` is the single access
  decision (ARCHITECTURE.md § Cross-cutting constraints) and is not touched.
- `CustomerAccount` / `AccountUpdate` (`account/types.ts`) and both `/api/customer` handlers are
  unchanged. This is a render-timing fix, not a data-shape one.
- The pending indicator is identified by the `status` role. Tests locate it by role, never by class
  name or DOM shape.

## Definition of Done

- AC-1 through AC-5 on the ticket are met.
- `src/pages/customer.test.tsx`'s existing no-account-yet case still passes without modification.
- The browser tier is observed in CI, not in this container — `bun run test:e2e` fails its Chromium
  preflight here by design (`.vortex/agents-generated.md`). Run the browser-free core gate, say so,
  and let CI report the E2E verdict.
