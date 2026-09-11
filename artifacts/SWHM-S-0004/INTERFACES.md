# Interface contracts — SWHM-S-0004 · change `swhm-i-0004-product-catalog-search`

Every shape below is **fixed**. Twelve tickets code against this one surface; a ticket that needs a change here escalates to planning (`a2a_send_message(to_role_key="planning")`) rather than changing it locally. Decisions and their rationale are in `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record; this file is the contract only.

Ownership of each file is named in the owning ticket's description. Nothing here is owned by more than one ticket at a time.

## Module layout

`catalog/` is a new top-level capability module, outside the directories Nitro scans, following the `auth/` and `account/` precedent (ARCHITECTURE.md § Key Decisions). Its tests run in Vitest's `server` project.

| File                     | Owner       | Exports                                                |
| ------------------------ | ----------- | ------------------------------------------------------ |
| `catalog/types.ts`       | SWHM-T-0046 | `Category`, `Product`, `Item`, `Page<T>`, `Locale`     |
| `catalog/page.ts`        | SWHM-T-0047 | `EMPTY_PAGE`, `buildPage`, `hasPrevious`               |
| `catalog/locale.ts`      | SWHM-T-0048 | `DEFAULT_LOCALE`, `isSupportedLocale`, `resolveLocale` |
| `catalog/seed.ts`        | SWHM-T-0048 | `seedCatalog`, `CATALOG_SEED`                          |
| `catalog/transaction.ts` | SWHM-T-0049 | `readConsistent`                                       |
| `catalog/query.ts`       | SWHM-T-0050 | `paginatedQuery`, `localeJoin`, `searchPredicate`      |
| `catalog/category.ts`    | SWHM-T-0051 | `getCategory`, `getCategories`                         |
| `catalog/product.ts`     | SWHM-T-0052 | `getProduct`, `getProducts`                            |
| `catalog/item.ts`        | SWHM-T-0053 | `getItem`, `getItems`                                  |
| `catalog/search.ts`      | SWHM-T-0054 | `searchItems`, `tokenize`                              |
| `catalog/catalog.ts`     | SWHM-T-0055 | the seven-operation facade                             |

## Tables

Added to `db/schema.ts` by SWHM-T-0046, with the generated migration committed to `drizzle/`. The shape is the legacy's own normalization — one row per entity, one row per entity per locale — which is what makes "missing locale data returns null" a data fact rather than a code branch.

| Table              | Columns                                                       | Keys                                                                            |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `category`         | `catid`                                                       | PK `catid`                                                                      |
| `category_details` | `catid`, `locale`, `name`, `descn`                            | PK (`catid`, `locale`); `catid` → `category.catid` ON DELETE CASCADE            |
| `product`          | `productid`, `catid`                                          | PK `productid`; `catid` → `category.catid` ON DELETE CASCADE                    |
| `product_details`  | `productid`, `locale`, `name`, `descn`                        | PK (`productid`, `locale`); `productid` → `product.productid` ON DELETE CASCADE |
| `item`             | `itemid`, `productid`, `list_price`, `unit_cost`              | PK `itemid`; `productid` → `product.productid` ON DELETE CASCADE                |
| `item_details`     | `itemid`, `locale`, `name`, `image`, `descn`, `attr1`…`attr5` | PK (`itemid`, `locale`); `itemid` → `item.itemid` ON DELETE CASCADE             |

Indexes (SWHM-T-0046): `product(catid)`, `item(productid)`, `category_details(locale)`, `product_details(locale)`, `item_details(locale)`.

`list_price` and `unit_cost` are `real`. See design.md § Planning record, D7 — and SWHM-T-0058, which is the ticket that decides a money representation before order arithmetic depends on one.

## Types

```ts
// catalog/types.ts — SWHM-T-0046
export type Locale = string; // any string; an unsupported one yields null / EMPTY_PAGE, never an error

export type Category = {
  id: string;
  name: string;
  description: string;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
};

// The 13 attributes the spec's "Item is retrieved with all attributes" scenario names.
export type Item = {
  itemId: string;
  category: string;
  productId: string;
  productName: string;
  description: string;
  imageLocation: string;
  attribute1: string | null;
  attribute2: string | null;
  attribute3: string | null;
  attribute4: string | null;
  attribute5: string | null;
  listPrice: number;
  unitCost: number;
};

export type Page<T> = {
  objects: T[];
  start: number;
  hasNext: boolean;
};
```

## Pagination

```ts
// catalog/page.ts — SWHM-T-0047
export const EMPTY_PAGE: Page<never>;              // { objects: [], start: 0, hasNext: false }
export function buildPage<T>(rows: T[], start: number, count: number): Page<T>;
export function hasPrevious(page: Page<unknown>): boolean;   // page.start > 0
```

`buildPage` is given **`count + 1` rows at most**: `hasNext` is `rows.length > count`, and the extra row is dropped from `objects`. This is the whole of the spec's "hasNext SHALL be determinable without querying the total result count" — there is no COUNT query anywhere in this capability.

`start < 0`, or a `start` past the end of the result set, returns `EMPTY_PAGE`.

## Query composition

```ts
// catalog/query.ts — SWHM-T-0050
export function paginatedQuery<T>(build: (limit: number, offset: number) => T[], start: number, count: number): Page<T>;
export function localeJoin(detailsTable, locale: Locale);   // the `locale = ?` join condition, one definition
export function searchPredicate(keywords: string[]);         // AND across keywords, OR across fields
```

Every paginated read goes through `paginatedQuery`, which requests `count + 1` rows with `limit`/`offset`, hands them to `buildPage`, and runs inside `readConsistent`. No service composes its own pagination.

## Transaction

```ts
// catalog/transaction.ts — SWHM-T-0049
export function readConsistent<T>(fn: () => T): T;   // one drizzle transaction; the callback's value is returned
```

## Retrieval services

```ts
// catalog/category.ts — SWHM-T-0051
export function getCategory(categoryId: string, locale: Locale): Category | null;
export function getCategories(start: number, count: number, locale: Locale): Page<Category>;

