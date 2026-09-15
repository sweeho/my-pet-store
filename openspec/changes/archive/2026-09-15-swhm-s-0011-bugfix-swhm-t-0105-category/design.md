# Design — SWHM-S-0011, SWHM-T-0105

The technical record for this change. The defect's `PLAN.md` cites these sections rather than
repeating them; if a step and this document disagree, this document is the one that was reasoned.

## Measured context

Read on the sprint branch at `c65c507`, not taken from the report.

`src/pages/catalog/UnavailableInLanguage.tsx` is a single shared component with two shapes of caller.
Its current props are five, three of them describing the subject:

| Prop              | Type                     | Today                                           |
| ----------------- | ------------------------ | ----------------------------------------------- |
| `locale`          | `Locale`                 | required                                        |
| `noun`            | `"products" \| "items"`  | optional — present only on an empty-list caller |
| `entity`          | `"product" \| "item"`    | optional, **defaults to `"item"`**              |
| `onViewInEnglish` | `() => void`             | required                                        |
| `onChangeLocale`  | `(next: Locale) => void` | optional                                        |

The body string is built at line 45 from `container`, computed at line 40 as
`noun ? CONTAINER_NOUN[noun] : entity`, where `CONTAINER_NOUN` maps `products → "category"` and
`items → "product"`.

There are five call sites, two shapes:

| Call site                      | Condition             | Passes             | Renders "This …"        |
| ------------------------------ | --------------------- | ------------------ | ----------------------- |
| `category/[categoryId].tsx:76` | `missing-translation` | —                  | **`item`** ← the defect |
| `category/[categoryId].tsx:90` | empty product list    | `noun="products"`  | `category`              |
| `product/[productId].tsx:77`   | `missing-translation` | `entity="product"` | `product`               |
| `product/[productId].tsx:92`   | empty item list       | `noun="items"`     | `product`               |
| `item/[itemId].tsx:68`         | `missing-translation` | —                  | `item` (by the default) |

Two facts about reachability, both of which shape the verification:

- The server is right. `routes/api/catalog/categories/[categoryId].get.ts` answers 404 with
  `reason: missingReason("category", id)`, and `catalog/availability.ts` returns
  `"missing-translation"` whenever the `category` row exists whatever the locale. The 404 the category
  screen branches on is correct; only the word it then renders is wrong.
- `catalog/seed.ts` states its own minimum content in a comment, and the data matches it: all five
  categories carry `en_US`, `ja_JP` and `zh_CN` details, and no `de_DE` row exists anywhere. Since
  `catalog/locale.ts` passes an unsupported locale through rather than rejecting it, and
  `catalog/types.ts` declares `Locale` as `string` for exactly that reason, the category screen's
  untranslated branch is reachable only through a locale the interface never offers —
  `/catalog/category/BIRDS?locale=de_DE`. It is reachable, which is what the verification needs, but
  no route through the language switcher gets there. See § Verification note.

Existing cover, and the hole in it:

- `src/pages/catalog/UnavailableInLanguage.test.tsx` — UL-01 (`noun="products"`), UL-02
  (`noun="items"`), UL-03 (no subject prop → item), UL-03b (`entity="product"`), UL-04, UL-05. No case
  passes a category as the subject, because no value expresses one.
- `src/pages/catalog/category/[categoryId].test.tsx` — PT-02b covers the missing-translation branch,
  and asserts the heading (`"Not available in 中文 yet"`) and the absence of the Not Found screen. The
  heading does not depend on the subject, so PT-02b passes on the broken output.
- `e2e/language.spec.ts` asserts `/This product has nothing translated/` for the product screen. No
  browser-tier assertion reads the category screen's body.

## RC — a default supplies prose, so an unconsidered caller is wrong instead of incomplete

`entity` defaults to `"item"`. A default is a claim that the omitted value is the right one, and for a
prop whose value is a word the visitor reads, that claim is only true for one of the three levels the
component serves.

SWHM-S-0010's task 2.3 added the missing-translation branch to the product **and** category screens;
its task 2.4 added `entity` "so a product screen does not describe its subject as an item". The second
task's union — `"product" | "item"` — names the two screens the first task's author had in mind, and
the category screen created one line earlier is not one of them. Nothing could have reported this: the
call site type-checks, the panel renders, the heading is right, and the only wrong thing is one noun
inside a sentence no test read.

