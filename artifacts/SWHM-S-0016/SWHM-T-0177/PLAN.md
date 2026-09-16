# PLAN — SWHM-T-0177

**Task group:** `## 3. Authorization` (checkboxes 3.1, 3.2, 3.3)
**Change:** `swhm-i-0009-payment-credit-card-processi`
**Capability:** `payment-processing`
**Requirement:** Payment authorization (ADDED)
**Depends on:** SWHM-T-0176 — the validation functions are complete before this ticket starts

## Objective

Add the processor boundary, the route that authorizes a card, and the payment screen the mockups show, then place the order only once authorization succeeds. This is the largest ticket in the sprint and the only one that changes an existing capability's files, so its ownership map is narrow on purpose. Read `design.md` first: `§ Decisions` D5 fixes the boundary's shape and D6 fixes the sequencing, and neither is re-decided here.

## Design reference

`artifacts/SWHM-S-0016/design/` — see `MANIFEST.md`. **Build from `mockup-checkout-payment-details.html` and `mockup-checkout-payment-details-validation-and.html`**, not the wireframes. The second fixes the three states this ticket must render:

- **State A** — validation refused the card. A form-level alert, a per-field message against each offending control, and **nothing sent to the processor**.
- **State B** — the authorization request is in flight. The submit control is disabled and reads "Authorizing…", with a status line naming what is happening.
- **State C** — the processor declined. "No order was placed and the card was not charged."

Two things the mockups show are deliberately not built: the "Encrypted at rest" pill (nothing is encrypted — `design.md` S2) and a persisted cardholder name (transient only — S3). The mockups' card-type options are Visa, MasterCard and American Express; use this store's `CARD_TYPES` (S4). The mockups show separate month and year controls; compose `MM/YYYY` from them rather than changing the stored shape (S9).

## Steps

1. **Read `design.md` first**, in full, then the two mockups.
2. **Write `payment/processor.ts`** — an interface plus a deterministic stub as the default implementation, injectable so a test can supply an approving or declining one (`design.md § Decisions` D5). There is no live gateway and none is integrated; the scenario observes that a request was **sent**, not that money moved (S6, S10).
3. **Write `payment/authorize.ts`** — validate through SWHM-T-0176's functions first, and only then call the processor. A validation failure must not reach the processor: that is the difference between State A and State C, and it is observable.
4. **Add `POST /api/payment/authorize`** under `routes/api/payment/`, answering 401 when not signed on and a refusal shape the screen can render per field, mirroring how `routes/api/order/index.post.ts` already answers a field-level refusal.
5. **Add the two protected-resource entries** for `/payment` and `/api/payment` (`design.md § Codebase findings` F8). A new protected path is a configuration entry, never a new check.
6. **Build `src/pages/payment.tsx`** from the mockups. The per-field invalid state and the form-level alert are the standing patterns in `DESIGN.md § Form validation states` — use them rather than inventing a second presentation. The in-flight state is `DESIGN.md § Pending actions`, added for this screen; follow it exactly.
7. **Re-point the order form's submit** at the payment step (`design.md § Decisions` D6). `src/pages/enter-order-information.tsx` currently posts to `/api/order` directly; it now carries its validated form data to `/payment`, which authorizes and then posts to `/api/order` unchanged.
8. **Keep `e2e/order.spec.ts` green.** The existing order journey runs through the form to the confirmation screen; after step 7 it must pass through the payment step. Update that journey — it is in this ticket's ownership map precisely so the browser tier is never red at this ticket's merge.

## File / module ownership

Create or modify only:

- `payment/processor.ts` + `payment/processor.test.ts` (new)
- `payment/authorize.ts` + `payment/authorize.test.ts` (new)
- `routes/api/payment/authorize.post.ts` + `routes/api/payment/authorize.post.test.ts` (new)
- `src/pages/payment.tsx` + `src/pages/payment.test.tsx` (new)
- `auth/protected-resources.ts` — the `/payment` and `/api/payment` entries
- `src/pages/enter-order-information.tsx` + `src/pages/enter-order-information.test.tsx` — the submit path only
- `e2e/order.spec.ts` — the existing journey, routed through the payment step

Do not modify `order/order.ts`, `order/validation.ts`, `routes/api/order/index.post.ts` or `src/pages/order-completed.tsx`. `POST /api/order` and its `{ orderId, email }` response are fixed interface contracts settled in change `swhm-i-0008-order-submission-checkout`; the payment step calls that route unchanged and the confirmation screen is untouched. `e2e/payment.spec.ts` belongs to SWHM-T-0178.

## Definition of Done

- AC-1 holds, evidenced by the assertion that carries it — an authorization request reaches the processor boundary for a valid card.
- A card refused by validation never reaches the processor, and a declined authorization leaves no order.
- The order journey in `e2e/order.spec.ts` still reaches the confirmation screen with its order id and email, now through the payment step.
- `POST /api/order` is called with the same request shape as before this ticket.
