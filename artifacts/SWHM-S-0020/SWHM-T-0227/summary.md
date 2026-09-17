---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0227
branch: vortex/feat/SWHM-T-0227-verification-the-three-transitions-end-t-877a81f7
upstream: [artifacts/SWHM-S-0020/SWHM-T-0227/PLAN.md]
downstream: []
---

# Summary — SWHM-T-0227: Verification — the three transitions end to end, and the missing-address case

## What changed

Added one integration test file proving the three notification-delivery scenarios and
the missing-address case across the real call paths, not module by module. Each case
drives `applyOrderDecisions` (the admin decisions route's path) or `processOrder` (the
fulfilment route's path), then `dispatchQueued(transport)` with an injected recording
transport — the same two-step shape both routes use, never a row written directly into
`notifications` and handed to the dispatcher. No production code changed; SWHM-T-0224,
SWHM-T-0225 and SWHM-T-0226 already shipped and merged the modules under test.

## Files

- `notifications/notifications.integration.test.ts` — new. 4 cases: approval, denial
  (run in the same batch as an approval, to prove the two messages actually differ),
  completion (through `processOrder` with a stocked line), and the missing-address case
  (no account email, no order billing email).

## AC coverage

- AC-1 (approval notification sent) — NI-01: sent to the account's address (not the
  order's copied billing email, proving design.md D5), row `SENT`.
- AC-2 (denial notification sent) — NI-02: sent, distinguishable subject/body from an
  approval sent in the same batch.
- AC-3 (completion notification sent) — NI-03: through `processOrder` with real stock;
  order reaches `COMPLETED`, row `COMPLETION`/`SENT`.
- AC-4 (missing-address case: undeliverable, order status unchanged, nothing handed to
  transport) — NI-04: transport receives nothing, order stays `APPROVED` (what the
  decision set), row `UNDELIVERABLE` with a reason.
- AC-5 (each transition exercised through its own call path) — all four cases start at
  `applyOrderDecisions` or `processOrder`; none writes a `notifications` row by hand.

No browser-tier spec: this capability has no screen (design.md § Design references —
the idea puts a UI out of scope and the manifest is empty).

## Verification

```
$ bun run verify
lint: clean
typecheck: clean
test: 858 passed (858), 125 files
```

`bun run test:e2e` failed its preflight in this container (no Chromium installed) — the
documented AGENTS.md fallback for implementation containers; not retried, and moot here
since this capability has no screen. Full red→green detail, including a deliberate
regression used to prove NI-01 is non-vacuous, is in `tdd-test-result.md`
(`TDD-RESULT: 858 passed, 0 failed`).
