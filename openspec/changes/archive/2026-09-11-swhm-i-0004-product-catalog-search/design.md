# Catalog Browsing — Design Document

## Architecture

The catalog browsing system uses a three-tier data access architecture:

```
Presentation Layer (JSP/Web)
        ↓
CatalogHelper (EJB or DAO access choice)
        ↓
CatalogEJB (Stateless Session Bean)
        ↓
GenericCatalogDAO (Database abstraction)
        ↓
Database (Cloudscape, Oracle, etc.)
```

**CatalogHelper** provides a client facade that can delegate to either CatalogEJB (for transactional consistency) or directly to GenericCatalogDAO (fast-lane path for read-only operations).

## Data Model

### Category

- **id** — Unique category identifier (e.g., "BIRDS", "CATS")
- **name** — Localized display name
- **description** — Localized description text

### Product

- **id** — Unique product identifier within category
- **name** — Localized product name
- **description** — Localized product description
- **categoryID** (implicit) — Product belongs to exactly one category

### Item

- **itemId** — Unique item identifier
- **category** — Category ID for the item
- **productId** — Product ID for the item
- **productName** — Localized product name
- **description** — Localized item description
- **imageLocation** — Path to product image (e.g., "/images/parrots/macaw.jpg")
- **attribute1 through attribute5** — Dynamic product-specific attributes
- **listPrice** — Recommended retail price (double)
- **unitCost** — Store cost (double)

### Page

- **objects** — ArrayList of result objects (Category, Product, or Item instances)
- **start** — Starting index (0-based) of this page's first result
- **hasNext** — Boolean flag; true if more results available after this page

**Empty pages** are represented by `Page.EMPTY_PAGE` constant when result set is empty or start position is invalid.

## Query Interface (CatalogDAO)

All queries are parameterized and localized by Locale:

```
Category getCategory(String categoryID, Locale locale)
  → Single category or null

Page getCategories(int start, int count, Locale locale)
  → Paginated category list, ordered by name

Product getProduct(String productID, Locale locale)
  → Single product or null

Page getProducts(String categoryID, int start, int count, Locale locale)
  → Paginated products for category, ordered by name

Item getItem(String itemID, Locale locale)
  → Single item with all 13 attributes or null

Page getItems(String productID, int start, int count, Locale locale)
  → Paginated items for product

Page searchItems(String searchQuery, int start, int count, Locale locale)
  → Paginated search results across all items
```

## Pagination Implementation

**Result Set Positioning:**

```java
if (start >= 0 && resultSet.absolute(start + 1)) {
    // Positioned successfully at row (start + 1)
    // Note: JDBC ResultSet rows are 1-indexed
    boolean hasNext = false;
    List results = new ArrayList();
    do {
        results.add(createObject(resultSet));
    } while ((hasNext = resultSet.next()) && (--count > 0));
    return new Page(results, start, hasNext);
}
return Page.EMPTY_PAGE;
```

**hasNext Calculation:**

- After consuming `count` rows, attempt one more `resultSet.next()`
- If successful, set `hasNext = true` and don't add the extra row to results
- This allows detection of more results without querying the total row count

**Edge Cases:**

- Invalid start position (resultSet.absolute fails) → return EMPTY_PAGE
- Start position beyond all results → return EMPTY_PAGE
- Last page (hasNext = false) → no next-page link shown in UI

## Search Implementation

**Query Tokenization:**

```java
StringTokenizer tokens = new StringTokenizer(searchQuery);
String[] keywords = new String[tokens.countTokens()];
int i = 0;
while (tokens.hasMoreTokens()) {
    keywords[i++] = tokens.nextToken();
}
```

**SQL Generation:**
For each keyword, append a parameter with wildcard: `"%keyword%"`. SQL uses OR logic:

