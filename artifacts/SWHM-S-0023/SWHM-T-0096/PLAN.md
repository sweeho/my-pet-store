---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0023
ticket: SWHM-T-0096
branch: vortex/sprint/swhm-s-0023-8ac9cbb9
upstream: [openspec/changes/swhm-s-0023-bugfix-swhm-t-0096-inspector/design.md]
---

# PLAN — SWHM-T-0096: inspector teardown left data behind, ledger empty

Read `openspec/changes/swhm-s-0023-bugfix-swhm-t-0096-inspector/design.md` first. Findings F1–F5 hold the verification. D1–D3 hold the disposition, and D4 holds the fix the platform's owners should make.

## Objective

**No change lands in this repository.** This plan records the verified root cause and why the fix cannot be made here, so the owner of the Vortex inspection platform starts from a finished diagnosis.

## Root cause (summary; detail in design.md § Findings)

- D2 of the report (empty ledger) is not a lost write on a failure path. The leftover data was created by submitting the storefront's sign-up and profile forms in the browser (F2). That path goes through no staging tool, and the ledger records nothing else (F3). The project has never had a ledger row, `6b614cd3` included (F1).
- D1 of the report (leftover data) lived in the database of the Projector preview at `172.18.0.30:5173`. That host is now unreachable and its build has been superseded (F4). Nothing in this repository runs, stages or tears down an inspection.
- The predicted harm, wrong findings caused by leftovers, did not happen in any of the four runs (F5).

## Steps

1. The ticket is refined with this diagnosis and deferred with the owning platform component named (design.md D1). Planning does this at planning time rather than spending a dispatch on work that would end blocked, following change `swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02` D7.
2. If the ticket is reopened against the platform repository, the work items are design.md D4 (1)–(3).

## File/module ownership

None. This ticket modifies no file in this repository.

## Definition of Done

This ticket is **deferred**, not fixed. AC-1 and AC-2 are met by the deferral record itself: the ticket's comment and blocker reason, and design.md. AC-3 describes platform behaviour that no commit here can produce, and stays open for the platform's owners.
