---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0020
idea: SWHM-I-0012
branch: vortex/sprint/swhm-s-0020-2eb89d94
upstream: [artifacts/SWHM-S-0020/qa-test-report.md]
---

# Release notes — SWHM-S-0020

## Added

- The store now tells a customer what became of their order. When an order is approved, denied, or
  finished, a message is prepared for that customer carrying the order's identifier, their name and
  the order's status, and each outcome reads differently from the other two. (SWHM-T-0224,
  SWHM-T-0225, SWHM-T-0226)
- The address a customer is written to comes from their account, taken at the moment the message is
  sent — so a customer who has since changed their email is written to at the new one. Where the
  account holds no address, the address the order was placed with is used instead. (SWHM-T-0224,
  SWHM-T-0226)
- Every notification now ends in a recorded state: sent with a timestamp, failed with a reason, or
  undeliverable because there was nowhere to write to. Nothing is retried, and a customer with no
  address on file is recorded as unreachable rather than repeatedly attempted. (SWHM-T-0226)
- A mail transport boundary. The store decides what to say and to whom, and hands the message to a
  transport that is chosen by injection; the default records the message rather than delivering it.
  (SWHM-T-0226)

## Changed

- Deciding an order and finishing one are both unaffected by what happens to the notification they
  owe. The status is committed first and the message is handled afterwards, so a transport that
  fails outright leaves the order's status exactly as the decision set it and the request that
  triggered it still succeeds. (SWHM-T-0226)

## Upgrade notes

**One database migration** — `drizzle/0013_curly_the_santerians.sql` adds three columns to the
existing `notifications` table (a status defaulting to `QUEUED`, a sent timestamp, a failure
reason). It is additive; rows written before this release read as still queued and will be picked
up by the next drain pass on the order they belong to.

No configuration change, no new dependency, no feature flag, and no change to any request or
response shape.

**Nothing leaves the application yet.** No mail provider is integrated and no credentials are held
— the default transport records what would have been sent. A customer is told what happened in
every sense except the one that reaches them; choosing a provider is an open product decision
(`PRODUCT.md` § Not yet decided).

## Not included

- **No message when an order is placed.** The idea listed one, the specification's requirements did
  not, and the two were left to disagree rather than one being edited to match the other. Whether
  placement is worth a message is tracked as SWHM-T-0228.
- **No screen shows a failed or undeliverable notification.** Both states are recorded with a
  reason; nothing surfaces them to the person running the store. Recorded as open in `PRODUCT.md`.
- **No retries, no other channel, and nothing reads a reply.** Email only, at most once.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0020/qa-test-report.md` (PASS; unit 858/858,
browser E2E 45/45 with no skips, no defects found).

## Compliance / Control Evidence

| Control                        | Evidence                                            | Location                                  | Status    | Exception |
| ------------------------------ | --------------------------------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded      | this file                                           | `artifacts/SWHM-S-0020/release-notes.md`  | Satisfied | —         |
| Release verified before land   | QA PASS verdict, six scenario verdicts              | `artifacts/SWHM-S-0020/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated | `## Upgrade notes` and `## Not included` above      | `artifacts/SWHM-S-0020/release-notes.md`  | Satisfied | —         |
| Data migration communicated    | Migration named, additive, pre-existing rows stated | `## Upgrade notes` above                  | Satisfied | —         |
