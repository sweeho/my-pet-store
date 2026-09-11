---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0054
idea: SWHM-I-0004
branch: vortex/feat/SWHM-T-0054-item-search-service-78bf03a2
upstream: [artifacts/SWHM-S-0004/SWHM-T-0054/PLAN.md]
downstream: []
---

# TDD result — SWHM-T-0054: Item search service

## Test cases

All in `catalog/search.test.ts`.

| #         | Case                                                                                                      | AC                  |
| --------- | --------------------------------------------------------------------------------------------------------- | ------------------- |
| TK-01     | `tokenize` splits on single spaces                                                                        | AC-5                |
| TK-02     | runs of spaces, tabs and newlines behave as one separator                                                 | AC-5                |
| TK-03     | an empty query yields no keywords                                                                         | AC-5                |
| TK-04     | a whitespace-only query yields no keywords                                                                | AC-5                |
| TK-05     | leading/trailing whitespace does not produce empty tokens                                                 | AC-5                |
| AC-1/AC-7 | AND across keywords — only the item matching both `large` and `african` survives                          | AC-1, AC-7          |
| AC-7 (2)  | an item matching one keyword (`parrot`) but not another (`african`) is absent from the two-keyword result | AC-7                |
| AC-3      | single keyword `parrot` matches via item name (two items), not the unrelated ones                         | AC-3                |
| —         | matches via product name alone (`macaw`, present only in the product name)                                | AC-1 field coverage |
| —         | matches via category id alone (`exotic`, present only in the catid)                                       | AC-1 field coverage |
| —         | matches via item description alone (`loyal`)                                                              | AC-1 field coverage |
| AC-6      | matching is case-insensitive (`PARROT` vs `parrot`)                                                       | AC-6                |
| AC-6      | matching is partial (`rrot` matches mid-word)                                                             | AC-6                |
| AC-5      | an empty query returns `EMPTY_PAGE`, not the catalogue                                                    | AC-5                |
| AC-5      | a whitespace-only query returns `EMPTY_PAGE`                                                              | AC-5                |
| —         | a query with no matches returns an empty (not error) page                                                 | robustness          |
| AC-2      | first page of a 30-item match set: 25 objects, `hasNext=true`                                             | AC-2                |
| AC-2      | second page: remaining 5 objects, `hasNext=false`                                                         | AC-2                |

## Red run

`bun --bun vitest run catalog/search.test.ts` before `catalog/search.ts` existed:

```
FAIL  |server| catalog/search.test.ts [ catalog/search.test.ts ]
Error: Cannot find module './search' imported from /workspace/repo/catalog/search.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun --bun vitest run catalog/search.test.ts` after implementing `catalog/search.ts`:

```
Test Files  1 passed (1)
     Tests  18 passed (18)
```

Full pre-commit gate, `bun run verify` (lint + typecheck + full unit suite — `verify:full`'s
E2E tier could not run: this container has no Chromium installed, the same condition
`AGENTS.md`'s "Notes from previous agents" records for this sprint; E2E runs in CI and at
INTEGRATION_QA):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
Test Files  36 passed (36)
     Tests  200 passed (200)
```

TDD-RESULT: 200 passed, 0 failed
