# SWHM-S-0022 bugfix — Implementation Tasks

## 1. Planning

- [ ] 1.1 Root-cause both defects, author this change and the per-defect plans (SWHM-T-0242)

## 2. Non-screen components are not routable (SWHM-T-0239)

- [x] 2.1 Stop `NotFound.tsx` and `RootErrorBoundary.tsx` producing routes of their own, per design.md D1 (SWHM-T-0239)
- [x] 2.2 Pin `/NotFound` and `/RootErrorBoundary` to the not-found screen in the browser tier, per design.md D5 (SWHM-T-0239)
- [x] 2.3 Add the checked-in route inventory guard over the pages directory, per design.md D3 and D4 (SWHM-T-0239)

## 3. Dispatch codebase-context defect (SWHM-T-0235)

- [ ] 3.1 Record the verified root cause and the out-of-repository fix site; no change lands in this repository, per design.md D7 (SWHM-T-0235)
