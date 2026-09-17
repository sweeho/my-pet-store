---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0022
ticket: SWHM-T-0235
branch: vortex/sprint/swhm-s-0022-75bc2a59
upstream: [openspec/changes/swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02/design.md]
---

# PLAN — SWHM-T-0235: dispatch omits the run's codebase context

Read `openspec/changes/swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02/design.md` § The platform defect first. Every cited line was re-verified against `/app/packages/core/src` (`@vortex/core@7.2.0`) and holds; that section carries the verification and the one finding the original report could not reach.

## Objective

**No change lands in this repository.** This plan exists to record a finished diagnosis and the reason the fix cannot be made here, so that whoever owns the platform repository inherits the investigation rather than repeating it.

## Why it cannot be fixed here

- `/app/packages/core` is an unpacked runtime install: no `.git`, no remote, no CI. An edit there is not committable to this sprint branch, is invisible to the gate, and is discarded when the container is recycled.
- The call site that actually drops the context is not even in that package. `a2a_assign_ticket` only resolves the agent and sets the ticket to `ASSIGNED`; the run is started by `wakeAssignedAgentsActivity`, which lives in the Temporal worker package and is not present in this image. See design.md § The platform defect for how that was established.
- This repository is the My Pet Store product. Nothing it can commit changes how the platform spawns a run.

## What a fix would consist of, for the repository that owns it

Stated as findings for the platform team, not as steps for this sprint:

1. Pass `codebaseId: ticket.codebase_id` explicitly where `wakeAssignedAgentsActivity` calls `dispatchHarnessRun`. `harness-service.ts:369` resolves `args.codebaseId ?? bundle.codebase_id`, and a GLOBAL FSM agent's `bundle.codebase_id` is NULL by design, so the caller is the only source. `agent-heartbeat-orchestrator.ts` § `setIntegratorDispatcher` is the same fix already applied on the integrator path, comment and all.
2. Make the omission loud rather than silent at `agent-tools.ts:153`, where `if (ctx.codebaseId)` drops `VORTEX_A2A_CODEBASE_ID` from the spawned environment without a word.
3. Give `a2aSendMessageTool` the missing-context guard its siblings already have, so a run with no codebase gets a named error instead of `invalid input syntax for type uuid: ""` from Postgres.

## Mitigation available today, needing no code

Dispatch an FSM role through the scheduler's own `backlog_to_assigned` sweep rather than a manual `a2a_assign_ticket`. That is the contrast the original report isolated, and the sweep path was observed working on the same ticket and the same agent type.

## Definition of Done

This ticket is **deferred**, not fixed. Its acceptance criteria are unchanged and remain unmet by design: they describe platform behaviour that no commit in this repository can produce. The disposition and its reason are recorded on the ticket and in design.md D7.
