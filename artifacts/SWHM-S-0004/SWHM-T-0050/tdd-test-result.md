---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0050
branch: vortex/feat/SWHM-T-0050-catalog-query-composition-layer-c492320b
upstream: [artifacts/SWHM-S-0004/SWHM-T-0050/PLAN.md]
---

# TDD result — SWHM-T-0050

## Test cases

| Test                            | Covers     | Intent                                                                                                          |
| ------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `catalog/query.test.ts › PQ-01` | AC-2, AC-6 | first page (start=0, count=2) of a 5-row fixture: 2 objects, `hasNext=true`                                     |
| `catalog/query.test.ts › PQ-02` | AC-6       | middle page (start=2, count=2): the next 2 objects, `hasNext=true`                                              |
| `catalog/query.test.ts › PQ-03` | AC-6       | final page (start=4, count=2): the 1 remaining object, `hasNext=false`                                          |
| `catalog/query.test.ts › PQ-04` | AC-6       | out-of-range start (start=10): `EMPTY_PAGE`                                                                     |
| `catalog/query.test.ts › PQ-05` | AC-2       | a negative start returns `EMPTY_PAGE` without ever calling `build`                                              |
| `catalog/query.test.ts › PQ-06` | AC-2       | `build` is called exactly once, with `(count+1, start)` — the row read and the `hasNext` read are the same call |
| `catalog/query.test.ts › LJ-01` | AC-4       | `localeJoin` filters to the requested locale's row                                                              |
| `catalog/query.test.ts › LJ-02` | AC-4       | a different locale argument selects a different row                                                             |
| `catalog/query.test.ts › LJ-03` | AC-4       | an unsupported/missing locale matches no row                                                                    |
| `catalog/query.test.ts › SQ-01` | AC-5       | AND across keywords — both keywords must match, on any field                                                    |
| `catalog/query.test.ts › SQ-02` | AC-5       | OR across fields — a keyword found only in the description still matches                                        |
| `catalog/query.test.ts › SQ-03` | AC-5       | matching is case-insensitive                                                                                    |
| `catalog/query.test.ts › SQ-04` | AC-5       | a keyword containing `%` matches literally, not as a wildcard                                                   |
| `catalog/query.test.ts › SQ-05` | AC-5       | a keyword containing `_` matches literally, not as a single-character wildcard                                  |

## Red run

`NODE_ENV=test bun --bun vitest run catalog/query.test.ts` — before `catalog/query.ts` existed (temporarily moved aside to capture a genuine red):

```
 FAIL  |server| catalog/query.test.ts [ catalog/query.test.ts ]
Error: Cannot find module './query' imported from /workspace/repo/catalog/query.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  33 passed (33)
      Tests  168 passed (168)
```

All 33 test files (including the 14 new `catalog/query.test.ts` cases in the 1 new file) pass; zero new failures against baseline (32 files / 154 tests before this ticket).

TDD-RESULT: 168 passed, 0 failed
