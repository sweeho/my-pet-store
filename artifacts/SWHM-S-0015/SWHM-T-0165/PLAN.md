# PLAN — SWHM-T-0165

**Defect:** `enter-order-information.tsx` doesn't pass `{ orderId, email }` to `/order-completed`
**Change:** `swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01`
**Capability:** `order-placement`
**Requirement:** _Order confirmation screen displays order ID and email_ (MODIFIED)

## Objective

Confirm on this sprint branch that a successful order submission reaches the confirmation screen
carrying the identifier and billing email its placement produced, and that the screen renders them.
**No production code change is expected** — the reported fault is already fixed here, and the
regression assertion this defect asks for already exists and passes. See `design.md § D1` for why
the correct outcome is to close with no diff, and `proposal.md § Why` for the verification behind
that finding.

## Design reference

The idea behind this ticket carries no design blocks — it is an idea-less defect batch, so
`a2a_get_idea_design` resolves to no idea and there is nothing to export. The visual target for the
confirmation screen is the one already built at `src/pages/order-completed.tsx`, whose mockup was
exported and matched during SWHM-S-0014 (SWHM-T-0159). Nothing about it changes here.

## Steps

1. **Read `design.md` first**, in full. It records what was verified and why no code moves; starting
   from the ticket description alone will send you looking for a bug that is not there.
2. **Confirm the handoff at the caller.** `src/pages/enter-order-information.tsx`'s `handleSubmit`
   success path parses the placement response and passes it as router state. Confirm it still does,
   and that the field names match the response shape the route returns (`design.md § D1`).
3. **Confirm the screen-tier assertions.** The caller-side assertion in
   `src/pages/enter-order-information.test.tsx` and the confirmation screen's own cases in
   `src/pages/order-completed.test.tsx` — including the no-state case — are the oracles for AC-1 to
   AC-4. The scenario-to-assertion mapping is the table in `design.md § D3`.
4. **If every criterion holds, close with no diff.** Record in your work log which assertion carried
   each criterion. Do not edit correct code to produce a diff (`design.md § D1`).
5. **If a criterion does not hold**, the fix is confined to the success path of `handleSubmit` in
   `src/pages/enter-order-information.tsx` and its test file — the two files this ticket owns below.
   Add or repair the assertion alongside the fix so the scenario has a standing oracle.

## File / module ownership

Create or modify only:

- `src/pages/enter-order-information.tsx` — the `handleSubmit` success path only, and only if a
  criterion fails
- `src/pages/enter-order-information.test.tsx` — the caller-side assertion covering the handoff

Do not modify `src/pages/order-completed.tsx`, `order/order.ts`, `order/validation.ts`,
`routes/api/order/index.post.ts` or `e2e/order.spec.ts`. The `{ orderId, email }` response shape is
a fixed interface contract settled in SWHM-S-0014 and read by the confirmation screen; it does not
move. `e2e/order.spec.ts` belongs to SWHM-T-0166.

## Definition of Done

- AC-1, AC-2, AC-3 and AC-4 on this ticket are observed to hold on this branch, each evidenced in
  the work log by the assertion or rendered element that carries it.
- No file outside the ownership map above is modified.
- If the criteria held with no code change, the work log says so explicitly and names the commit
  (`5d0bb64`) the behaviour arrived in.
