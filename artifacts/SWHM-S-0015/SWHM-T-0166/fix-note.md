---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0015
ticket: SWHM-T-0166
branch: vortex/fix/SWHM-T-0166-accepted-gate-bypass-on-swhm-t-0162-orde-1d50067d
upstream:
  [
    artifacts/SWHM-S-0015/SWHM-T-0166/PLAN.md,
    openspec/changes/swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01/design.md,
  ]
---

# Fix note — SWHM-T-0166: Accepted gate bypass on SWHM-T-0162: Order journey in a browser

## Resolved by duplicate

Per PLAN.md Step 1: checked `SWHM-T-0165` first. It is `DONE`, and its `fix-note.md` confirms every
one of its criteria against the existing code (no fault found — `handleSubmit`'s success path in
`src/pages/enter-order-information.tsx` already carries `{ orderId, email }` to `/order-completed`,
landed in commit `5d0bb64` during SWHM-S-0014). SWHM-T-0165's fix-note explicitly states
`e2e/order.spec.ts` and its acceptance criteria belong to this ticket, so this ticket confirms the
browser-tier half of the same already-fixed fault.

This ticket closes as **resolved-by-duplicate**: same file, same line, same fault as SWHM-T-0165,
already fixed on this branch (`design.md § D1`, `§ D4`).

## Root cause

None — the reported fault is not present on this branch (see SWHM-T-0165's fix-note for the
verified root cause finding).

## Verification performed

- Chromium is genuinely absent in this container: `node scripts/ensure-playwright-browser.mjs`
  reports "Playwright's Chromium browser is not installed" and exits with the documented guidance
  to use `bun run verify` instead — consistent with `AGENTS.md` § Notes from previous agents and
  `design.md § D1`.
- Read `e2e/order.spec.ts:126-158` directly. The order-journey test already carries all three
  criteria:
  - **AC-1** — `firstIdBlock`'s `aria-label` is parsed via `orderIdFrom()` (line 140), i.e. the
    confirmation screen's visible order-id group has an accessible name ending in the numeric id.
  - **AC-2** — `expect(page.getByText(BILLING.email)).toBeVisible()` (line 141) — the shopper's
    billing email is asserted visible on the confirmation screen.
  - **AC-3** — a second order is placed later in the same test and its id (`secondOrderId`, line 158) is asserted higher than `firstOrderId`, not repeated or fixed.
- Per `design.md § D1`, this exact spec was already observed passing in a real browser: **CI run
  `35138625151` on this sprint branch, 37 of 37 E2E tests green**, including
  `e2e/order.spec.ts:126`.
- `bun run verify` (lint + typecheck + full unit suite) on this branch: green — 91 test files, 577
  tests, 0 failures.

No criterion failed, so no diff is made to `e2e/order.spec.ts` — the assertions already state the
correct behaviour and already pass.

## Files touched

None.
