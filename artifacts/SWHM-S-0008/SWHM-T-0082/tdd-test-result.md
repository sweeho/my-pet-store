---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0082
branch: vortex/fix/SWHM-T-0082-bootstrap-template-scaffold-routes-users-b226c149
upstream: [artifacts/SWHM-S-0008/SWHM-T-0082/PLAN.md]
downstream: [artifacts/SWHM-S-0008/qa-test-report.md]
---

# TDD result — SWHM-T-0082

## Test cases

| Test                                                                                                    | Covers     | Intent                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `e2e/legacy-routes.spec.ts › /users renders the not-found screen, not the boilerplate scaffold`         | AC-1, AC-2 | `/users` falls through to the not-found screen instead of the placeholder list                 |
| `e2e/legacy-routes.spec.ts › /users/1 renders the not-found screen, not the boilerplate scaffold`       | AC-1, AC-2 | `/users/1` falls through to the not-found screen instead of the placeholder detail page        |
| `e2e/legacy-routes.spec.ts › /users/profile renders the not-found screen, not the boilerplate scaffold` | AC-1, AC-2 | `/users/profile` falls through to the not-found screen instead of the placeholder profile page |
| `e2e/legacy-routes.spec.ts › GET /api/users still answers with rows from the database`                  | AC-3       | the database-backed API the pages share a name with is unaffected by deleting the pages        |

## Red run

`bun run test:e2e -- e2e/legacy-routes.spec.ts` — genuinely unobtainable in this container, both
before and after the fix: this implementation container ships no Chromium, which is a documented,
established limitation (`AGENTS.md` § Notes from previous agents, hit by six prior tickets in this
sprint's predecessor and again by SWHM-T-0056). The command was actually run, against the pre-fix
code, and failed its preflight rather than executing the spec:

```
$ bun run test:e2e -- e2e/legacy-routes.spec.ts
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).

E2E tests need a real browser. Either:
  - install it:  bun x playwright install chromium
  - or skip E2E here — in the agent workflow, E2E runs in the QA phase
    (browser-equipped container) and in CI, not in engineer containers.
    Use `bun run verify` (lint + typecheck + test) instead.
error: script "pretest:e2e" exited with code 1
```

Per that guidance, the browser tier was not retried and no browser was installed. There is no
`src/**` unit test that can pin this bug: the routes under test come from `~react-pages`
(`vite-plugin-pages`'s generated route table), which `vitest.config.ts` deliberately does not wire
up (it mirrors only the React/AutoImport subset of `vite.config.ts` — "Nitro, file-based routing,
and asset plugins are intentionally left out"), so `/users` falling through to the catch-all is only
observable through a real browser hitting the real dev server. `bun run verify` (below) proves the
fix introduced no regression in everything that _can_ run locally; the regression itself is proven
by CI, which has Chromium — see `summary` in the DONE-transition work log for the CI verdict on this
branch.

## Green run

`bun run verify` — this stack's full local gate (lint, typecheck, complete unit/integration suite),
run after the fix (page files deleted, `e2e/legacy-routes.spec.ts` added):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  297 passed (297)
```

Identical file/test counts to the pre-fix baseline run of the same command (55 files, 297 tests) —
expected, since no existing unit/integration test exercised the deleted scaffold pages; deleting
them changed nothing this gate can see. `bun run build` was also run once as an additional check
(not part of the declared `verify` gate, but this ticket removes three file-based routes): it
succeeded, and `.output/server/_routes/api/users.mjs` is still produced, confirming the API route
survived the build unchanged. `bun --bun vitest run routes/api/users` was run in isolation and both
route test files still pass (2 files, 3 tests), byte-identical to their pre-ticket state (`git diff
--stat -- routes/api/users/` is empty).

`e2e/legacy-routes.spec.ts` was not executed locally for the reason given in `## Red run`; CI (which
has Chromium) is the first real execution of it, gating this ticket's transition to `done` via
`a2a_await_ci`.

TDD-RESULT: 297 passed, 0 failed
