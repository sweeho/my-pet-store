---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0204
branch: vortex/feat/SWHM-T-0204-auto-approval-logic-locale-thresholds-an-66744cf5
upstream: [artifacts/SWHM-S-0018/SWHM-T-0204/PLAN.md]
---

# TDD result — SWHM-T-0204

## Test cases

| Test                                                                                                                  | Covers                                  | Intent                                                       |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| `order/approval.test.ts › AC-1: a US order under $500 is APPROVED`                                                    | AC-1                                    | pure decision, en_US under threshold                         |
| `order/approval.test.ts › AC-2: a US order over $500 is PENDING`                                                      | AC-2                                    | pure decision, en_US over threshold                          |
| `order/approval.test.ts › en_US: the $500 boundary itself is PENDING`                                                 | AC-2                                    | threshold is exclusive (`< 500`)                             |
| `order/approval.test.ts › en_US: just under $500 is APPROVED`                                                         | AC-1                                    | boundary on the approved side                                |
| `order/approval.test.ts › AC-3: a Japan order under ¥50,000 is APPROVED`                                              | AC-3                                    | pure decision, ja_JP under threshold                         |
| `order/approval.test.ts › AC-4: a Japan order over ¥50,000 is PENDING`                                                | AC-4                                    | pure decision, ja_JP over threshold                          |
| `order/approval.test.ts › ja_JP: the 50,000 boundary itself is PENDING`                                               | AC-4                                    | threshold is exclusive (`< 50000`)                           |
| `order/approval.test.ts › ja_JP: just under 50,000 is APPROVED`                                                       | AC-3                                    | boundary on the approved side                                |
| `order/approval.test.ts › a locale with no threshold (zh_CN) is PENDING`                                              | requirement's "all other orders" branch | unmatched locale, not a special case                         |
| `order/approval.test.ts › a null locale is PENDING`                                                                   | requirement's "all other orders" branch | no profile / no locale copied                                |
| `order/order.test.ts › OT-05: a new order under its locale's auto-approval threshold is APPROVED`                     | AC-1                                    | `placeOrder` applies the decision, default en_US profile     |
| `order/order.test.ts › AP-01: a US order under $500 is APPROVED`                                                      | AC-1                                    | `placeOrder` end-to-end, explicit en_US                      |
| `order/order.test.ts › AP-02: a US order over $500 stays PENDING`                                                     | AC-2                                    | `placeOrder` end-to-end, explicit en_US                      |
| `order/order.test.ts › AP-03: a Japan order under ¥50,000 is APPROVED`                                                | AC-3                                    | `placeOrder` end-to-end, explicit ja_JP                      |
| `order/order.test.ts › AP-04: a Japan order over ¥50,000 stays PENDING`                                               | AC-4                                    | `placeOrder` end-to-end, explicit ja_JP                      |
| `order/order.test.ts › AP-05: the order's locale is copied from the customer's profile at placement`                  | design.md D2                            | `orders.locale` persisted from `profiles.preferred_language` |
| `order/order.test.ts › AP-06: a customer with no profile row places an order with a null locale, which stays PENDING` | design.md D2                            | missing profile resolves to null, not a crash                |

## Red run

`bun --bun vitest run order/approval.test.ts` — `decideApproval` stubbed to always return `"PENDING"`:

```
FAIL order/approval.test.ts > decideApproval > en_US: just under $500 is APPROVED
AssertionError: expected 'PENDING' to be 'APPROVED'
FAIL order/approval.test.ts > decideApproval > AC-3: a Japan order under ¥50,000 is APPROVED
AssertionError: expected 'PENDING' to be 'APPROVED'
FAIL order/approval.test.ts > decideApproval > ja_JP: just under 50,000 is APPROVED
AssertionError: expected 'PENDING' to be 'APPROVED'

Test Files  1 failed (1)
     Tests  4 failed | 6 passed (10)
```

`bun --bun vitest run order/order.test.ts` — `placeOrder` reverted to hardcode `status: "PENDING"`, `locale: null`:

```
FAIL order/order.test.ts > placeOrder > OT-05: a new order under its locale's auto-approval threshold is APPROVED (SWHM-T-0204)
AssertionError: expected 'PENDING' to be 'APPROVED'
FAIL order/order.test.ts > placeOrder — auto-approval by locale threshold (SWHM-T-0204) > AP-01: a US order under $500 is APPROVED
AssertionError: expected 'PENDING' to be 'APPROVED'
FAIL order/order.test.ts > placeOrder — auto-approval by locale threshold (SWHM-T-0204) > AP-03: a Japan order under ¥50,000 is APPROVED
AssertionError: expected 'PENDING' to be 'APPROVED'
FAIL order/order.test.ts > placeOrder — auto-approval by locale threshold (SWHM-T-0204) > AP-05: the order's locale is copied from the customer's profile at placement
AssertionError: expected null to be 'ja_JP'

Test Files  1 failed (1)
     Tests  4 failed | 24 passed (28)
```

Both reverts restored immediately after capturing the failure.

## Green run

`bun run verify` — this project's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`); `verify:full`'s browser tier was attempted first and failed at the documented preflight (`scripts/ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") — a known implementation-container limitation recorded in `AGENTS.md § Notes from previous agents`, not retried per that note; E2E runs again in CI and at INTEGRATION_QA.

```
$ bun run lint && bun run typecheck && bun run test
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   ✓ (no output)
tsc --build                                                                  ✓ (no output)
NODE_ENV=test bun --bun vitest run

 Test Files  113 passed (113)
      Tests  738 passed (738)
```

TDD-RESULT: 738 passed, 0 failed
