---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0211
branch: vortex/feat/SWHM-T-0211-batch-decision-entry-point-the-endpoint-5e02e2bc
upstream: [artifacts/SWHM-S-0018/SWHM-T-0211/PLAN.md]
downstream: [artifacts/SWHM-S-0018/qa-test-report.md]
---

# Summary — SWHM-T-0211: Batch decision entry point — the endpoint that replaces the approval queue

## What changed

Added `POST /api/admin/orders/decisions`, the route the Commit control writes to. It calls
`requireAdmin` (same guard shape as its sibling admin routes), parses `{ decisions: [{ orderId,
status }] }` refusing `PENDING` and any other unrecognized status as a decision, and delegates to
the existing `applyOrderDecisions` from `admin/order-status.ts` (added by SWHM-T-0212), returning
its three-bucket result unchanged. `status.post.ts` is untouched — its `{ orderIds, status }` shape
can't express a mixed-status batch, so this is a new file, not an extension.

## Files

- `routes/api/admin/orders/decisions.post.ts` — new. Parsing mirrors `status.post.ts`'s
  `parseOrderIds` structure; no logic beyond parsing and the `requireAdmin`/`applyOrderDecisions`
  calls.
- `routes/api/admin/orders/decisions.post.test.ts` — new. 10 cases against a real `H3Event`, no
  server (same pattern as `status.post.test.ts`): unauthenticated/non-admin refusal, each malformed
  body, `PENDING` explicitly refused, a valid mixed batch moving the rows and reporting all three
  buckets, and the same batch posted twice.

No existing file modified.

## AC coverage

- AC-1 (Commit sends all status changes to the server) — the route accepts and processes the whole
  batch in one request, tested by `decisions.post.test.ts › AC-1 / AC-2 / RD-09`.
- AC-2 (a pending order is eligible for approval/denial) — delegated to `applyOrderDecisions` →
  `applyDecision`'s existing guard (SWHM-T-0205/0206), exercised end-to-end through the route by the
  same `RD-09` test and by `RD-10`'s repeat-post case.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  118 passed (118)
     Tests  781 passed (781)
```

`bun run verify:full` was attempted first; its E2E tier fails at the documented Chromium-missing
preflight in this container (`AGENTS.md § Notes from previous agents`) — not retried per that note.
This ticket adds a JSON API route with no browser-observable UI, so E2E coverage is unaffected;
CI runs it again with a real Chromium.

See `tdd-test-result.md` — `TDD-RESULT: 781 passed, 0 failed`.
