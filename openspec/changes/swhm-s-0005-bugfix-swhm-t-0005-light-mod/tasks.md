# Tasks — light-mode destructive foreground

## 1. Planning

- [ ] 1.1 Root-cause the defect against the code and re-verify every claim in the report (SWHM-T-0063)
- [ ] 1.2 Author the change (proposal, design, spec delta, tasks) and the per-defect PLAN.md (SWHM-T-0063)
- [ ] 1.3 Bring `DESIGN.md` to target state: replace the "Known bug" note with the standing contrast rule (SWHM-T-0063)

## 2. Fix

- [ ] 2.1 Set the light `:root` `--destructive-foreground` to `oklch(1 0 0)` in `src/index.css` (SWHM-T-0005)
- [ ] 2.2 Add `src/theme-tokens.test.ts` asserting the light pair meets 4.5:1 and that neither theme's pair is identical, with a failure message naming the offending theme (SWHM-T-0005)
- [ ] 2.3 Confirm the four existing `text-destructive` usages and `src/components/ui/button.test.tsx` are unaffected by the change (SWHM-T-0005)
