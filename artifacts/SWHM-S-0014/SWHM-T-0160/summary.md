---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0160
branch: vortex/feat/SWHM-T-0160-confirmation-notification-the-promise-th-5a127dee
upstream: [artifacts/SWHM-S-0014/SWHM-T-0160/PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Summary — SWHM-T-0160: Confirmation notification — the promise the screen makes

## What changed

Added the "You should receive a confirmation e-mail soon at [email]." line to
`/order-completed`, in the position and wording the mockup's mail row shows, interpolating the
`email` the order was placed with (the same navigation-state value SWHM-T-0159 already threads
through). No sender, queue, transport, or placeholder module — this ticket adds no dependency.

## Files

- `src/pages/order-completed.tsx` — the mail-icon row and message, rendered alongside the
  order-id block only when navigation state is present; removed the stale comment saying this
  ticket's line didn't exist yet.
- `src/pages/order-completed.test.tsx` — 3 new cases (OC-06–OC-08); OC-01–OC-05 unchanged.

## AC coverage

- AC-1 (screen confirms an email is coming, in the scenario's exact wording) — the `<p>` in
  `order-completed.tsx`'s mail row, covered by `OC-06`.
- AC-2 (interpolates the address the order was placed with, asserted against a test-supplied
  address) — `{state.email}`, covered by `OC-06`/`OC-07` (two different addresses, neither
  hard-coded).
- AC-3 (no new dependency; no sender/queue/transport/placeholder) — verified by inspection:
  `git diff package.json` is empty; the only new import (`Mail`) is from `lucide-react`, already
  used elsewhere on this same page.

## Verification

```
$ bun --bun vitest run src/pages/order-completed.test.tsx
 Test Files  1 passed (1)
      Tests  8 passed (8)

$ bun run verify        # lint + typecheck + full unit suite
 Test Files  90 passed (90)
      Tests  554 passed (554)
```

`bun run verify:full`'s E2E tier fails only on this container's missing Chromium
(`ensure-playwright-browser.mjs`), per AGENTS.md's known containers-ship-no-Chromium note; E2E is
observed in CI / integration QA. See `tdd-test-result.md` — `TDD-RESULT: 554 passed, 0 failed`.

## Notes

Red was produced for real: the implementation was `git stash`ed after being written, the new
tests run against the unmodified page to confirm failure, then the stash was reapplied — see
`tdd-test-result.md`'s Red run.
