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
