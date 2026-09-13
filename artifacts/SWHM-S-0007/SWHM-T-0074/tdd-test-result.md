---
ticket: SWHM-T-0074
sprint: SWHM-S-0007
type: tdd-test-result
---

# TDD result — SWHM-T-0074

## Test cases

New tests, all real test code committed alongside the source they cover.

`catalog/availability.test.ts` — locale-independent existence check:

| ID    | Case                   | Expected              |
| ----- | ---------------------- | --------------------- |
| AV-01 | category row exists    | `missing-translation` |
| AV-02 | category id has no row | `not-found`           |
| AV-03 | product row exists     | `missing-translation` |
| AV-04 | product id has no row  | `not-found`           |
| AV-05 | item row exists        | `missing-translation` |
| AV-06 | item id has no row     | `not-found`           |

`routes/api/catalog/categories/[categoryId].get.test.ts` (added CD-03, CD-02 updated):

| ID    | Case                                  | Expected                                                                       |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------ |
| CD-02 | unknown category id, default locale   | 404, `{ error: "Category not found: RT-NOT-A-CATEGORY", reason: "not-found" }` |
| CD-03 | existing category, unsupported locale | 404, `{ error: "Category not found: RT-DOGS", reason: "missing-translation" }` |

`routes/api/catalog/products/[productId].get.test.ts` (added PD-03, PD-02 updated): same shape as CD-02/CD-03 for products.

`routes/api/catalog/items/[itemId].get.test.ts` (added ID-03, ID-02 updated):

| ID    | Case                                                                                        | Expected                                                                         |
| ----- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ID-02 | unknown item id, default locale                                                             | 404, `reason: "not-found"`                                                       |
| ID-03 | known item + unsupported locale **and** unknown item + same unsupported locale, in one test | known → 404 `reason: "missing-translation"`; unknown → 404 `reason: "not-found"` |

ID-03 is the AC-6 case (item that exists but has no zh_CN row vs. an item id that plain
doesn't exist, both queried under the same non-`en_US` locale) reproduced with `RT-`
fixtures, since `db/client.ts` deliberately skips the demo catalog seed under
`VITEST=true` — every route test controls its own rows. The literal seed ids from the
AC (`BIRDS-PARROTS-1`, `NO-SUCH-ITEM`, locale `zh_CN`) were additionally checked by hand
against the real seed through the dev server — see `summary.md`.

## Red run

`bun --bun vitest run catalog/availability.test.ts` before `catalog/availability.ts` existed:

```
FAIL  |server| catalog/availability.test.ts [ catalog/availability.test.ts ]
Error: Cannot find module './availability' imported from /workspace/repo/catalog/availability.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

`bun --bun vitest run` on the three route test files, before the handlers were changed
(new/updated assertions on `reason`, old handlers not yet returning it):

```
FAIL  |server| routes/api/catalog/categories/[categoryId].get.test.ts > CD-02 ... (reason missing from body)
FAIL  |server| routes/api/catalog/categories/[categoryId].get.test.ts > CD-03 ...
FAIL  |server| routes/api/catalog/items/[itemId].get.test.ts > ID-02 ...
FAIL  |server| routes/api/catalog/items/[itemId].get.test.ts > ID-03 ...
 Test Files  3 failed (3)
      Tests  6 failed | 3 passed (9)
```

(PD-02/PD-03 failed identically for products; full log matches the categories/items
pattern above — omitted for length.)

## Green run

After implementing `catalog/availability.ts`, re-exporting from `catalog/catalog.ts`, and
updating the three detail handlers:

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  52 passed (52)
      Tests  259 passed (259)
```

Lint, typecheck and the full unit/integration suite (all 52 files, including the 4 files
this ticket touched or added) are green. `bun run verify:full` was also run; its E2E
stage fails only at the documented Chromium preflight in this container
(`scripts/ensure-playwright-browser.mjs`), which `AGENTS.md` and prior-ticket notes say
is expected here and not retried — `verify` is the recorded fallback gate.

TDD-RESULT: 259 passed, 0 failed
