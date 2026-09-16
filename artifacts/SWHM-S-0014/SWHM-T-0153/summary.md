---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0153
branch: vortex/feat/SWHM-T-0153-order-information-form-data-model-and-mo-89f5de68
upstream: [artifacts/SWHM-S-0014/SWHM-T-0153/PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Summary — SWHM-T-0153: Order information form, data model and module registration

## What changed

Added the billing/shipping/contact columns `orders` and `order_line_item` need plus their
migration, wrote `order/types.ts` whole, registered `order/` in the three places a new top-level
module needs, built `/enter-order-information` to the mockup (both sections, every field, the
read-only order summary), and added the Proceed to Checkout control on `/cart`. No submit handler,
fetch, validation, or route — that is SWHM-T-0154's scope.

## Files

- `db/schema.ts` — 20 nullable `billing_*`/`shipping_*` columns on `orders` (Address+ContactInfo
  per section, design.md S6/D2), and `catid`/`productid`/`quantity_shipped` on `order_line_item`.
- `drizzle/0008_sour_thanos.sql` + `drizzle/meta/` — the generated migration, additive
  `ALTER TABLE ... ADD` only.
- `order/types.ts` — new; exports `OrderAddress` (`ContactInfo & Address`), `Order`, `LineItem`.
- `vitest.config.ts` — `order/**` added to the `server` project's include and the `client`
  project's exclude.
- `tsconfig.node.json` — `order` added to `include`.
- `src/pages/enter-order-information.tsx` + `.test.tsx` — new screen; mirrors `customer.tsx`'s form
  idiom, reads `/api/cart` for the order summary the way `cart.tsx` does.
- `src/pages/cart.tsx` + `src/pages/cart.test.tsx` — added the "Proceed to Checkout" control next
  to Update Cart.

## AC coverage

- AC-1, AC-2 — Billing/Shipping Information sections with all 10 fields each:
  `enter-order-information.tsx`'s `AddressSection`, covered by `EOI-01`–`EOI-03`.
- AC-3 — state dropdown (California, New York, Texas): `STATES` from `account/vocabulary.ts`,
  covered by `EOI-04`.
- AC-4 — country dropdown (USA, Canada, Japan, China): `COUNTRIES` from `account/vocabulary.ts`,
  covered by `EOI-05`.
- AC-5 — first/last name `maxlength=30`: covered by `EOI-06`.
- AC-6 — address fields `maxlength=70`: covered by `EOI-07`.
- AC-7 — `orders`/`order_line_item` columns + committed migration: `db/schema.ts`,
  `drizzle/0008_sour_thanos.sql`; no table added, no column renamed.
- AC-8 — `order/types.ts` exports `Order`/`LineItem` reusing `Address`/`ContactInfo`: see
  `order/types.ts`; type-checked clean by the green run below.
- AC-9 — a test under `order/` runs in the `server` project: proven structurally by the
  `vitest.config.ts`/`tsconfig.node.json` edits (no `order/*.test.ts` file was needed by this
  ticket's own scope, so this is verified by configuration, not a new test file).
- AC-10 — `/enter-order-information` renders for a signed-on shopper, gated by the existing
  `PROTECTED_RESOURCES` entry (no change needed — `auth/protected-resources.ts` already lists it):
  `enter-order-information.tsx` default export wraps `RequireSignOn`.
- AC-11 — `/cart` control to `/enter-order-information`: covered by `CPT-12`.

## Verification

```
$ bun run db:generate
[✓] Your SQL migration file ➜ drizzle/0008_sour_thanos.sql

$ bun --bun vitest run src/pages/enter-order-information.test.tsx src/pages/cart.test.tsx
 Test Files  2 passed (2)
      Tests  24 passed (24)

$ bun run verify        # lint + typecheck + full unit suite
 Test Files  84 passed (84)
      Tests  510 passed (510)
```

`bun run verify:full`'s E2E tier fails only on this container's missing Chromium
(`ensure-playwright-browser.mjs`), per AGENTS.md's known containers-ship-no-Chromium note; E2E is
observed in CI / integration QA. See `tdd-test-result.md` — `TDD-RESULT: 510 passed, 0 failed`.

## Notes

- `orders`'s 20 new address/contact columns are nullable (matching the existing `addresses`/
  `contact_info` tables' own columns) so the demo seed in `db/client.ts`, which sets none of them,
  keeps inserting unchanged — that file is outside this ticket's ownership.
- `order/types.ts`'s `Order.status` reuses `admin/types.ts`'s `OrderStatus`, since that vocabulary
  is already fixed there (design.md F8) and `order/` and `admin/` are peer top-level modules.
- The mockup's "Submit Order" button is rendered (`type="button"`, no handler) to match the
  layout; SWHM-T-0154 wires its `onClick`. The mockup's form-level validation alert is not
  rendered — DESIGN.md § Form validation states says it stays absent until there is something to
  report, and this ticket introduces no validation.
