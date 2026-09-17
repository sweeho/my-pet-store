---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0225
branch: vortex/feat/SWHM-T-0225-email-generation-subject-and-body-per-no-71e8a6e5
upstream: [artifacts/SWHM-S-0020/SWHM-T-0225/PLAN.md]
---

# TDD result — SWHM-T-0225

## Test cases

| Test                                               | Covers     | Intent                                                                          |
| -------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `notifications/message.test.ts › AC-1/AC-2 MSG-01` | AC-1, AC-2 | APPROVAL body names order id, customer name, status                             |
| `notifications/message.test.ts › AC-1/AC-2 MSG-02` | AC-1, AC-2 | DENIAL body names order id, customer name, status                               |
| `notifications/message.test.ts › AC-1/AC-2 MSG-03` | AC-1, AC-2 | COMPLETION body names order id, customer name, status                           |
| `notifications/message.test.ts › AC-2 MSG-04`      | AC-2       | the three kinds' subjects are pairwise distinct                                 |
| `notifications/message.test.ts › AC-2 MSG-05`      | AC-2       | `buildMessage` returns the given `to` address unchanged, for each kind          |
| `notifications/message.test.ts › AC-3 MSG-06`      | AC-3       | no given/family name: body still names order id and status, no null/placeholder |
| `notifications/message.test.ts › AC-3 MSG-07`      | AC-3       | given-name-only: addressed by given name alone, no trailing fragment            |
| `notifications/message.test.ts › AC-3 MSG-08`      | AC-3       | family-name-only: addressed by family name alone, no leading fragment           |
| `notifications/message.test.ts › AC-4 MSG-09`      | AC-4       | callable with plain object literals — no database, no fixture                   |

## Red run

`bun --bun vitest run notifications/message.test.ts`, run before `notifications/message.ts` existed:

```
 RUN  v4.1.10 /workspace/repo

 ❯ |server| notifications/message.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |server| notifications/message.test.ts [ notifications/message.test.ts ]
Error: Cannot find module './message' imported from /workspace/repo/notifications/message.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

`bun --bun vitest run notifications/message.test.ts` after implementing `notifications/message.ts`:

```
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run

 Test Files  122 passed (122)
      Tests  843 passed (843)
Duration  14.66s
```

`bun run verify:full` was attempted first for the browser tier and failed its `test:e2e` preflight —
Chromium is not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome`
missing), the documented AGENTS.md fallback for implementation containers. Per that note, not
retried; falling back to `bun run verify` above. The browser tier runs in CI and at INTEGRATION_QA.

TDD-RESULT: 843 passed, 0 failed
