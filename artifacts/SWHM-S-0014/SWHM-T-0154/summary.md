---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0154
branch: vortex/feat/SWHM-T-0154-form-routing-and-validation-2dbf60fa
upstream: [artifacts/SWHM-S-0014/SWHM-T-0154/PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Summary — SWHM-T-0154: Form routing and validation

## What changed

Added the order-placement validator, the one route this capability exposes (401 unauthenticated,
400 invalid, otherwise a placeholder success the order-creation ticket replaces), and wired the
order form's submit handling with the two-level error presentation DESIGN.md § Form validation
states specifies.

## Files

- `order/validation.ts` — new. `validateOrderSubmission` and `OrderValidationError` (carries
  `section`/`field`); required-field + email-format checks per section, state/country left
  unenforced (design.md F9).
- `order/validation.test.ts` — new, 9 cases (OV-01…OV-09).
- `routes/api/order/index.post.ts` — new. `useSignOnSession` → 401, `validateOrderSubmission` → 400,
  otherwise `{ accepted: true }` — the seam PLAN.md asks for, left for SWHM-T-0156 to fill in.
- `routes/api/order/index.post.test.ts` — new, 4 cases (PO-01…PO-04).
- `src/pages/enter-order-information.tsx` — added `handleSubmit`, form-level and per-field error
  state, wrapped the two sections and the summary in one `<form>`, `Submit Order` now
  `type="submit"`. No field was added, removed or reordered.
- `src/pages/enter-order-information.test.tsx` — extended (pre-existing 12 cases kept; added
  EOI-13…EOI-15 for submission behaviour).

## AC coverage

- AC-1 (401, creates nothing) — `routes/api/order/index.post.test.ts › PO-01`.
- AC-2 (400 naming the missing field) — `order/validation.test.ts › OV-02-*`/`OV-03`,
  `routes/api/order/index.post.test.ts › PO-02`.
- AC-3 (email format) — `order/validation.test.ts › OV-05`/`OV-06`,
  `routes/api/order/index.post.test.ts › PO-03`.
- AC-4 (validator + error class exported; state/country unenforced) —
  `order/validation.ts` exports both; `order/validation.test.ts › OV-01`, `OV-04`, `OV-07`, `OV-08`,
  `OV-09`.
- AC-5 (values survive refusal; one form-level `role="alert"`) —
  `src/pages/enter-order-information.test.tsx › EOI-14`, `EOI-15`.
- AC-6 (per-field `aria-invalid` + adjacent `role="alert"`) — same file, `EOI-14`.
- AC-7 (accepted submission reaches the placement path) — same file, `EOI-13`;
  server side, `routes/api/order/index.post.test.ts › PO-04`.

## Verification

```
$ bun run lint && bun run typecheck && bun run test   # bun run verify
Test Files  86 passed (86)
     Tests  534 passed (534)
```

See `tdd-test-result.md` — `TDD-RESULT: 534 passed, 0 failed`.

`bun run verify:full`'s E2E tier was attempted and stopped at the documented missing-Chromium
preflight (no browser in this container); the same E2E tier runs in CI and at integration QA.

## Notes

- The mockup and DESIGN.md both call for one generic form-level message
  ("Please correct the highlighted field before submitting your order.") distinct from the specific
  per-field message the server returns — implemented as a fixed string, not the raw server error
  text, matching the mockup's alert copy.
- The route's success response is `{ accepted: true }` and the page navigates to
  `/order-completed` on it; that path has no page yet (SWHM-T-0159's phase), by design — this
  ticket only had to reach the placement path, not build the destination.
- `OrderValidationError` carries `section`/`field` in addition to `message` so the client can
  target the exact input; this is additive to what AC-2 requires (message naming the field) and
  is consumed by the frontend to satisfy AC-6.