```sql
WHERE locale = ?
  AND (
    LOWER(name) LIKE ? OR
    LOWER(descn) LIKE ? OR
    LOWER(catid) LIKE ?
  )
  AND (
    LOWER(name) LIKE ? OR
    LOWER(descn) LIKE ? OR
    LOWER(catid) LIKE ?
  )
  ...
```

Each keyword is searched against (name, description, category) using case-insensitive LIKE.

**Matching Semantics:**

- All keywords must match (AND across keywords)
- Each keyword can match any searchable field (OR across fields)
- Matching is case-insensitive (SQL LOWER() function)
- Partial matches allowed (leading/trailing % wildcards)

## Localization

**Locale Support:**

- Every query accepts a Locale parameter (e.g., Locale.US, Locale.JAPAN, Locale.CHINA)
- Database has locale-specific detail tables (category_details, product_details, item_details)
- If locale data is missing, the query returns null for that item

**Multi-Language Schema:**

```
category (catid primary key)
  ├─ category_details (catid, locale, name, descn)
product (productid primary key)
  ├─ product_details (productid, locale, name, descn)
item (itemid primary key)
  ├─ item_details (itemid, locale, name, image, descn, attr1-5)
```

## Transaction Management

All CatalogEJB methods are declared with `trans-attribute: Required`, ensuring:

- Read consistency (repeatable read isolation)
- Consistent view of category/product/item data
- Safe pagination (no rows skipped or duplicated due to concurrent inserts)

## Database Implementations

The system supports multiple database SQL dialects through CatalogDAOSQL.xml:

**Supported Databases:**

- Cloudscape (embedded in J2EE app server)
- Oracle (enterprise database)

**DAO Configuration:**
GenericCatalogDAO loads SQL statements from CatalogDAOSQL.xml at runtime, detecting database type and using appropriate SQL dialect.

## Ordering

All results are ordered by **name**:

- Categories: ordered by category name
- Products: ordered by product name
- Items (in getItems): implicit (depends on product structure)
- Search results: implicit (from database query)

This ensures consistent, predictable navigation and better UX.

## Performance Considerations

1. **Result Set Absolute Positioning**: Uses `resultSet.absolute()` which may require full result set materialization for some JDBC drivers. For very large catalogs, consider keyset pagination.

2. **Full-Text Search**: Multiple LIKE conditions can be slow. Consider full-text search indexes or a dedicated search engine for production.

3. **Pagination Without Total Count**: The `hasNext` flag model is efficient because it doesn't require a COUNT query, only checking for one extra row.

4. **Connection Pooling**: GenericCatalogDAO uses DataSource for connection pooling, managed by the application server.

## Error Handling

- **Missing Locale**: Returns null for queries without locale-specific data
- **Invalid Category/Product/Item ID**: Returns null
- **Database Errors**: Wrapped in CatalogDAOSysException (checked exception)
- **Connection Failures**: Propagate as CatalogDAOSysException

## User Interface

No screen records were extracted for this capability; its user interface is unspecified. The catalog browsing results are typically displayed in web pages showing category/product/item lists with pagination controls, but the exact visual design, layout, search UI, and sorting options are not captured in the extracted IR.

---

# Planning record — SWHM-S-0004 (SWHM-T-0041)

Everything above this line is the **adopted extraction** from the legacy Java EE petstore, unedited. It describes what that system did. Everything below is what THIS repository will do, measured against its actual code — read this part first, then the delta spec under `specs/catalog-browsing/`. Cross-ticket shapes are fixed in `artifacts/SWHM-S-0004/INTERFACES.md`.

## Codebase findings

Measured on the sprint branch before any ticket was drafted.