// catalog/product.ts — SWHM-T-0052
export function getProduct(productId: string, locale: Locale): Product | null;
export function getProducts(categoryId: string, start: number, count: number, locale: Locale): Page<Product>;

// catalog/item.ts — SWHM-T-0053
export function getItem(itemId: string, locale: Locale): Item | null;
export function getItems(productId: string, start: number, count: number, locale: Locale): Page<Item>;

// catalog/search.ts — SWHM-T-0054
export function tokenize(query: string): string[];   // whitespace split, empties dropped
export function searchItems(query: string, start: number, count: number, locale: Locale): Page<Item>;
```

Every single-entity read returns `null` — never `undefined`, never a thrown error — when the entity does not exist **or** has no row for that locale. Every list read is ordered by the localized `name`, ascending. Search matching is case-insensitive `LIKE '%keyword%'`, AND across keywords, OR across (item name, product name, category id, item description).

## HTTP surface

Owned by SWHM-T-0055. Every route is GET, unauthenticated (the catalog is public — see design.md § Planning record, D6), and answers `404` with `{ error: string }` for a missing entity.

| Route                                               | Query parameters                                    | 200 body         |
| --------------------------------------------------- | --------------------------------------------------- | ---------------- |
| `routes/api/catalog/categories/index.get.ts`        | `start`, `count`, `locale`                          | `Page<Category>` |
| `routes/api/catalog/categories/[categoryId].get.ts` | `locale`                                            | `Category`       |
| `routes/api/catalog/products/index.get.ts`          | `categoryId` (required), `start`, `count`, `locale` | `Page<Product>`  |
| `routes/api/catalog/products/[productId].get.ts`    | `locale`                                            | `Product`        |
| `routes/api/catalog/items/index.get.ts`             | `productId` (required), `start`, `count`, `locale`  | `Page<Item>`     |
| `routes/api/catalog/items/[itemId].get.ts`          | `locale`                                            | `Item`           |
| `routes/api/catalog/search.get.ts`                  | `q` (required), `start`, `count`, `locale`          | `Page<Item>`     |

Parameter defaults, applied in the facade so every caller gets the same ones: `start = 0`, `count = 25`, `locale = "en_US"`. A missing required parameter is `400 { error: string }`. A non-numeric `start`/`count`, or `count` outside `1…100`, is `400`.

## Screens

Owned by SWHM-T-0056, file-based under `src/pages/` as every page in this repository is.

| Page                                          | Route                           | Shows                                                                                   |
| --------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| `src/pages/catalog/index.tsx`                 | `/catalog`                      | the category page, plus the search box and — when `?q=` is present — the search results |
| `src/pages/catalog/category/[categoryId].tsx` | `/catalog/category/:categoryId` | the products in that category                                                           |
| `src/pages/catalog/product/[productId].tsx`   | `/catalog/product/:productId`   | the items in that product                                                               |
| `src/pages/catalog/item/[itemId].tsx`         | `/catalog/item/:itemId`         | one item's detail — image, all five attributes, list price                              |

Pagination state travels in the URL (`?start=`), so a page is linkable and survives a reload.

## Seed data

`catalog/seed.ts` (SWHM-T-0048) seeds the demo catalog. It runs from `db/client.ts` **only when the `category` table is empty AND `process.env.VITEST` is not set**, so unit and integration tests control their own fixtures and are never asserting against a shared seed, while dev, production and the Playwright tier get a populated catalog.

The seed MUST contain at least:

- All five categories from `account/vocabulary.ts`'s `CATEGORIES` — `BIRDS`, `CATS`, `DOGS`, `FISH`, `REPTILES` — with `category_details` rows for `en_US`, `ja_JP` and `zh_CN`.
- `DOGS` localized as `Dogs` (en_US) and `犬` (ja_JP) — the "Category content is localized" scenario asserts exactly these two strings.
- At least two products per category, and at least two items per product, with `en_US` and `ja_JP` detail rows.
- One item whose searchable fields contain both `large` and `african` — an African Grey parrot under `BIRDS`/`PARROTS` — so the "large african" search scenario has a match, and at least one other item containing `parrot` but not `african`.
- No `de_DE` rows for any entity — the "Missing locale data returns null" scenario depends on that locale being absent.

## Vocabularies

`account/vocabulary.ts` already exports `CATEGORIES` (`BIRDS`, `CATS`, `DOGS`, `FISH`, `REPTILES`) and `LANGUAGES` (`en_US`, `ja_JP`, `zh_CN`), both verbatim from the legacy extraction. The catalog **imports those**; it does not declare a second copy. A category id outside `CATEGORIES` is not rejected at the data layer — the vocabulary is the seed's contract, not a validation rule.

## Registration gotchas

Both are one-line, additive, and belong to SWHM-T-0046 — they are the same two steps `auth/` needed at SWHM-T-0018 and `account/` needed at SWHM-T-0034:

- `vitest.config.ts` — add `catalog/**/*.test.ts` to the `server` project's `include` and `catalog/**` to the `client` project's `exclude`. A test that reaches `db/client.ts` from the jsdom project cannot resolve `bun:sqlite` at all.
- `tsconfig.node.json` — add `"catalog"` to `include`, or the first `routes/` file that imports from it fails typecheck and nothing else does.
