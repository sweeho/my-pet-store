---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0137
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0136/PLAN.md,
  ]
---

# PLAN — SWHM-T-0137: Clear the cart

## Objective

Empty a session's cart in one call, for the two consumers that need it: the order-placement seam (SWHM-T-0140) and logout (SWHM-T-0141).

## Steps

1. Append `clearCart(sessionId)` to `cart/cart.ts`, delegating to `cart/repository.ts`'s `deleteAllCartRows`.
2. No route. Nothing a shopper does empties a whole cart — the screen removes lines one at a time, and the two real callers are server-side. Adding an endpoint would publish a destructive operation with no caller and no scenario behind it.
3. Tests: extend `cart/cart.test.ts` — a cleared cart reads back empty, a second session's cart is untouched, and clearing an already-empty cart does not throw.

## Why this is its own ticket

It is four lines of code. It is separate because SWHM-T-0140 and SWHM-T-0141 both depend on it and can then run in parallel, and because neither of them should be the one to define it — a shared function defined by its first caller acquires that caller's assumptions. The task group split in the adopted change puts it here; this is the sequencing benefit of honouring that.

## Scope boundary

§ Spec discrepancies S8: this ticket implements the clearing. The "after order creation" trigger does not exist — order creation belongs to `swhm-i-0008-order-submission-checkout`. Do not build an order route, an order page or an order-creation function here.

## File/module ownership

Create or modify only: `cart/cart.ts`, `cart/cart.test.ts`.

Nothing else. Do not edit `auth/session.ts` or `routes/api/signon/logout.post.ts` — they are SWHM-T-0141's, and this ticket landing first is what lets that one call `clearCart`.

## Design reference

None applies — no user-visible surface.

## Definition of Done

AC-1 through AC-6 on the ticket. AC-1 is the delta spec's scenario verbatim; AC-2 is the fixed interface contract SWHM-T-0140 and SWHM-T-0141 both code against.
