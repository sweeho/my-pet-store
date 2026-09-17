---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0211
branch: vortex/feat/SWHM-T-0211-batch-decision-entry-point-the-endpoint-5e02e2bc
upstream: [artifacts/SWHM-S-0018/SWHM-T-0211/PLAN.md]
---

# TDD result — SWHM-T-0211

## Test cases

| Test                                                                                                                               | Covers         | Intent                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `decisions.post.test.ts › RD-01: a request with no signed-on session is refused 401`                                               | PLAN.md step 2 | guard runs first, same shape as sibling routes                                             |
| `decisions.post.test.ts › RD-02: a signed-on session without the administrator role is refused 403`                                | PLAN.md step 2 | role check                                                                                 |
| `decisions.post.test.ts › RD-03: a missing decisions field answers 400`                                                            | PLAN.md step 3 | malformed body                                                                             |
| `decisions.post.test.ts › RD-04: an empty decisions array answers 400`                                                             | PLAN.md step 3 | malformed body                                                                             |
| `decisions.post.test.ts › RD-05: a non-array decisions field answers 400`                                                          | PLAN.md step 3 | malformed body                                                                             |
| `decisions.post.test.ts › RD-06: a non-numeric orderId answers 400`                                                                | PLAN.md step 3 | malformed body                                                                             |
| `decisions.post.test.ts › RD-07: an unrecognized status answers 400`                                                               | PLAN.md step 3 | malformed body                                                                             |
| `decisions.post.test.ts › RD-08: PENDING is refused as a decision status (S7)`                                                     | design.md S7   | PENDING is a state, not a decision anyone commits                                          |
| `decisions.post.test.ts › AC-1 / AC-2 / RD-09: a valid mixed batch applies, skips and reports notFound correctly, moving the rows` | AC-1, AC-2     | the commit reaches the server, a pending order is decided, the three-bucket response shape |
| `decisions.post.test.ts › RD-10: posting the same batch twice skips every order the second time and changes nothing further`       | design.md D7   | re-decided orders are safe, not re-processed                                               |

## Red run

`bun --bun vitest run routes/api/admin/orders/decisions.post.test.ts` — before `decisions.post.ts` existed (temporarily moved aside to capture this):

```
FAIL  |server| routes/api/admin/orders/decisions.post.test.ts [ routes/api/admin/orders/decisions.post.test.ts ]
Error: Cannot find module './decisions.post' imported from /workspace/repo/routes/api/admin/orders/decisions.post.test.ts

Test Files  1 failed (1)
     Tests  no tests
```

The file was restored immediately after capturing the failure.

## Green run

`bun run verify` — this project's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`). `verify:full`'s browser tier was attempted and fails at the documented preflight (`scripts/ensure-playwright-browser.mjs`: Chromium not installed) — the known implementation-container limitation recorded in `AGENTS.md § Notes from previous agents`; not retried per that note. `routes/api/admin/orders/decisions.post.ts` is a JSON API route with no browser-observable UI, so its coverage is unaffected.

```
$ bun run lint && bun run typecheck && bun run test
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   ✓ (no output)
tsc --build                                                                  ✓ (no output)
NODE_ENV=test bun --bun vitest run

 Test Files  118 passed (118)
      Tests  781 passed (781)
```

TDD-RESULT: 781 passed, 0 failed