- **The catalogue is greenfield.** `db/schema.ts` holds the template's demo `users` table, `auth_users` and `sessions` from SWHM-S-0002, and the six account tables from SWHM-S-0003. There is no category, product or item table, no catalog module, and no catalog route. Nothing is being replaced.
- **The capability-module pattern is settled.** `auth/` (SWHM-S-0002) and `account/` (SWHM-S-0003) are top-level directories outside the five Nitro scans, each registered in Vitest's `server` project. `catalog/` is the third and follows them exactly; `ARCHITECTURE.md` § Key Decisions already binds this.
- **Two registration steps are easy to miss and fail nowhere else.** `vitest.config.ts` names each server-side directory in the `server` project's `include` and the `client` project's `exclude`; `tsconfig.node.json` names it in `include`. `auth/` needed both at SWHM-T-0018, `account/` at SWHM-T-0034, and each was found late.
- **The five categories and three locales already exist in code.** `account/vocabulary.ts` exports `CATEGORIES` = BIRDS/CATS/DOGS/FISH/REPTILES and `LANGUAGES` = en_US/ja_JP/zh_CN, both extracted verbatim in SWHM-S-0003 and already enforced server-side for a customer's favourite category and preferred language.
- **A customer already has a stored language.** `profiles.preferred_language` is written at registration and is already applied to the document's `lang` attribute by `src/pages/customer.tsx`. The catalog's locale parameter has a source for a signed-on visitor and a default for everyone else.
- **The route and error conventions are fixed by precedent.** Handlers are `defineHandler` under `routes/api/`, and failures answer `setResponseStatus` plus a plain `{ error: string }` body — SWHM-T-0035 established this deliberately, because `createError`'s serialization adds fields that break a fixed body contract.
- **Seeding has a precedent and a hazard.** `db/client.ts` seeds two demo `users` rows when the table is empty. Under Vitest the database is in-memory per module, so a catalog seed wired the same way would put rows under every integration test's assertions.
- **The four test tiers and CI already exist.** Vitest runs two projects chosen by path, Playwright runs on port 5178, and `.github/workflows/ci.yml` triggers on push and pull request to `vortex/**` and runs doc links, typecheck, lint, unit, build, `playwright install`, then E2E.
- **The idea carries no design blocks.** `a2a_get_idea_design` returns an empty block list, and this document's own § User Interface says no screen records were extracted. There is no mockup to build to and none to export; the screens are built from `DESIGN.md`'s patterns, as SWHM-S-0002's sign-on screens were.

## Decisions

- **D1 — `catalog/` is a new top-level capability module.** Not `utils/`, not under `routes/`: a `.ts` file under `routes/` becomes a public endpoint by existing. This is the standing decision in `ARCHITECTURE.md` § Key Decisions, applied.
- **D2 — The entity/detail table split is kept exactly as the legacy had it.** One row per entity, one row per entity per locale. This is what makes "missing locale data returns null" a fact about the data rather than a branch in code, and it is the only shape in which a locale can be genuinely absent.
- **D3 — Pagination is `LIMIT count + 1 OFFSET start`.** `hasNext` is `rows.length > count`, and the extra row is dropped. This preserves the specified observable — a `Page` of `count` objects with a correct `hasNext`, determined without a total count — while `ResultSet.absolute()` has no counterpart in this stack at all. There is no COUNT query in this capability.
- **D4 — A locale is an unvalidated string at the data layer.** An unsupported or missing locale yields `null` for an entity and `EMPTY_PAGE` for a list, never an error. The spec's own "Missing locale data returns null" scenario uses `de_DE`, which is outside the supported set, so rejecting unknown locales would fail the scenario it was meant to serve.
- **D5 — One query-composition module, one dialect.** `catalog/query.ts` owns pagination, the locale join and the search predicate; the services call it rather than each composing SQL. Queries are built with the drizzle query builder, never assembled as strings — an `AGENTS.md` convention and the reason a keyword containing `%` must be escaped rather than interpolated.
- **D6 — The catalog is public.** No route reads the sign-on session. Browsing and searching a shop's catalogue before signing in is the behaviour the idea describes, and `auth/protected-resources.ts` is where a resource would be declared protected if that ever changed.
- **D7 — Prices are stored as `real`, matching the spec's `double`.** Every price scenario is a read, and no arithmetic happens in this capability. The representation question belongs to the capability that first multiplies and sums prices; SWHM-T-0058 carries it.
- **D8 — The catalog imports its vocabularies from `account/vocabulary.ts`.** A second copy of the five categories or three locales would drift from the one the account validator already enforces.
- **D9 — The demo seed runs only outside Vitest.** Dev, production and the browser tier get a populated catalogue; unit and integration tests start empty and control their own fixtures. Without this, every assertion about a page's contents would be an assertion about the seed.

