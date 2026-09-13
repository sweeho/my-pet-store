# Tasks — observable pending state on data-gated screens

## 1. Planning

- [ ] 1.1 Reproduce and root-cause SWHM-T-0059 against the source and the CI log, re-verifying every claim in the defect report (SWHM-T-0066)
- [ ] 1.2 Author the change — proposal, design, `application-foundation` delta, tasks (SWHM-T-0066)
- [ ] 1.3 Commit `artifacts/SWHM-S-0006/SWHM-T-0059/PLAN.md` and refine SWHM-T-0059 in place (SWHM-T-0066)
- [ ] 1.4 Bring `DESIGN.md` and `ARCHITECTURE.md` to target state for the pending-state pattern and its promoted decision (SWHM-T-0066)

## 2. Fix

- [ ] 2.1 Render a `role="status"` pending indicator in `src/components/RequireSignOn.tsx` instead of `null` while the access check is undecided, leaving the denial redirect unchanged (SWHM-T-0059)
- [ ] 2.2 Render the "Customer Profile" heading plus a `role="status"` pending indicator in `src/pages/customer.tsx` instead of returning `null` for the whole page (SWHM-T-0059)
- [ ] 2.3 Anchor `e2e/customer-profile.spec.ts`'s post-re-sign-in wait on the contact-information region before asserting the saved first name and language, keeping the content assertions on the default budget (SWHM-T-0059)
- [ ] 2.4 Add `src/components/RequireSignOn.test.tsx` covering the pending, allowed and denied branches (SWHM-T-0059)
- [ ] 2.5 Extend `src/pages/customer.test.tsx` with the pending-then-content case, keeping its existing no-account-yet cover (SWHM-T-0059)
