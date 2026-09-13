---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0006
ticket: SWHM-T-0059
branch: vortex/fix/SWHM-T-0059-flaky-e2e-customer-profile-spec-ts-save-6ff89637
upstream:
  [
    artifacts/SWHM-S-0006/SWHM-T-0059/PLAN.md,
    openspec/changes/swhm-s-0006-multi-language-support/design.md,
  ]
downstream: [artifacts/SWHM-S-0006/qa-test-report.md]
---

# Fix note — SWHM-T-0059: flaky `customer-profile.spec.ts` save-then-render timing

## Root cause

`/customer` renders no DOM at all until two serial client-side reads resolve: `RequireSignOn`
returns `null` while its access check is in flight (`src/components/RequireSignOn.tsx:33`
pre-fix), and only once it renders its children does `CustomerProfile` mount and itself return
`null` until `/api/customer` answers (`src/pages/customer.tsx:194` pre-fix). Both reads are
synchronous `bun:sqlite` calls on one single-threaded Nitro process, and Playwright runs
`fullyParallel: true` against one shared dev server, so their latency tracks total load rather
than their own cost (design.md § Measured context). The screen gives the browser test no
intermediate signal, so its only recourse was a blind 5000ms budget on the final content
assertion — the assertion that flaked under load (CI run 34601581810,
`e2e/customer-profile.spec.ts:83`, `<element(s) not found>`). Confirmed by reading the source on
this branch per design.md; `bun run test:e2e` cannot execute in this container (Chromium is not
installed — see `.vortex/agents-generated.md`), so the CI log plus the source is the evidence
trail, as design.md's "Measured context" section states.

## Fix

Render an accessible pending indicator instead of `null` in both gating components, and anchor
the E2E wait on the settled screen rather than widening the content assertion's budget
(design.md § D1 rejects the latter — it would only widen the window in which a real regression
goes unnoticed).

- `RequireSignOn` now renders a `role="status"` element while undecided, and still calls
  `navigate(result.redirectTo)` and never renders children on denial — the access-check contract
  is unchanged (design.md § D2).
- `CustomerProfile` now renders its `<h1>Customer Profile</h1>` shell plus a `role="status"`
  element while the account read is in flight, instead of returning `null` for the whole page
  (design.md § D4).
- `e2e/customer-profile.spec.ts` waits for the "Contact information" region with an explicit
  15000ms budget after the final `page.goto("/customer")`, then asserts the saved first name and
  the `lang` attribute on the default (5000ms) budget — the content assertions stay tight, so a
  wrong render still fails fast.

Fixed in the two gating components rather than in the E2E spec alone, because the spec fix alone
does not address the underlying defect: a real visitor still sees an unbounded blank page
(design.md § D1, "the app-side and test-side fixes do different jobs").

## Regression test

- `src/components/RequireSignOn.test.tsx › shows a status indicator naming what is loading while
the access check is in flight` (new file) — pins AC-1.
- `src/pages/customer.test.tsx › PT-10: shows the heading and a status indicator while the account
read is in flight, then replaces it with content` — pins AC-2 and AC-3.

Red→green recorded in `tdd-test-result.md`. AC-4 (denial still redirects, never renders children)
and AC-5 (E2E waits on the settled screen) are covered by, respectively, the two pre-existing
passing cases in the new `RequireSignOn.test.tsx` and the `e2e/customer-profile.spec.ts` edit
itself — the E2E browser tier is observed in CI, not this container (see Test cases table).

## Files touched

- `src/components/RequireSignOn.tsx` — undecided branch renders `role="status"` instead of `null`.
- `src/components/RequireSignOn.test.tsx` (new) — covers pending, allowed, denied.
- `src/pages/customer.tsx` — no-account branch renders the page shell + `role="status"` instead of
  `null`.
- `src/pages/customer.test.tsx` — added PT-10 (pending-then-content); PT-01 through PT-09
  unmodified and still pass (AC-6).
- `e2e/customer-profile.spec.ts` — waits for the contact-information region (15000ms) before the
  final content assertions (default 5000ms budget).