## Phases

| Phase | Work                                                                                                                 | Tickets                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1     | Foundation — tables and migration, entity and `Page` types, pagination, locale resolution and seed, read transaction | SWHM-T-0046, SWHM-T-0047, SWHM-T-0048, SWHM-T-0049 |
| 2     | Query composition — the one module every service reads through                                                       | SWHM-T-0050                                        |
| 3     | Retrieval and search services — category, product, item, search                                                      | SWHM-T-0051, SWHM-T-0052, SWHM-T-0053, SWHM-T-0054 |
| 4     | Facade and public HTTP surface                                                                                       | SWHM-T-0055                                        |
| 5     | Browsing screens and the end-to-end journey                                                                          | SWHM-T-0056                                        |
| 6     | Performance verification — bounded pagination, index use under `EXPLAIN QUERY PLAN`                                  | SWHM-T-0057                                        |

**Test harness — no new harness, two registration lines.** All four tiers already exist. Unit and integration tests for `catalog/` run in Vitest's `server` project once SWHM-T-0046 adds `catalog/**/*.test.ts` to its `include` and `catalog/**` to the `client` project's `exclude`; component tests for the screens run in the `client` project with no change at all, because `src/pages/**` is already covered. The browser tier gains `e2e/catalog.spec.ts` under the existing Playwright configuration. Every ticket's own test expectations are in its acceptance criteria — there is no separate test ticket, and the two tickets that carry test-shaped names (SWHM-T-0056, SWHM-T-0057) each ship the code their tests exercise.

**CI — already satisfied, deliberately unchanged.** `.github/workflows/ci.yml` triggers on push and pull request to `vortex/**`, so every ticket branch and the sprint branch get a check run, and it already runs doc links, typecheck, lint, the unit suite, the build, a Chromium install and the E2E tier. New specs are picked up by the existing globs. No workflow change is in scope for this sprint, and no ticket should add one.

## Spec discrepancies

The delta spec and the extraction above were taken from a Java EE application. This repository is a React 19 SPA and a Nitro 3 server over Drizzle/SQLite under Bun, so several named artifacts have no counterpart. Following the precedent of `artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` and `artifacts/SWHM-S-0003/SPEC-DISCREPANCIES.md`, **the delta spec is not edited**. Each entry states what the spec says, what this code is, and the resolution every ticket plan builds to. Where a scenario names a legacy artifact, the resolution preserves its OBSERVABLE outcome, which is what validation reports a verdict against.

**S1 — EJB, DAO and the three-tier stack.** `CatalogEJB`, `GenericCatalogDAO`, `CatalogHelper`, stateless session beans and the presentation/EJB/DAO tiers do not exist here. Resolution — a one-to-one mapping used identically by every ticket plan: `CatalogEJB.getX` and `GenericCatalogDAO.getX` collapse to ONE function per operation in `catalog/`, `GenericCatalogDAO`'s SQL composition becomes `catalog/query.ts`, and `CatalogHelper` becomes `catalog/catalog.ts` plus the routes under `routes/api/catalog/`. Task group 2's 2.1 and 2.3 therefore describe one deliverable, not two, and the same holds for groups 3, 4 and 5.

**S2 — `CatalogHelper`'s EJB-versus-DAO choice and its fast lane.** Groups 10.1–10.3 ask for two access paths, one transactional and one read-only fast lane. There is no container, no remote call and no bean-versus-local distinction: both legacy paths reduce to the same in-process function call, so a choice between them would be a choice between one thing and itself. Resolution — one facade, one path. 10.4's "document when to use each path" becomes a statement in the facade's own module comment that there is one path and why.