The same shape explains the spec's silence. The delta scenario written for that sprint opens "GIVEN a
visitor on the screen of a **product**", so the requirement of record makes no claim about the
category screen's text and QA had nothing to check it against.

So the fault is the default, and it has now produced the identical defect twice — once for the product
screen (SWHM-T-0098, task 2.4) and once for the category screen (this one). Adding `"category"` to the
union fixes the instance and leaves the mechanism, so the next screen added to this panel gets the
same silent wrong word.

## D1 — the subject is required, and the default is deleted

`entity` becomes required and widens to `"category" | "product" | "item"`. Every call site names the
thing its screen is showing; a call site that does not is a type error, which is the report the last
two occurrences of this defect never produced.

This is smaller than the code it replaces, not larger. It adds a value to a union and a prop to four
call sites, and it removes a default and a lookup table (D2). No call site's rendered output changes
except the one the defect is about — the four others are given, explicitly, the word they already
render today.

Rejected: a discriminated union making `entity` required only when `noun` is absent. It expresses the
same constraint at the cost of a props type with two `?: never` members and a component body that can
no longer destructure its props, because TypeScript loses the correlation between destructured members
of a union. The compiler-enforced outcome is identical and the code is worse.

## D2 — `CONTAINER_NOUN` goes with it

Once every caller passes `entity`, `container` is always `entity`, so the `products → category`,
`items → product` table has no reader. It is deleted, and the body reads `This ${entity} …`.

The table encoded the catalogue hierarchy — that a thing listing products is a category — in a second
place, derived from a different prop than the one that names the subject. Two sources for one fact is
how the two could disagree; keeping it now that it is redundant preserves exactly that possibility.

`noun` stays, and keeps its two real jobs: the heading (`No products in 中文 yet` versus `Not available
in 中文 yet`) and the clause in the body (`the products exist` versus `it exists`). Those genuinely
differ between the two shapes of caller and are not derivable from `entity`.

## D3 — the fix is covered at all three tiers, because each one missed it differently

- **Panel tier** — a case passing a category as the subject, alongside the existing item and product
  cases. UL-01 and UL-02 keep their exact assertions; they gain an explicit subject that reproduces
  the string they already assert.
- **Screen tier** — the category screen's own missing-translation test asserts the body text, not only
  the heading. This is the assertion whose absence let the defect ship: the branch was covered, the
  text was not.
- **Browser tier** — the category-screen mirror of the product assertion already in
  `e2e/language.spec.ts`, reached through `?locale=de_DE` as § Measured context requires.

One tier would have been enough to catch this instance. Three are what stop the next one, because the
three failures were different: the panel had no value to test, the screen test read the wrong string,
and the browser tier never visited the screen.

## What must not regress

- The product screen's body reads "This product …" and the item screen's reads "This item …", both
  byte-identical to today. UL-03's assertion text does not change — only the prop that produces it
  becomes explicit.
- The empty-list state on both the category and product screens is a different condition with a
  different heading, gated on `showUnavailable`, and is not touched. Its rendered strings are
  unchanged.
- `reason === "not-found"` still returns `<NotFound />` on all three screens. Nothing in this change
  reads `reason`.
- The panel keeps all three parts DESIGN.md § Unavailable content states requires — the cause-naming
  heading, the nothing-is-broken body, and the primary plus secondary actions — and keeps rendering
  its own `LanguageSwitcher` rather than operating another region's, per ARCHITECTURE.md
  § Key Decisions.

## Verification note

The browser-tier assertion runs in CI on this branch and again at integration QA; it does not run in
an implementation container, which has no Chromium. The implementation agent runs the browser-free
gate there, says so, and does not attempt to install one — `.vortex/agents-generated.md` records this
for the same reason across six tickets in SWHM-S-0002.

The category assertion needs `?locale=de_DE` and cannot be written against `zh_CN`: every seeded
category has a `zh_CN` row, so that URL renders the category rather than the panel.
