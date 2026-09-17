---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0227
branch: vortex/feat/SWHM-T-0227-verification-the-three-transitions-end-t-877a81f7
upstream: [artifacts/SWHM-S-0020/SWHM-T-0227/PLAN.md]
---

# TDD result — SWHM-T-0227

This ticket adds no production code (PLAN.md § File/module ownership: only
`notifications/notifications.integration.test.ts` is created). There is no
feature to drive red→green in the usual sense, so the "red" proof here is
that the suite actually catches a real regression in the behaviour it
claims to verify — see `## Red run` below.

## Test cases

| Test                                               | Covers     | Intent                                                                                                                                                                                    |
| -------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notifications.integration.test.ts › AC-1 / NI-01` | AC-1       | approval via `applyOrderDecisions` → `dispatchQueued`: sent to the account's address (not the order's copied billing email), body names order id/name/status, row `SENT`                  |
| `notifications.integration.test.ts › AC-2 / NI-02` | AC-2       | denial via `applyOrderDecisions` in the same batch as an approval: sent, body names order id/name/`DENIED`, and the message differs from the approval's (subject and body)                |
| `notifications.integration.test.ts › AC-3 / NI-03` | AC-3       | completion via `processOrder` (stocked line): sent, body names order id/name/`COMPLETED`, order `COMPLETED`, row `COMPLETION`/`SENT`                                                      |
| `notifications.integration.test.ts › AC-4 / NI-04` | AC-4, AC-5 | account with no contact email and no order billing email: `applyOrderDecisions` still applies (order left `APPROVED`), nothing handed to the transport, row `UNDELIVERABLE` with a reason |

All four drive the real call paths (`applyOrderDecisions`, `processOrder`) named in
PLAN.md step 6, never a row written directly into `notifications` and handed to
`dispatchQueued`.

## Red run

The suite passed on first write (the modules it exercises — SWHM-T-0224/0225/0226 —
were already merged and correct), so a vacuous "red" would have proved nothing. To
prove NI-01 actually catches a regression rather than testing a tautology, the
account-address priority in `notifications/dispatch.ts` was temporarily inverted
(`row.recipientEmail ?? recipient.email` in place of `recipient.email ??
row.recipientEmail` — swapping design.md D5's "account wins" rule), and the suite
re-run:

```
$ bun --bun vitest run notifications/notifications.integration.test.ts

 ❯ |server| notifications/notifications.integration.test.ts (4 tests | 1 failed) 32ms
     × AC-1 / NI-01: approval, end to end, sends to the account's address and marks the row SENT

AssertionError: expected [ { …(3) } ] to deeply equal [ ObjectContaining{…} ]
- Expected
+ Received
  [
    {
      "subject": "Your order #1001 has been approved",
-     "to": "ada@example.com",
+     "to": "old-billing@example.com",
    },
  ]

 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)
```

`notifications/dispatch.ts` was then reverted to its committed state (`git diff`
confirms no change survives) and the suite re-run — see `## Green run`.

## Green run

`bun --bun vitest run notifications/notifications.integration.test.ts` against the
unmodified tree:

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run

 Test Files  125 passed (125)
      Tests  858 passed (858)
Duration  14.46s
```

`bun run verify:full` was attempted first for the browser tier and failed its
`test:e2e` preflight — Chromium is not installed in this container
(`/ms-playwright/chromium-1155/chrome-linux/chrome` missing), the documented
AGENTS.md fallback for implementation containers. Per that note, not retried;
falling back to `bun run verify` above. This capability has no screen (design.md §
Design references), so no browser-tier spec applies regardless. The browser tier
runs in CI and at INTEGRATION_QA.

TDD-RESULT: 858 passed, 0 failed