**S3 — `ResultSet.absolute()` and JDBC cursor positioning.** 6.1 names `resultSet.absolute(start + 1)` and the extraction's § Performance Considerations warns it may materialize the whole result set. There is no JDBC ResultSet here. Resolution — D3: `LIMIT count + 1 OFFSET start`. Every observable the scenarios assert (a page of `count` objects, a correct `hasNext`, `EMPTY_PAGE` for an invalid or out-of-range start, no total-count query) is preserved, and the performance hazard the extraction flags does not arise.

**S4 — `CatalogDAOSQL.xml`, Cloudscape and Oracle.** Group 8 asks for an XML file of SQL statements per database, dialect implementations for Cloudscape and Oracle, runtime database-type detection, and testing against both. This repository has exactly one database, SQLite via `bun:sqlite`, and hand-written SQL strings are against its conventions. Resolution — the genuine local equivalent of "one abstraction over the query surface" is `catalog/query.ts`: the services never compose their own SQL, so the composition has one definition. There is no dialect detection and no second database. **This group carries no scenario in the delta spec**, so nothing in QA's verdict depends on the legacy reading.

**S5 — `trans-attribute: Required`, repeatable read, and concurrent-modification tests.** Group 9 is written against an EJB deployment descriptor and a container-managed isolation level. `bun:sqlite` is an embedded, in-process database reached through one connection, so the interleaved-writer scenario 9.3 and 9.4 describe cannot be produced in-process and cannot be tested the way they are written. Resolution — the real property worth keeping is that a read composed of several statements sees one snapshot, which `readConsistent` gives by running it in one drizzle transaction. A single page read needs no transaction at all under D3, because it is one statement. **This group also carries no scenario.**

**S6 — `StringTokenizer` and hand-built SQL `LIKE` clauses.** 5.3 names a Java class and § Search Implementation shows string-concatenated SQL. Resolution — `tokenize` splits on whitespace, and the predicate is composed with drizzle. The observable semantics are kept exactly: AND across keywords, OR across fields, case-insensitive, partial matches. One addition the legacy lacked: a keyword containing `%` or `_` is escaped so it matches literally, because string-concatenated SQL is where the legacy's injection surface was.

**S7 — The spec's field list for search does not match its own prose.** § Search Implementation's SQL matches `name`, `descn` and `catid`; the requirement text says "item name, product name, category ID, and description". Resolution — the requirement text wins, because it is the normative statement and it is a superset: matching is across item name, product name, category id and item description. The "Single keyword search" scenario names "name, description, or category", which this satisfies.

**S8 — No UI is specified, and there are no design blocks.** The extraction's § User Interface says no screen records exist, and the idea carries no wireframe or mockup. Resolution — the four screens in `INTERFACES.md` § Screens are built from `DESIGN.md`'s existing patterns and the shapes already in `src/pages/`, exactly as SWHM-S-0002 built five sign-on screens with no mockup. This is recorded rather than treated as a blocker: the idea's own acceptance criteria are behavioural, and the E2E journey is what proves them.

**S9 — Caching is suggested, not specified.** 12.3 says "consider caching for static catalog data". No scenario describes a cached read, and a cache invalidated by nothing is how a catalogue starts serving a deleted product. Resolution — no caching this sprint, and SWHM-T-0057 asserts a read always reflects current data so the absence is deliberate and visible.

**S10 — `getItems` ordering is unspecified.** The extraction's § Ordering says items in `getItems` are ordered "implicit (depends on product structure)" and search results "implicit (from database query)". An unspecified order makes pagination non-deterministic: the same row can appear on two pages. Resolution — items and search results are ordered by the localized item name, ascending, the same rule categories and products already follow. This adds determinism the spec does not forbid and that pagination requires to be correct.
