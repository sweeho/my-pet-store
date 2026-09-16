---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0016
idea: SWHM-I-0009
branch: vortex/sprint/swhm-s-0016-da83b0d8
upstream: [artifacts/SWHM-S-0016/SPRINT-PLAN.md, artifacts/SWHM-S-0016/qa-test-report.md]
---

# Sprint summary — SWHM-S-0016

## Tickets

| Ticket      | Type  | Title                                                                     | Outcome                                                                                                                                                            |
| ----------- | ----- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SWHM-T-0172 | TASK  | Sprint plan — SWHM-S-0016                                                 | DONE — change `swhm-i-0009-payment-credit-card-processi` authored, three root docs updated on their own triggers, four design blocks exported (`0267828`)          |
| SWHM-T-0173 | EPIC  | Payment & Credit Card Processing                                          | DONE — closed by rollup                                                                                                                                            |
| SWHM-T-0174 | STORY | A shopper's card is validated and authorized before their order is placed | DONE — closed by rollup                                                                                                                                            |
| SWHM-T-0175 | TASK  | Payment module, card types and storage path                               | DONE — `payment/types.ts`, storage-path proof, Vitest/tsconfig registration (`4977412`, PR #111)                                                                   |
| SWHM-T-0176 | TASK  | Card validation — expiry and accepted card types                          | DONE — `payment/expiry.ts`, `payment/validation.ts` (`ed05b87`, PR #112)                                                                                           |
| SWHM-T-0177 | TASK  | Authorization boundary, payment screen and checkout sequencing            | DONE — `payment/processor.ts`, `payment/authorize.ts`, `routes/api/payment/authorize.post.ts`, `src/pages/payment.tsx`, checkout re-sequenced (`c395674`, PR #113) |
| SWHM-T-0178 | TASK  | Browser coverage for the payment journey                                  | DONE — `e2e/payment.spec.ts`, 4 specs (`1c55ffa`, PR #114)                                                                                                         |
| SWHM-T-0179 | TASK  | Integration QA report — SWHM-S-0016                                       | DONE — PASS, no defect found (`d9c5327`, PR #115)                                                                                                                  |
| SWHM-T-0180 | TASK  | Sprint close bundle — SWHM-S-0016                                         | This artifact                                                                                                                                                      |

## What shipped

The sprint goal — SWHM-I-0009, payment and credit card processing — is met. A shopper's card is now checked before an order exists: `payment/validation.ts` rejects a card type outside the store's own `CARD_TYPES`, `payment/expiry.ts` distinguishes a missing expiry from an expired one (the three-outcome split that `account/card.ts`'s `01/2010` fallback made impossible), and `payment/authorize.ts` sends an authorization across the `PaymentProcessor` boundary only once both pass. `src/pages/payment.tsx` renders that journey from the sprint's mockups, and `src/pages/enter-order-information.tsx` now navigates there instead of posting to `/api/order` directly, so `POST /api/order` runs only after authorization approves.

Nothing about the stored card changed: no schema change, no migration, no card number persisted, nothing encrypted. The capability is new code in a new `payment/` directory plus one route and one screen; `db/schema.ts`, `account/card.ts`, `account/customer.ts`, `account/vocabulary.ts`, `order/order.ts` and `routes/api/order/index.post.ts` are all untouched.

## Divergence from plan

The four tickets shipped exactly as planned, in the planned order, with no ticket added, dropped or re-scoped. The divergences are all between the **adopted specification** and this repository, not between the plan and delivery — the extracted spec describes a legacy Java EE system, and ten discrepancies (S1–S10) are recorded in `openspec/changes/swhm-i-0009-payment-credit-card-processi/design.md § Spec discrepancies` rather than resolved by editing the delta spec, so the spec of record keeps its extracted wording. The four that changed what was built:

- **S1/S2** — the spec requires storing the card number and encrypting it. `ARCHITECTURE.md § Key Decisions` already forbids persisting one, so "stored for authorization" is satisfied by type, expiry and last four, nothing is encrypted, and the mockup's "Encrypted at rest" pill is not built.
- **S4** — the spec names Visa/MasterCard/American Express. The store's accepted types stay `Java(TM) Card`, `Duke Express`, `Meow Card`, fixed by the archived `openspec/specs/account-management/spec.md`; adopting the delta's brand names would put two specs of record in disagreement about one fact.
- **S5** — the change's own `design.md` says no screens were extracted, while the idea carries four design blocks including validation, in-flight and declined states. The designs won and the screen was built from them.
- **S8** — SWHM-T-0178 is a testing-only ticket, which this team normally folds into the implementing ticket. It is separate only because the adopted-specification dispatch fixes one ticket per task group; it adds the browser tier alone.

Two smaller reconciliations were made during delivery and are recorded on their tickets: SWHM-T-0177 read the mockup's "State C" as the expired-card refusal it actually renders rather than the generic decline `design.md` describes it as, and removed test EOI-16 because an empty-cart refusal can no longer occur at the order form — it moved to the payment screen with `POST /api/order` and is covered there as PAY-10.

## Verification

PASS. See `artifacts/SWHM-S-0016/qa-test-report.md` — all five delta-spec scenarios verified pass, `bun run verify` green (619 unit tests across 98 files), full Playwright suite green (41/41, `integration-test-result.md`). No defect was found at integration and nothing was fixed in place (`integration-defects-resolution.md`).

## Defects Raised

None. No DEFECT ticket was created during the sprint window by any role — confirmed against `a2a_list_tickets(type="defect", created_since="2026-09-16T19:55:00Z")`, which returned an empty list.

## Retrospective

**Went well**

- Chaining the four tickets T1→T2→T3→T4 on strictly non-overlapping ownership maps produced an integration with zero defects. Each ticket's `PLAN.md` fixed the types the next one coded against, so SWHM-T-0177 built the authorization path against `checkExpiry`/`isAcceptedCardType` signatures that did not move, and the unit count QA measured (619) was the same one SWHM-T-0177 and SWHM-T-0178 had each reported.
- Recording the extracted spec's ten discrepancies in `design.md` instead of editing the delta spec kept exactly one spec of record per fact. The card-number and card-type deviations are the ones that would have been expensive to get wrong, and both resolved by pointing at a decision or a spec that already existed rather than by making a new call.
- Reading the design blocks before decomposition caught S5. The change's own `design.md` asserts no screen was extracted; had that gone unchallenged the sprint would have shipped an API with no UI, and the three validation/in-flight/declined states would have been invented at implementation time.

**Could improve**

- The implementation containers still ship no Chromium, so all four tickets fell back from `verify:full` to `bun run verify` and no browser assertion was observed until CI and integration QA. This is the fourth sprint recording it (`.vortex/agents-generated.md`); it is a container image gap, not an agent error, and it means `e2e/payment.spec.ts` was first executed by someone other than the agent that wrote it.
- `auth/protected-resources.ts` prefix-matches only entries carrying `requiresRole`, so the `/api/payment` entry exact-matches that literal path and does not cover `/api/payment/authorize`. The 401 is enforced by the route's own session check, which is tested (AP-01) — the registry entry is decorative for nested paths. Pre-existing, flagged by SWHM-T-0177 rather than silently worked around; raised as SWHM-T-0181 for a future sprint.
- The sprint's only expired-card path reachable through the real UI is a past month in the current year, because the year select never offers a past year. `e2e/payment.spec.ts` throws deliberately if the suite ever runs in January. A time-dependent test that fails one month a year is a trap for whoever meets it first.

## Compliance / Control Evidence

| Control / policy               | Evidence produced                                                                                                            | Location                                                       | Status    | Exception                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| Change specified before build  | OpenSpec change — proposal, design, delta spec, tagged task list                                                             | `openspec/changes/swhm-i-0009-payment-credit-card-processi/`   | Satisfied | —                                                                                                                         |
| Change verified before release | QA report, PASS verdict on all five scenarios                                                                                | `artifacts/SWHM-S-0016/qa-test-report.md`                      | Satisfied | —                                                                                                                         |
| Tests executed                 | `bun run verify` 619/619, Playwright 41/41 with commands and output                                                          | `artifacts/SWHM-S-0016/integration-test-result.md`             | Satisfied | —                                                                                                                         |
| Per-ticket test evidence       | TDD result artifacts, one per implementing ticket                                                                            | `artifacts/SWHM-S-0016/SWHM-T-017{5,6,7,8}/tdd-test-result.md` | Satisfied | —                                                                                                                         |
| Changes reviewed before merge  | Ticket mini-PRs #111–#115, each CI-gated on the sprint branch                                                                | PRs #111, #112, #113, #114, #115                               | Satisfied | —                                                                                                                         |
| Defects dispositioned          | None found at integration; none raised during the sprint                                                                     | `artifacts/SWHM-S-0016/integration-defects-resolution.md`      | Satisfied | —                                                                                                                         |
| Cardholder data minimised      | No card number column, no card number persisted; type, expiry and last four only                                             | `db/schema.ts` (unchanged), `ARCHITECTURE.md § Key Decisions`  | Satisfied | Extracted spec S1/S2 asks for a stored, encrypted number; deliberately not implemented — `design.md § Spec discrepancies` |
| External boundary controlled   | Processor reached through an injected interface, default a local stub; no network call, no credentials, no PCI scope entered | `payment/processor.ts`, `ARCHITECTURE.md § Integration points` | Satisfied | No live processor integrated and no settlement — `release-notes.md § Not included`                                        |
| Standing documentation current | PRODUCT.md, ARCHITECTURE.md, DESIGN.md updated on their own triggers at planning                                             | `0267828`                                                      | Satisfied | —                                                                                                                         |
