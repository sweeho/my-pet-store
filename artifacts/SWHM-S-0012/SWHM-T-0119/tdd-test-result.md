---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0119
branch: vortex/feat/SWHM-T-0119-batch-order-status-update-c17d88df
upstream: [artifacts/SWHM-S-0012/SWHM-T-0119/PLAN.md]
---

# TDD result — SWHM-T-0119

## Test cases

| Test                                                                                                                          | Covers                | Intent                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| `admin/order-status.test.ts › US-01: moves every order in the batch to the new status`                                        | AC-1                  | several orders move together in one call                               |
| `admin/order-status.test.ts › US-02: a mix of known and unknown ids reports both lists and still moves the known ones`        | AC-1, D5              | unknown ids reported, not dropped; known ids still move                |
| `admin/order-status.test.ts › US-03: a batch that matches nothing is a success with an empty updated list`                    | D5                    | all-unknown batch is a success, not a 404                              |
| `admin/order-status.test.ts › US-04: a write failing partway through the batch rolls back every order to its original status` | AC-2 (S5 — atomicity) | one `db.transaction`: every order moves or none does                   |
| `routes/api/admin/orders/status.post.test.ts › RS-01: a request with no signed-on session is refused 401`                     | route guard           | `requireAdmin` 401 path                                                |
| `routes/api/admin/orders/status.post.test.ts › RS-02: a signed-on session without the administrator role is refused 403`      | route guard           | `requireAdmin` 403 path                                                |
| `routes/api/admin/orders/status.post.test.ts › RS-03: an unknown status answers 400 with an error message`                    | AC-1                  | status validated against `ORDER_STATUSES` before the transaction opens |
| `routes/api/admin/orders/status.post.test.ts › RS-04: a missing orderIds answers 400`                                         | body validation       | malformed body rejected                                                |
| `routes/api/admin/orders/status.post.test.ts › RS-05: an empty orderIds array answers 400`                                    | body validation       | malformed body rejected                                                |
| `routes/api/admin/orders/status.post.test.ts › RS-06: a non-array orderIds answers 400`                                       | body validation       | malformed body rejected                                                |
| `routes/api/admin/orders/status.post.test.ts › RS-07: a non-numeric id in orderIds answers 400`                               | body validation       | malformed body rejected                                                |
| `routes/api/admin/orders/status.post.test.ts › RS-08: a valid request moves every order and reports the response shape`       | AC-1                  | end-to-end route → `StatusUpdateResult`                                |
| `routes/api/admin/orders/status.post.test.ts › RS-09: unknown ids in an otherwise-valid request are reported, not dropped`    | AC-1, D5              | end-to-end route reports `notFound`                                    |

## Red run

`bun --bun vitest run admin/order-status.test.ts` against a stub `updateOrderStatus` that threw
`"not implemented"`:

```
FAIL  admin/order-status.test.ts > US-01/US-02/US-03/US-04
Error: not implemented
 Test Files  1 failed (1)
      Tests  4 failed (4)
```

`bun --bun vitest run routes/api/admin/orders/status.post.test.ts` against a stub handler that always
returned `{ error: "not implemented" }` with no status/guard logic:

```
FAIL  routes/api/admin/orders/status.post.test.ts > RS-01 .. RS-09
AssertionError: expected { error: 'not implemented' } to deeply equal {...}
 Test Files  1 failed (1)
      Tests  9 failed (9)
```

## Green run

`bun run verify` — this stack's full pre-commit gate (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`), run against the real implementation:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  66 passed (66)
      Tests  386 passed (386)
```

`bun run verify:full` was attempted first; lint, typecheck and the full 386-test unit suite all
passed, but its `pretest:e2e` preflight (`scripts/ensure-playwright-browser.mjs`) reported Chromium
is genuinely not installed in this container — fell back to `bun run verify` per AGENTS.md's notes
for this sprint. E2E runs at INTEGRATION_QA and in CI.

TDD-RESULT: 386 passed, 0 failed
