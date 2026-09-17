---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0225
branch: vortex/feat/SWHM-T-0225-email-generation-subject-and-body-per-no-71e8a6e5
upstream: [artifacts/SWHM-S-0020/SWHM-T-0225/PLAN.md]
downstream: [artifacts/SWHM-S-0020/SWHM-T-0226/PLAN.md]
---

# Summary — SWHM-T-0225: Email generation — subject and body per notification kind

## What changed

Added `buildMessage(input)`, a pure function turning a queued notification's kind, order id,
status and resolved recipient into `{ to, subject, body }`. One function with a per-kind lookup
table for subject and body wording (design.md S5 — no template engine, no template files). No
database read, no I/O; `to` is passed in already decided rather than derived from `recipient`, so
address-fallback logic stays with the dispatcher (SWHM-T-0226).

## Files

- `notifications/types.ts` — added `MailMessage` and `MessageInput` (additive only; `NotificationKind`/`NotificationStatus`/`NotificationRecipient` from SWHM-T-0224 unchanged).
- `notifications/message.ts` — `buildMessage(input): MailMessage`, per-kind subject/body tables, name-joining helper for the no-name/given-only/family-only cases.
- `notifications/message.test.ts` — 9 cases: the three facts per kind, subject distinctness, `to` pass-through, the three name-presence cases, purity (plain object literals, no fixture).

## AC coverage

- AC-1 (body includes order ID, customer name, status) — MSG-01/02/03, one per kind.
- AC-2 (`to`/subject/body for APPROVAL, DENIAL, COMPLETION; subjects differ) — MSG-01..05.
- AC-3 (no given/family name: still names order id and status, no empty/placeholder fragment) — MSG-06/07/08.
- AC-4 (no database read, no I/O) — MSG-09 (plain object literals, no fixture) and by construction: `message.ts` imports nothing from `db/` or any transport.

## Verification

```
$ bun run verify
lint: clean
typecheck: clean
test: 843 passed (843), 122 files
```

`bun run test:e2e` failed its preflight in this container (no Chromium installed) — the documented
AGENTS.md fallback for implementation containers; not retried. Full red→green detail is in
`tdd-test-result.md` (`TDD-RESULT: 843 passed, 0 failed`).

## Notes

No design reference: design.md § Design references confirms the idea carries no design blocks and
this capability has no screen.
