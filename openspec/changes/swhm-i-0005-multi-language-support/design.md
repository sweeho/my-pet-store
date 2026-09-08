# Internationalization — Design Document

## Localization Architecture

All content queries accept a Locale parameter (java.util.Locale) to retrieve language-appropriate data. Database detail tables contain locale-specific content (category_details, product_details, item_details with locale column).

## Supported Locales

- en_US (English)
- ja_JP (Japanese)  
- zh_CN (Simplified Chinese)

## Implementation Patterns

**DAO Pattern**: All DAO methods include Locale parameter
```
getCategory(categoryID, Locale)
getCategories(start, count, Locale)
getProducts(categoryID, start, count, Locale)
searchItems(query, start, count, Locale)
```

**Profile Storage**: Customer profile stores preferredLanguage field
**Request Context**: Locale detected from user session or request headers
**Database Schema**: Detail tables (category_details, product_details) keyed by (entityID, locale)

## User Interface

No screen records were extracted for this capability; its user interface is unspecified.
