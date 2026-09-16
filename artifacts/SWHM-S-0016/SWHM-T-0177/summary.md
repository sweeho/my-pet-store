---
ticket: SWHM-T-0177
sprint: SWHM-S-0016
type: task
---

# Summary — SWHM-T-0177

## What changed

Added the payment authorization boundary (an interface + a deterministic stub, no live
gateway — design.md D5), the route that authorizes a card, and the `/payment` screen built
from the two mockups' three states. Re-pointed the order form's submit at the payment step
and moved `POST /api/order` so it is only ever called after authorization approves the card
(design.md D6) — a validation failure or a decline now leaves no order.

## Files touched

- `payment/processor.ts` + `.test.ts` (new) — `PaymentProcessor` interface, `stubProcessor`
  (approves everything except last-four `0002`, a documented decline sentinel).
- `payment/authorize.ts` + `.test.ts` (new) — `authorizeCard`: checks card type
  (`payment/validation.ts`) and expiry (`payment/expiry.ts`) from SWHM-T-0176, then a
  required-card-number check this ticket adds (the mockup's State A shows it), and only
  then calls the processor. Returns one field + one form-level alert per refusal, matching
  the mockup's exact copy.
- `routes/api/payment/authorize.post.ts` + `.test.ts` (new) — 401 signed-out (own check,
  mirroring `routes/api/order/index.post.ts`'s pattern); 400 with `{error, field, alert}`
  for a validation refusal; 200 `{status: "approved"|"declined"}` otherwise — a decline is a
  business outcome, not a request error.
- `auth/protected-resources.ts` + `.test.ts` — added `/payment` and `/api/payment` entries
  (no role). Note: `matchesResource` only prefix-matches an entry that carries
  `requiresRole`, so the `/api/payment` entry exact-matches only that literal path, not the
  nested `/api/payment/authorize`. The route's own explicit session check (above) is what
  actually enforces the 401 for it, mirroring how `/api/order` (which has no registry entry
  at all) already works. Not a gap this ticket introduced; flagged for visibility.
- `src/pages/payment.tsx` + `.test.tsx` (new) — built from
  `mockup-checkout-payment-details.html` (resting layout) and
  `mockup-checkout-payment-details-validation-and.html` (states A/B/C). See "Design" below
  for the one state that needed reconciling against design.md's own description of it.
- `src/pages/enter-order-information.tsx` + `.test.tsx` — submit path only. Validates with
  `order/validation.ts`'s `validateOrderSubmission` (imported, not reimplemented — the same
  precedent as `src/pages/cart.tsx` importing `order/errors.ts`'s `EMPTY_CART_MESSAGE`) and
  navigates to `/payment` with `{billingAddress, shippingAddress}` on success, instead of
  fetching `/api/order` directly. Rewrote EOI-13/14/15 for the new path; removed EOI-16 (an
  empty-cart refusal can no longer happen at this step — it only happens once
  `/api/order` is called, which moved to the payment screen; covered there as PAY-10).
- `e2e/order.spec.ts` — added `fillPaymentAndSubmit`; the happy-path and empty-cart journeys
  now go through it. The bad-email journey is untouched: that refusal is now caught
  client-side before ever leaving the order form, so its assertions still hold unchanged.

Nothing outside this list touched. `order/order.ts`, `order/validation.ts`,
`routes/api/order/index.post.ts` and `src/pages/order-completed.tsx` are all untouched —
`POST /api/order` is called with the same request shape as before.

## Design

Built from the mockups (read via the worktree paths, not the MCP tool), following the plan's
instruction to build the resting layout from `mockup-checkout-payment-details.html` and the
three states from `mockup-checkout-payment-details-validation-and.html`. One genuine
contradiction surfaced between design.md/PLAN.md's own description of "State C" ("the
processor declined... charges nothing") and what that mockup file actually contains: its
State C renders an **expired-card validation refusal** (top alert "Payment was not
authorized: the card expired 03/2024...", per-field error on the expiry selects only), not a
generic gateway decline — no mockup anywhere shows a decline for an otherwise-valid card.
Per the workflow's own rule that the design wins when it contradicts the extracted spec/plan
prose, `authorizeCard`'s expired-card path reproduces that exact copy (`AUTH-07`). A genuine
processor decline (needed for D5's "keeps the decline path testable" and for SWHM-T-0178's
e2e coverage) has no mockup text to draw from, so its alert reuses design.md D6's own words
("No order was placed and the card was not charged.") through the same standing form-level
alert pattern — not an invented design, but a defensible synthesis from Planning's own text
where the artifact is silent. Two other adaptations: the mockup's `<form>` wraps only the
card fields with the actions bar as a sibling; the real page uses one page-spanning `<form>`
(mirroring `enter-order-information.tsx`'s own established shape) so the submit button has
real form semantics. And the mockup's static "X, Y and Z are accepted." hint now formats
this store's own three `CARD_TYPES` (S4) with the same "A, B and C" phrasing rather than the
mockup's literal Visa/MasterCard/American Express.

## AC coverage

- AC-1 (Payment authorization — "authorization request SHALL be sent to payment gateway"):
  covered end to end — `payment/authorize.test.ts` (unit), `routes/api/payment/authorize.
post.test.ts` (integration), `src/pages/payment.test.tsx` PAY-06 (UI, through to the
  deferred `/api/order` call). A validation failure never reaches the processor (`AUTH-04`
  through `AUTH-07`, with a processor that throws if called); a decline leaves no order
  (`PAY-08` — asserts `/api/order` is never fetched).

## Verification

- Each new/changed test file was run individually red-then-green (see
  `tdd-test-result.md`).
- `bun run verify` (lint + typecheck + full unit suite) — 619 passed, 0 failed, exit 0.
- `bun run verify:full` — ran `verify` green, then failed fast at the `test:e2e` Chromium
  preflight (browser not installed in this container, per `AGENTS.md`'s standing note).
  `e2e/order.spec.ts` was updated but could not be executed here; it runs in CI and at
  INTEGRATION_QA.

Full detail: `artifacts/SWHM-S-0016/SWHM-T-0177/tdd-test-result.md`.
