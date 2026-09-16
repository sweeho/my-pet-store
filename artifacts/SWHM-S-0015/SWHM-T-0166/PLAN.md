# PLAN — SWHM-T-0166

**Defect:** Accepted gate bypass on SWHM-T-0162 — order journey in a browser
**Change:** `swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01`
**Capability:** `order-placement`
**Requirement:** _Order confirmation screen displays order ID and email_ (MODIFIED)
**Depends on:** SWHM-T-0165 — the same fault at the same line, reported twice

## Objective

Confirm in the browser tier that the order journey ends on a confirmation screen showing the order
identifier and the shopper's billing email, and that a second order confirms with its own higher
identifier. **This ticket is a duplicate of SWHM-T-0165** and no production code change is expected
from either; see `design.md § D1` and `§ D4`, and `proposal.md § Why` for the verification that the
reported fault is already fixed on this branch.

## Design reference

No design blocks — this is an idea-less defect batch, so `a2a_get_idea_design` resolves to no idea
and there is nothing to export. The confirmation screen's mockup was exported and matched during
SWHM-S-0014 (SWHM-T-0159); nothing visual changes here.

## Steps

1. **Check SWHM-T-0165 first.** If it closed with its criteria confirmed, this ticket closes as
   resolved-by-duplicate — say so in the work log and stop. Re-confirming the same line twice is the
   waste the dependency exists to prevent (`design.md § D4`).
2. **Read `design.md`** before forming any view on scope. It records what was verified statically and
   what could not be, and why no diff is expected.
3. **Observe the browser tier.** `e2e/order.spec.ts`'s order journey carries AC-1, AC-2 and AC-3 —
   the visible order-id group, the billing email, and the second order's higher identifier. This is
   the one tier that could not be observed during planning: Chromium is genuinely absent from the
   planning container, so the spec was read rather than run (`design.md § D1`). If the browser is
   missing in your container too, say so and rely on the CI run for this branch rather than
   installing one.
4. **If every criterion holds, close with no diff**, naming the assertions that carried each one.
5. **If a criterion fails**, the cause is the caller's success path, not the confirmation screen —
   see the ownership map. Coordinate with SWHM-T-0165's outcome rather than editing the same line
   independently.

## File / module ownership

Create or modify only:

- `e2e/order.spec.ts` — the order journey assertions, and only if one is wrong about the behaviour
  rather than failing because of it

Do not modify `src/pages/enter-order-information.tsx`, `src/pages/order-completed.tsx`,
`order/order.ts` or `routes/api/order/index.post.ts`. The first belongs to SWHM-T-0165, which this
ticket depends on; this defect's own report states the other three need no change, and the
`{ orderId, email }` response shape is a fixed interface contract that does not move.

## Definition of Done

- AC-1, AC-2 and AC-3 on this ticket are observed to hold, each evidenced in the work log by the
  assertion that carries it — or, where the browser is unavailable in the container, by the CI run
  for this branch.
- No file outside the ownership map above is modified.
- If closed as resolved-by-duplicate under step 1, the work log names SWHM-T-0165 and its outcome.
