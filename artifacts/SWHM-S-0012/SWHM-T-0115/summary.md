---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0115
branch: vortex/feat/SWHM-T-0115-admin-home-page-and-shell-5e2e2f4d
upstream: [artifacts/SWHM-S-0012/SWHM-T-0115/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0115: Admin home page and shell

## What changed

Added `AdminShell` (the header, "Signed in as _username_" slot with a pending-state fallback, and
optional back link) per the fixed interface contract in `PLAN.md`, and `/admin` — the administration
home page rendered inside it, behind `RequireAdmin` — with its title, description, four capability
lines, "Launch Rich Client" and "Logout" actions, and the session footnote, copy taken verbatim from
`artifacts/SWHM-S-0012/design/mockup-admin-home.html`. Read the header/back-link shape from
`artifacts/SWHM-S-0012/design/mockup-orders-view.html` per `PLAN.md`'s design reference. Per S2/S8 in
`openspec/changes/swhm-i-0006-administrative-operations-ma/design.md`, "Launch Rich Client" is a plain
navigation to `/admin/orders`, not a form POST to `AdminRequestProcessor`, and "Logout" calls
`POST /api/signon/logout` (SWHM-T-0116's endpoint, not yet implemented) then navigates to `/`.

## Files

- `src/components/AdminShell.tsx` — new: shared admin header + optional back link + children.
- `src/components/AdminShell.test.tsx` — new: header username slot (present/pending), back-link presence and label.
- `src/components/index.ts` — added the `AdminShell` export.
- `src/pages/admin/index.tsx` — new: `/admin` home screen (`AdminHomeContent`, wrapped in `RequireAdmin` as the default export).
- `src/pages/admin/index.test.tsx` — new: pending state, rendered content, both actions' behaviour.

## AC coverage

- AC-1 (title, description, Launch Rich Client button, logout button) — `src/pages/admin/index.tsx`; covered by `src/pages/admin/index.test.tsx › renders the title, description and both actions once the session read resolves`.
- AC-2 (Launch Rich Client reaches the orders screen) — resolved per `PLAN.md`'s Definition of Done as navigation to `/admin/orders` rather than a POST to `AdminRequestProcessor` (S2 — no JNLP/rich client exists); `src/pages/admin/index.tsx`, covered by `› navigates to /admin/orders when Launch Rich Client is activated`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  60 passed (60)
      Tests  348 passed (348)
```

Full detail (including the red→green proof for this ticket's 9 new tests) in `tdd-test-result.md` —
`TDD-RESULT: 348 passed, 0 failed`. `bun run verify:full`'s E2E tier could not run in this container
(Chromium genuinely not installed, per AGENTS.md's notes for this sprint); it runs at INTEGRATION_QA
and in CI.

## Notes

- The session-footnote copy ("Your session ends after 54 minutes...") is reproduced verbatim from the
  mockup though the behaviour does not exist yet — this is the recorded gap `PLAN.md` and
  design.md § S8 call out, not a new claim.
- `AdminShell`'s own pending state (the header's `role="status"` "Signing in…") only ever renders after
  `RequireAdmin` has already resolved to allowed, so there is exactly one pending indicator visible at
  a time, per `PLAN.md`'s gotcha about not stacking two competing ones.
