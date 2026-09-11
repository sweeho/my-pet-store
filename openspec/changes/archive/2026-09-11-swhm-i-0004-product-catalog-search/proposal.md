# Catalog Browsing Capability — Proposal

## Summary

The Catalog Browsing capability enables customers to browse, search, and view the product catalog organized into categories and products, with detailed information about individual items including pricing and images. This is the foundation for product discovery in the online petstore.

## Scope

This specification defines:
- **Product hierarchy** — Organization of items into categories and products
- **Category retrieval** — Browse product categories by locale
- **Product retrieval** — View products within categories
- **Item retrieval** — Access detailed item information including attributes and pricing
- **Pagination** — Efficient browsing of large result sets with page navigation
- **Search** — Full-text search across item names, descriptions, and categories
- **Localization** — Multi-language catalog support for all content

## Key Data Model

| Entity | Role | Key Fields |
|--------|------|-----------|
| Category | Top-level organization | id, name (localized), description (localized) |
| Product | Mid-level grouping | id, name (localized), description (localized) |
| Item | Purchasable entity | id, category, product, name, 5 attributes, prices, image |
| Page | Pagination container | objects (list), start (index), hasNext (flag) |

## Key Browsing Paths

1. **Browse Categories** → Browse Products in Category → View Item Details
2. **Search** → Item Results → View Item Details
3. **Direct Access** → Get Category by ID → Get Product by ID → Get Item by ID

## Localization Strategy

All content (category names, product names, descriptions) is localized by Locale. Each query filters results by locale to return language-appropriate content. The system supports multiple Locale values (e.g., en_US, ja_JP, zh_CN).

## Pagination Model

Results are returned in Page objects containing:
- **objects** — Ordered list of result items (categories, products, or items)
- **start** — Starting index of current page (0-based)
- **hasNext** — Boolean indicating whether more results follow (allows efficient next-page detection without total count)

## Search Capabilities

- **Full-text search** — Query matched against item names, product names, and category IDs
- **Tokenization** — Query split by whitespace; each keyword is a separate search term
- **Matching** — Keyword matches any searchable field using case-insensitive wildcards
- **Pagination** — Search results support pagination like category/product browsing

## Item Attributes

Each item carries up to 5 dynamic attributes (attribute1 through attribute5) for flexible product specification (e.g., size, color, breed details). Attributes are locale-specific.

## Pricing

Items carry two price fields:
- **listPrice** — Recommended retail price
- **unitCost** — Cost to the store

## Dependencies

- **Upstream**: Internationalization (locale support)
- **Downstream**: Shopping Cart (items for purchase), Order Placement (item pricing), Catalog Reporting

## Risk & Constraints

- **Performance**: Large catalogs require efficient pagination to avoid loading all results at once
- **Localization**: Missing locale-specific content (category_details, product_details for a language) results in null values
- **Search**: Complex query strings with many keywords may impact database performance
- **Ordering**: Results are consistently ordered by name, ensuring predictable navigation
