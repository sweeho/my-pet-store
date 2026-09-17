# SWHM-T-0227 — Verification: the three transitions end to end, and the missing-address case

Change: `swhm-i-0012-customer-notifications-commu` · task group `## 4. Testing`
Read `openspec/changes/swhm-i-0012-customer-notifications-commu/design.md` first, § Phases in particular — this is phase 4, and it is the only ticket in the sprint that exercises the capability as a whole.

## Objective

Prove the three delivery scenarios across the real call paths, not across the modules in isolation. The three tickets before this one each tested their own module with the others stubbed or absent; nothing so far has run a decision through to a sent message.

Requirement verified: **Order notification delivery**, all three scenarios, plus the undeliverable outcome the spec is silent on and the idea settles (design.md S6).

## Steps

1. **Write `notifications/notifications.integration.test.ts`.** It lives in `notifications/` so it runs in the node-environment project and can reach the database (design.md F10). One fixture builder: an account with contact details, an order for it, and an injected transport that records what it was handed.

2. **Approval, end to end.** Seed a `PENDING` order for an account with an email, apply an approval through `applyOrderDecisions` — the path the admin endpoint uses — drain, and assert the transport received one message at the account's address and the row is `SENT`.

3. **Denial, end to end.** The same, with a denial. Assert the message is distinguishable from the approval's, which is what makes the two scenarios separate rather than one scenario run twice.

4. **Completion, end to end.** Seed an `APPROVED` order with stock for every line, run `processOrder`, drain, and assert one `COMPLETION` message at the account's address. This is the transition that did not exist before this sprint, so it is the one with no prior cover anywhere.

5. **The missing-address case.** An account with no email and an order with no `billing_email`: apply a decision, drain, and assert the transport was handed nothing, the row is `UNDELIVERABLE` with a reason, and the order's status is exactly what the decision set. The last assertion is the point of the case — an undeliverable notification must not look like a failed decision.

6. **Drive the real entry points.** Do not write rows into the `notifications` table by hand and call the dispatcher on them: a test that does proves the dispatcher works and proves nothing about whether anything queues. Each case starts at `applyOrderDecisions` or `processOrder`.

7. **No browser-tier spec.** This capability has no screen — the idea puts a user interface out of scope and `a2a_get_idea_design` returns an empty manifest — so there is nothing a browser can observe. Say so in the work log rather than adding an `e2e/` spec that asserts something adjacent.

## File/module ownership

Created: `notifications/notifications.integration.test.ts`.

Nothing else. If a case here cannot be written without changing a module, that is a defect in the module's ticket: raise it rather than editing the module from this ticket, because the three tickets before this one have already merged and their contracts are what this is checking.

## Fixed interface contracts

This ticket consumes the contracts fixed in SWHM-T-0224, SWHM-T-0225 and SWHM-T-0226 and changes none of them. It introduces no interface of its own.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-5. AC-1 to AC-3 are the change's three **Order notification delivery** scenarios, verified here through the real transitions rather than through the dispatcher alone; AC-4 is the undeliverable outcome; AC-5 is the constraint that makes AC-1 to AC-3 mean what they say.
