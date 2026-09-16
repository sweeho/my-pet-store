# Tasks — SWHM-S-0015

## 1. Planning

- [x] 1.1 Root-cause SWHM-T-0165 and SWHM-T-0166 against this sprint branch at `5d0bb64`, re-verifying every claim in both reports rather than trusting them, and establish that the reported fault is already fixed here (SWHM-T-0169)
- [x] 1.2 Confirm the three tiers of existing coverage and the `RequireSignOn` seam, and record that the browser tier cannot be observed in this container (SWHM-T-0169)
- [ ] 1.3 Author the change — proposal, technical design, the `order-placement` delta, this task list — and both defects' `PLAN.md` (SWHM-T-0169)

## 2. Confirm the confirmation screen renders its placement's result

- [x] 2.1 Confirm on this branch that a successful submission reaches the confirmation screen carrying the placement's identifier and billing email, and that the labelled order-id group renders from them (SWHM-T-0165)
- [x] 2.2 Confirm the screen-tier assertions covering the handoff and the no-state case hold, and add whatever is missing if one does not (SWHM-T-0165)
- [x] 2.3 Make no change to the placement route, the order module or the confirmation screen; if the criteria hold, close with no diff (SWHM-T-0165)

## 3. Confirm the browser journey

- [x] 3.1 Confirm the order journey in `e2e/order.spec.ts` shows a visible order-id group with a numeric identifier and the shopper's billing email after submission (SWHM-T-0166)
- [x] 3.2 Confirm a second order in that journey confirms with a higher identifier than the first (SWHM-T-0166)
- [x] 3.3 Check SWHM-T-0165's status first — if it closed with the criteria confirmed, close this as resolved-by-duplicate rather than re-confirming the same line (SWHM-T-0166)
