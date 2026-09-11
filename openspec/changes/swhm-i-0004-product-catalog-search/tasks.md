# Catalog Browsing — Implementation Tasks

## 1. Data Model & Entities

- [ ] 1.1 Define Category entity with id, name (localized), description (localized) fields (SWHM-T-0046)
- [ ] 1.2 Define Product entity with id, name (localized), description (localized) fields (SWHM-T-0046)
- [ ] 1.3 Define Item entity with id, category, productId, productName, description, imageLocation, 5 attributes, listPrice, unitCost fields (SWHM-T-0046)
- [ ] 1.4 Define Page entity with objects list, start index, and hasNext boolean flag (SWHM-T-0046)
- [ ] 1.5 Create database schema for category, product, item tables with locale-specific detail tables (SWHM-T-0046)
- [ ] 1.6 Create indexes on categoryID, productID, itemID, locale columns for query performance (SWHM-T-0046)

## 2. Category Retrieval Service

- [ ] 2.1 Implement CatalogEJB.getCategory(categoryID, locale) to retrieve single category (SWHM-T-0051)
- [ ] 2.2 Implement CatalogEJB.getCategories(start, count, locale) with pagination (SWHM-T-0051)
- [ ] 2.3 Implement GenericCatalogDAO.getCategory() with locale-aware SQL query (SWHM-T-0051)
- [ ] 2.4 Implement GenericCatalogDAO.getCategories() with ResultSet.absolute() pagination (SWHM-T-0051)
- [ ] 2.5 Ensure results ordered by category name (SWHM-T-0051)
- [ ] 2.6 Implement hasNext flag detection (check for row after consuming count) (SWHM-T-0051)
- [ ] 2.7 Return Page.EMPTY_PAGE for invalid start positions or no results (SWHM-T-0051)

## 3. Product Retrieval Service

- [ ] 3.1 Implement CatalogEJB.getProduct(productID, locale) (SWHM-T-0052)
- [ ] 3.2 Implement CatalogEJB.getProducts(categoryID, start, count, locale) with category filtering (SWHM-T-0052)
- [ ] 3.3 Implement GenericCatalogDAO.getProduct() with locale-aware SQL (SWHM-T-0052)
- [ ] 3.4 Implement GenericCatalogDAO.getProducts() with category filter and pagination (SWHM-T-0052)
- [ ] 3.5 Ensure products ordered by name (SWHM-T-0052)
- [ ] 3.6 Filter results to specified category (categoryID parameter) (SWHM-T-0052)

## 4. Item Retrieval Service

- [ ] 4.1 Implement CatalogEJB.getItem(itemID, locale) returning all 13 item attributes (SWHM-T-0053)
- [ ] 4.2 Implement CatalogEJB.getItems(productID, start, count, locale) with product filtering (SWHM-T-0053)
- [ ] 4.3 Implement GenericCatalogDAO.getItem() populating all Item fields from result set (SWHM-T-0053)
- [ ] 4.4 Implement GenericCatalogDAO.getItems() with product filter and pagination (SWHM-T-0053)
- [ ] 4.5 Ensure imageLocation field is retrieved from item_details table (SWHM-T-0053)
- [ ] 4.6 Ensure all 5 attribute fields (attribute1-5) are populated (SWHM-T-0053)
- [ ] 4.7 Ensure pricing fields (listPrice, unitCost) are retrieved as doubles (SWHM-T-0053)

## 5. Search Service

- [ ] 5.1 Implement CatalogEJB.searchItems(searchQuery, start, count, locale) (SWHM-T-0054)
- [ ] 5.2 Implement GenericCatalogDAO.searchItems() with tokenized keyword search (SWHM-T-0054)
- [ ] 5.3 Implement query tokenization by whitespace (StringTokenizer) (SWHM-T-0054)
- [ ] 5.4 Implement SQL generation with OR conditions across name, description, category (SWHM-T-0054)
- [ ] 5.5 Implement case-insensitive matching with LIKE and % wildcards (SWHM-T-0054)
- [ ] 5.6 Implement pagination for search results (SWHM-T-0054)
- [ ] 5.7 Ensure all keywords must match (AND across keywords, OR across fields) (SWHM-T-0054)

## 6. Pagination & Navigation

