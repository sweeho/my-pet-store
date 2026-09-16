# Design — SWHM-S-0015

## Context

Both committed defects report one fault at one line, and that line already carries the fix on this
branch. `proposal.md § Why` sets out the verification in full: the current code, the single commit
that created it, the three tiers of assertion that cover it, and the `RequireSignOn` seam that could
have defeated it and does not. This document records the decisions that follow from that finding,
not the finding itself.

## Decisions

### D1 — Change no production code

Neither defect gets a corrective diff. The behaviour both describe is implemented, and the
assertions both ask for exist and pass: `bun run verify` on this branch is green across 91 files and
577 tests, including `src/pages/enter-order-information.test.tsx` (16 tests) whose AC2 assertion is
the exact one SWHM-T-0165 asks to be written.

The alternative — edit the success path so each ticket has a diff to show — would mean rewriting
code that is already correct for the sole purpose of closing a ticket. That is how a fixed defect
becomes a new one. A defect whose fault is gone closes as resolved; the deliverable is the evidence
that it is gone and the spec change that keeps it gone.

The browser tier cannot be observed in the planning container: Chromium is genuinely absent
(`scripts/ensure-playwright-browser.mjs` fails fast, as recorded in `.vortex/agents-generated.md`
for six consecutive tickets in SWHM-S-0002), so `e2e/order.spec.ts` was read rather than run here.
It was then observed where a real browser exists — **CI run `35138625151` on this sprint branch,
green, 37 of 37 E2E tests passed**, including `e2e/order.spec.ts:126` "places an order from a
populated cart …, confirms it with an order id and the shopper's email, empties the cart, and gives
a second order a higher id". That is SWHM-T-0166's acceptance criteria observed end to end in a
browser against this branch, and it settles the static finding rather than merely supporting it.

The file-ownership maps on both tickets stay non-empty anyway. They cost nothing when no diff is
needed, and they bound a corrective change to the one file the reports implicate if a later run
contradicts this one, rather than leaving the assigned agent to decide its own blast radius
mid-run.

### D2 — Specify the handoff by MODIFYING the existing requirement, not adding one

_Order confirmation screen displays order ID and email_ already exists in
`openspec/specs/order-placement/spec.md:137`. Its three scenarios all open on a screen that has
already been reached with an order — "GIVEN a successfully placed order with ID 1005", "WHEN the
confirmation screen is displayed" — so a submission that navigated to that screen carrying nothing
satisfied every one of them. The requirement was not wrong; its scenarios were not sufficient to
catch the defect, which is the textbook case for `MODIFIED` with an added regression scenario rather
than `ADDED`.

`ADDED` was rejected for the reason it is usually rejected: it would leave the archived spec of
record with two near-duplicate requirements about the same screen, and nobody reading
`openspec/specs/order-placement/` a sprint later could tell which is current. The `MODIFIED` block
reproduces all three existing scenarios verbatim, because a `MODIFIED` block replaces its
requirement wholesale and a dropped scenario is a silently deleted oracle.

### D3 — Three regression scenarios, each already asserted

Each new scenario is the oracle for an assertion that exists today, so the delta codifies observed
behaviour instead of proposing it:

| Scenario                                                                                | Asserted by                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Submitting a valid order carries that placement's identifier to the confirmation screen | `src/pages/enter-order-information.test.tsx:222-231` (caller passes the parsed result as state); `e2e/order.spec.ts:134-143` (browser journey shows the group and the email) |
| A second order's confirmation shows that order's own identifier                         | `e2e/order.spec.ts:147-159`; `src/pages/order-completed.test.tsx` OC-03 (a different identifier renders, not a hard-coded 1005)                                              |
| A confirmation screen reached without a placement result shows no identifier            | `src/pages/order-completed.test.tsx` OC-05, OC-08                                                                                                                            |

The third is the one worth stating explicitly even though it was never broken. The screen's
behaviour with no state is to omit the block silently — no error, no fallback fetch — and that
silence is precisely why the original fault reached conditional acceptance rather than failing
loudly at the first tier that ran. Writing the silent case down as intended behaviour is what makes
the loud case (the handoff scenario above it) the thing that has to hold.

### D4 — Split the criteria by tier, and order the duplicate behind the primary

SWHM-T-0165 carries the screen-tier criteria and SWHM-T-0166 the browser-tier ones, drawn from the
same scenarios, so neither ticket's verdict depends on evidence the other is responsible for.
SWHM-T-0166 `depends_on` SWHM-T-0165 — its own report already asks for this, and without it the
dispatcher can start the duplicate first and the two agents confirm the same line concurrently.

No promotion to `ARCHITECTURE.md § Key Decisions`: every decision here is about how this sprint
handles two reports of one already-fixed fault, and none of it constrains work beyond this change.

## Risks

- ~~The browser tier contradicts the static finding.~~ **Closed** by CI run `35138625151` on this
  branch: the order journey passes in a real Chromium. Had it gone the other way the cause would
  have been in the one file both reports implicate, which both tickets already own; nothing about
  the delta would have changed, since a regression scenario is correct whether it currently passes
  or fails.
- **An assigned agent reads "no code change expected" as "nothing to do" and closes without
  checking.** Both `PLAN.md` files state the criteria as outcomes to be observed on this branch, and
  every criterion names the assertion or the visible element that carries it, so confirming one is a
  concrete act rather than a judgement call.
