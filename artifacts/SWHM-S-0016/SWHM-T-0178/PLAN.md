# PLAN — SWHM-T-0178

**Task group:** `## 4. Testing` (checkboxes 4.1, 4.2, 4.3)
**Change:** `swhm-i-0009-payment-credit-card-processi`
**Capability:** `payment-processing`
**Requirements:** Card expiry validation (ADDED), Card type acceptance (ADDED), Payment authorization (ADDED)
**Depends on:** SWHM-T-0177 — the screen, the route and the boundary all exist before this ticket starts

## Objective

Cover the payment journey in the browser — the states no tier below it can observe. The three tickets before this one already cover their own logic at the module and screen tiers; this ticket adds the journey a shopper actually takes, and nothing else. It exists as a separate ticket only because the change's task list fixes one ticket per group (`design.md § Spec discrepancies` S8), not because verification is separable from the work that produces it.

## Design reference

`artifacts/SWHM-S-0016/design/` — see `MANIFEST.md`. `mockup-checkout-payment-details-validation-and.html` is the authority for the three states asserted here: the per-field refusal (State A), the in-flight submit (State B) and the processor decline (State C).

## Steps

1. **Read `design.md` first**, then the states mockup.
2. **Write `e2e/payment.spec.ts`**, mirroring the shape of `e2e/order.spec.ts` — the nearest existing journey spec, and the convention this repository locates elements by: accessible roles and names, never class names or DOM shape.
3. **Assert the approval path**: a signed-on shopper with a populated cart reaches the payment step, submits a card the store accepts with a future expiry, and lands on the confirmation screen with its order id.
4. **Assert the refusal path** (State A): an expired expiry and an unaccepted card type are each reported against the field that caused them, and no order is placed.
5. **Assert the decline path** (State C): the confirmation screen is not reached, the message says no order was placed and the card was not charged, and no order exists afterwards.
6. **Assert the in-flight state** (State B) if it can be observed without a timing race. If it cannot be made deterministic, say so in the work log and leave it to the screen-tier test rather than committing a flaky spec — a spec that fails intermittently costs more than the coverage it adds.
7. **Run the spec before committing it.** A spec that has never been executed is not a test. Chromium may be absent from the container; if the preflight says so, rely on this branch's CI run and say so in the work log rather than installing a browser.

## File / module ownership

Create or modify only:

- `e2e/payment.spec.ts` (new)

Do not modify `e2e/order.spec.ts` — it belongs to SWHM-T-0177, which leaves it green through the new payment step. Do not modify anything under `payment/`, `src/pages/` or `routes/api/payment/`: if this ticket finds a defect in them, report it rather than fixing it here, because each of those files is owned by a ticket this one depends on.

## Definition of Done

- AC-1, AC-2, AC-3 and AC-4 hold at the browser tier, each evidenced by the assertion that carries it.
- The spec has been executed at least once, in CI if not locally, and its result is recorded in the work log.
- No file outside the ownership map above is modified.