- [ ] 6.1 Implement ResultSet.absolute(start + 1) for position-based navigation (SWHM-T-0047)
- [ ] 6.2 Implement hasNext detection without COUNT query (check for row after count) (SWHM-T-0047)
- [ ] 6.3 Implement Page.EMPTY_PAGE for edge cases (SWHM-T-0047)
- [ ] 6.4 Implement start position validation (negative values → EMPTY_PAGE) (SWHM-T-0047)
- [ ] 6.5 Implement isPreviousPageAvailable() logic (start > 0) (SWHM-T-0047)
- [ ] 6.6 Test pagination with various page sizes and result set sizes (SWHM-T-0047)

## 7. Localization

- [ ] 7.1 Create locale-specific detail tables (category_details, product_details, item_details) (SWHM-T-0048)
- [ ] 7.2 Populate detail tables for all supported locales (en_US, ja_JP, zh_CN, etc.) (SWHM-T-0048)
- [ ] 7.3 Implement locale parameter passing through all query methods (SWHM-T-0048)
- [ ] 7.4 Implement null-safe handling for missing locale-specific data (SWHM-T-0048)
- [ ] 7.5 Test queries with multiple locales (SWHM-T-0048)

## 8. Database Abstraction & Multiple Dialects

- [ ] 8.1 Create CatalogDAOSQL.xml with SQL statements for all database types (SWHM-T-0050)
- [ ] 8.2 Implement Cloudscape SQL dialect for all queries (SWHM-T-0050)
- [ ] 8.3 Implement Oracle SQL dialect for all queries (SWHM-T-0050)
- [ ] 8.4 Implement database type detection in GenericCatalogDAO (SWHM-T-0050)
- [ ] 8.5 Test with both Cloudscape and Oracle databases (SWHM-T-0050)

## 9. Transaction Management

- [ ] 9.1 Declare all CatalogEJB methods with trans-attribute: Required in ejb-jar.xml (SWHM-T-0049)
- [ ] 9.2 Ensure repeatable read isolation level (SWHM-T-0049)
- [ ] 9.3 Test pagination consistency under concurrent modifications (SWHM-T-0049)
- [ ] 9.4 Test that rows aren't skipped or duplicated during pagination (SWHM-T-0049)

## 10. Client Access Facade

- [ ] 10.1 Implement CatalogHelper to provide EJB or DAO access choice (SWHM-T-0055)
- [ ] 10.2 Implement fast-lane path for read-only DAO access (SWHM-T-0055)
- [ ] 10.3 Implement EJB path for transactional consistency (SWHM-T-0055)
- [ ] 10.4 Document when to use each path (SWHM-T-0055)

## 11. Testing

- [ ] 11.1 Write unit tests for Category entity creation and retrieval (SWHM-T-0056)
- [ ] 11.2 Write unit tests for Product entity with category filtering (SWHM-T-0056)
- [ ] 11.3 Write unit tests for Item entity with all 13 attributes (SWHM-T-0056)
- [ ] 11.4 Write unit tests for pagination with hasNext calculation (SWHM-T-0056)
- [ ] 11.5 Write unit tests for search tokenization and matching (SWHM-T-0056)
- [ ] 11.6 Write integration tests for getCategory, getCategories (SWHM-T-0056)
- [ ] 11.7 Write integration tests for getProduct, getProducts (SWHM-T-0056)
- [ ] 11.8 Write integration tests for getItem, getItems (SWHM-T-0056)
- [ ] 11.9 Write integration tests for searchItems with various queries (SWHM-T-0056)
- [ ] 11.10 Write integration tests for pagination edge cases (empty, last page, invalid start) (SWHM-T-0056)
- [ ] 11.11 Write integration tests for locale-specific content retrieval (SWHM-T-0056)
- [ ] 11.12 Write E2E tests for browsing workflow: category → product → item (SWHM-T-0056)

## 12. Performance & Optimization

- [ ] 12.1 Create database indexes on pagination cursor columns (SWHM-T-0057)
- [ ] 12.2 Test search performance with large result sets (SWHM-T-0057)
- [ ] 12.3 Consider caching for static catalog data (SWHM-T-0057)
- [ ] 12.4 Profile pagination with ResultSet.absolute() for large result sets (SWHM-T-0057)
- [ ] 12.5 Monitor and optimize locale-join performance (SWHM-T-0057)
