---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0012
idea: SWHM-I-0006
branch: vortex/sprint/swhm-s-0012-04c8d46e
upstream: [artifacts/SWHM-S-0012/SPRINT-PLAN.md, artifacts/SWHM-S-0012/qa-test-report.md]
downstream: [artifacts/SWHM-S-0012/release-notes.md]
---

# Sprint summary — SWHM-S-0012

Goal: SWHM-I-0006 — Administrative Operations & Management. Change: `openspec/changes/swhm-i-0006-administrative-operations-ma/`. Executed 2026-09-15 to 2026-09-16.

## Tickets

| Ticket      | Type  | Title                                               | Outcome                       |
| ----------- | ----- | --------------------------------------------------- | ----------------------------- |
| SWHM-T-0109 | TASK  | Sprint plan — SWHM-S-0012                           | DONE                          |
| SWHM-T-0110 | EPIC  | Administrative Operations & Management              | DONE (rollup)                 |
| SWHM-T-0111 | STORY | Administrator identity, access and shell            | DONE (rollup)                 |
| SWHM-T-0112 | STORY | Order visibility and status management              | DONE (rollup)                 |
| SWHM-T-0113 | STORY | Sales reporting by category                         | DONE (rollup)                 |
| SWHM-T-0114 | TASK  | Admin authentication and role-based access          | DONE — merged `1a5c162` (#70) |
| SWHM-T-0115 | TASK  | Admin home page and shell                           | DONE — merged `1573964` (#72) |
| SWHM-T-0116 | TASK  | Session invalidation and logout                     | DONE — merged `e2ab7b4` (#73) |
| SWHM-T-0117 | TASK  | Admin API module and shared request guard           | DONE — merged `8febf42` (#71) |
| SWHM-T-0118 | TASK  | Order tables and retrieval by status                | DONE — merged `606abda` (#74) |
| SWHM-T-0119 | TASK  | Batch order status update                           | DONE — merged `7a24daa` (#75) |
| SWHM-T-0120 | TASK  | Revenue reporting by category                       | DONE — merged `7bb7b20` (#78) |
| SWHM-T-0121 | TASK  | Order count reporting by category                   | DONE — merged `2b1d94c` (#79) |
| SWHM-T-0122 | TASK  | Orders View — read-only orders table                | DONE — merged `55134df` (#76) |
| SWHM-T-0123 | TASK  | Admin sign-in error page and access-denial coverage | DONE — merged `c7f3885` (#77) |
| SWHM-T-0126 | TASK  | Integration QA report — SWHM-S-0012                 | DONE — merged `55fe760` (#80) |
| SWHM-T-0127 | TASK  | Sprint close bundle — SWHM-S-0012                   | IN_PROGRESS — this bundle     |

All ten implementation tickets committed to the sprint reached DONE. Per-ticket detail is in each ticket's `artifacts/SWHM-S-0012/<KEY>/summary.md` and `tdd-test-result.md`.

## What shipped

The store's operator now has a surface in the product: an administrator identity, a protected admin area, the order queue, batch status movement, and two category reports. The sprint goal is met.

- **Identity and access** — `auth_users` gained a nullable `role` column (migration `drizzle/0005_mighty_gertrude_yorkes.sql`), and `evaluateAccess()` grew from a boolean to a two-dimensional verdict that distinguishes "not signed on" from "signed on without the role". The admin subtree joined `auth/protected-resources.ts` with `/admin/signon` and `/admin/signon-failed` carved out as public entry points. Both existing enforcement points — `middleware/signon.ts` and `routes/api/signon/check.get.ts` — answer 403 on the role-missing case rather than redirecting, and `RequireAdmin` is the client-side half of the same decision. (SWHM-T-0114)
- **Server module** — `admin/` at the repo root, sibling to `auth/`, `account/` and `catalog/`, carrying `requireAdmin` as one shared guard every `/api/admin/**` route calls first. Registered in Vitest's `server` project in both directions. (SWHM-T-0117)
- **Orders** — `orders` and `order_line_item` (migration `drizzle/0006_exotic_cannonball.sql`), seeded with six demo orders across four statuses and a 60-day spread, read through `GET /api/admin/orders?status=…` and moved in one `db.transaction` through `POST /api/admin/orders/status`. (SWHM-T-0118, SWHM-T-0119)
- **Reports** — revenue and order count by category, both summing from `order_line_item.unit_price`/`quantity` over a half-open `[start, endExclusive)` date range, grouping by category with no filter and by item within one. (SWHM-T-0120, SWHM-T-0121)
- **Screens** — `/admin/signon`, `/admin`, `/admin/orders`, `/admin/reports/revenue`, `/admin/reports/orders` and `/admin/signon-failed`, plus a shared `ui/table.tsx` primitive and the presentational `ReportBars`. (SWHM-T-0115, SWHM-T-0122, SWHM-T-0123)
- **Logout** — `invalidateSession()` and `POST /api/signon/logout`, which deletes the session row and clears the cookie. (SWHM-T-0116)

## Divergence from plan

No backlog divergence: all ten planned tickets shipped, none was added, split or dropped, and the dependency order in `SPRINT-PLAN.md` held.

The one substantive category of divergence is against the extracted legacy specification rather than against the plan, and it was decided before execution: fifteen discrepancies (S1–S15) are recorded in the change's `design.md`, each naming the mechanism the legacy system used and the observable behaviour that replaces it here. The four that changed what a user sees are the Java Web Start rich client (now in-SPA navigation to `/admin/orders`), the `AsyncSender` EJB and its queue (now one transaction), XML request/response envelopes (now JSON), and `j_security_check` (now the existing `POST /api/signon`). QA verified the replacement behaviour in each case and marked the two untestable legacy mechanisms as such with the reason — see `qa-test-report.md` § Scenario verdicts.

## Verification

PASS, unconditional. `qa-test-report.md` carries the verdict and the per-scenario detail: 23 delta-spec scenarios, 21 direct passes and 2 `not-testable` against pre-approved resolutions (S2, S5) whose replacement behaviour passes; 431/431 unit tests and 28/28 Playwright tests green on the integrated branch. `integration-defects-resolution.md` records zero defects found.

## Defects Raised

None. No DEFECT ticket was created during the sprint window (`a2a_list_tickets(type="defect", created_since="2026-09-15T23:00:00Z")` returned empty), and integration QA found nothing requiring fix-in-place or escalation.

## Retrospective

**Went well**

- **Deciding the legacy-mechanism translations at planning time, not at execution time.** Four of this capability's extracted specifications assert mechanisms that cannot exist in this repository — a JNLP launch, a message-queue EJB, XML envelopes, a container-managed login endpoint. Recording each resolution as S1–S15 in `design.md` before any ticket dispatched meant ten implementation agents wrote AC-coverage notes citing a decision instead of ten agents each escalating the same question. Zero mid-sprint plan revisions were requested.
- **The shared guard was its own ticket, ahead of its first caller.** SWHM-T-0117 shipped `requireAdmin` with no route to use it, and every one of the four later admin routes called it first rather than repeating the session/role check inline. QA confirmed no route duplicates the check.
- **The two reports were sequenced rather than parallelised.** SWHM-T-0121 reused `parseReportDates`, `DateRange`, `Report`/`ReportRow` and `ReportBars` unchanged and added only a second aggregate and a formatter — the second report cost a fraction of the first because the first had already landed.

**Could improve**

- **Three tickets extended `admin/types.ts`, and the dependency graph did not say so.** SWHM-T-0117 created it, SWHM-T-0118 and SWHM-T-0120 both added to it, but SWHM-T-0120 carried no `depends_on` at all. The collision was averted by prose in the PLAN ("add, do not restructure") and by the fact that merges happened to run strictly sequentially — not by the graph, which is what the no-overlapping-ownership rule is supposed to enforce. `src/components/index.ts` was touched by three tickets on the same terms. A shared type or barrel file that several tickets append to should either get an explicit dependency chain or be seeded whole by the first ticket.
- **Every implementation ticket ran a reduced gate.** All ten ran `bun run verify` rather than `verify:full`, because Chromium is genuinely absent from implementation containers — the standing condition already recorded in `.vortex/agents-generated.md`. The browser tier therefore ran for the first time at integration QA, on ten tickets at once; it passed, but a browser-tier regression would have surfaced with ten candidate causes rather than one. CI's per-branch runs are the mitigation and they held.
- **PRODUCT.md and ARCHITECTURE.md asserted this capability's shape before it was built.** Both were written to target state at planning (SWHM-T-0109) and needed no correction at close, which is the outcome that was hoped for — but it is worth noticing that the safety here was that delivery matched the plan, not that anything checked. Only DESIGN.md needed an update at close, for the two shared patterns (`ui/table.tsx`, `ReportBars`) the planning doc could not have named in advance.

## Compliance / Control Evidence

| Control                                   | Evidence                                                                | Location                                                                        | Status         | Exception                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| Change planned and specified before build | OpenSpec change: proposal, design, delta specs, tagged tasks            | `openspec/changes/swhm-i-0006-administrative-operations-ma/`                    | Satisfied      | —                                                                                    |
| Change verified before release            | QA report, unconditional PASS verdict                                   | `artifacts/SWHM-S-0012/qa-test-report.md`                                       | Satisfied      | —                                                                                    |
| Tests executed                            | 431/431 unit, 28/28 E2E on the integrated branch                        | `artifacts/SWHM-S-0012/integration-test-result.md`                              | Satisfied      | —                                                                                    |
| Per-ticket test evidence                  | `TDD-RESULT` markers, red→green proofs                                  | `artifacts/SWHM-S-0012/<TICKET-KEY>/tdd-test-result.md` (10 tickets)            | Satisfied      | Ticket-level runs excluded the browser tier; see Retrospective                       |
| Defects dispositioned                     | 0 found at integration QA, 0 raised during the sprint                   | `artifacts/SWHM-S-0012/integration-defects-resolution.md`                       | Satisfied      | —                                                                                    |
| Change reviewed before merge              | 11 ticket PRs (#70–#80), each squash-merged to the sprint branch        | git history, `dev..vortex/sprint/swhm-s-0012-04c8d46e`                          | Satisfied      | —                                                                                    |
| Schema changes migrated and committed     | 2 generated migrations                                                  | `drizzle/0005_mighty_gertrude_yorkes.sql`, `drizzle/0006_exotic_cannonball.sql` | Satisfied      | —                                                                                    |
| Privileged access restricted              | Role-gated admin subtree; anonymous and non-admin denial covered by E2E | `auth/protected-resources.ts`, `admin/request.ts`, `e2e/admin.spec.ts`          | Satisfied      | Administrator account is seeded development data — see release notes § Upgrade notes |
| Administrative actions attributable       | —                                                                       | —                                                                               | Not Applicable | No audit trail; PRODUCT.md § Scope declares this a standing non-goal                 |
