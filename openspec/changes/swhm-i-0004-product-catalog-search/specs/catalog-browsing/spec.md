## ADDED Requirements

### Requirement: Category entity representation
The system SHALL represent product categories as entities with a unique identifier, localized display name, and localized description.

#### Scenario: Category data is stored and retrieved
- **GIVEN** a category with ID "BIRDS", name "Birds", and description "Feathered pets"
- **WHEN** the system stores and retrieves the category
- **THEN** the retrieved category SHALL contain the same ID, name, and description

### Requirement: Product entity representation
The system SHALL represent products as entities with a unique identifier within a category, localized name, and localized description. Each product belongs to exactly one category.

#### Scenario: Product data includes category relationship
- **GIVEN** a product with ID "PARROTS", name "Parrots", category "BIRDS"
- **WHEN** the system retrieves the product
- **THEN** the product SHALL indicate its category relationship

### Requirement: Item entity representation
The system SHALL represent purchasable items with comprehensive product-level attributes: item ID, category, product ID, product name, description, image location, five dynamic product-specific attributes (attribute1-5), unit cost, and list price.

#### Scenario: Item contains all attributes
- **GIVEN** an item with ID "EST-1", category "BIRDS", product "PARROTS", attributes for size/color/breed
- **WHEN** the system retrieves the item
- **THEN** the item SHALL contain all attributes including the five dynamic attributes, both prices, and image location

### Requirement: Pagination with hasNext indicator
The system SHALL return paginated results in Page objects containing a list of results, a start position index, and a hasNext boolean flag indicating whether more results are available after the current page. The hasNext flag SHALL be determinable without querying the total result count.

#### Scenario: Page indicates next page availability
- **GIVEN** a catalog with 100 categories and a page request for start=0, count=25
- **WHEN** the system returns the first page
- **THEN** the Page SHALL contain 25 categories with start=0 and hasNext=true (since 100 > 25)

#### Scenario: Last page has no next
- **GIVEN** a page request for start=75, count=25 from a catalog of 100 categories
- **WHEN** the system returns the last page
- **THEN** the Page SHALL contain 25 categories with hasNext=false (no more results after row 100)

#### Scenario: Previous page availability is indicated
- **GIVEN** a page returned with start=25
- **WHEN** the user checks pagination status
- **THEN** the system SHALL indicate previous page is available (start > 0)

### Requirement: Retrieve single category by ID
The system SHALL retrieve a single category by its identifier and locale, returning the category with its localized name and description, or null if the category does not exist.

#### Scenario: Category is retrieved by ID
- **GIVEN** a category with ID "CATS" in locale en_US
- **WHEN** the system retrieves the category
- **THEN** the category SHALL be returned with its localized name and description for that locale

#### Scenario: Non-existent category returns null
- **GIVEN** a request for category ID "UNKNOWN"
- **WHEN** the system attempts retrieval
- **THEN** the system SHALL return null

### Requirement: Retrieve all categories paginated
The system SHALL retrieve all categories as a paginated list in a specified locale, ordered alphabetically by category name, with pagination parameters start and count.

#### Scenario: Categories are retrieved in pages
- **GIVEN** a catalog with 50 categories
- **WHEN** the system retrieves categories with start=0, count=10, locale=en_US
- **THEN** the system SHALL return the first 10 categories ordered by name with hasNext=true

#### Scenario: Categories are ordered by name
- **GIVEN** categories: "Dogs", "Birds", "Cats", "Fish", "Reptiles"
- **WHEN** the system retrieves all categories
- **THEN** the results SHALL be ordered alphabetically: "Birds", "Cats", "Dogs", "Fish", "Reptiles"

### Requirement: Retrieve single product by ID
The system SHALL retrieve a single product by its identifier and locale, returning the product with its localized name and description, or null if not found.

#### Scenario: Product is retrieved by ID
- **GIVEN** a product with ID "PARROTS" in locale en_US
- **WHEN** the system retrieves the product
- **THEN** the product SHALL be returned with its localized name and description

### Requirement: Retrieve all products in a category paginated
The system SHALL retrieve all products within a specified category as a paginated list in a specified locale, ordered alphabetically by product name.

#### Scenario: Products are filtered by category and paginated
- **GIVEN** the "BIRDS" category containing 30 products
- **WHEN** the system retrieves products with categoryID="BIRDS", start=0, count=10, locale=en_US
- **THEN** the system SHALL return the first 10 products for that category ordered by name

#### Scenario: Products are scoped to correct category
- **GIVEN** retrieval request for products in category "CATS"
- **WHEN** the system retrieves products
- **THEN** the results SHALL only include products in the "CATS" category, not products from other categories

### Requirement: Retrieve single item by ID
The system SHALL retrieve a single item by its identifier and locale, returning all item attributes (category, product, name, description, image, attributes 1-5, prices), or null if not found.

#### Scenario: Item is retrieved with all attributes
- **GIVEN** an item with ID "EST-1" in locale en_US
- **WHEN** the system retrieves the item
- **THEN** the item SHALL contain all 13 attributes: category, product ID, product name, item description, image location, 5 dynamic attributes, list price, and unit cost

### Requirement: Retrieve all items in a product paginated
The system SHALL retrieve all items within a specified product as a paginated list in a specified locale.

#### Scenario: Items are filtered by product and paginated
- **GIVEN** a product with 50 items
- **WHEN** the system retrieves items with productID="PARROTS", start=0, count=10, locale=en_US
- **THEN** the system SHALL return the first 10 items for that product

### Requirement: Full-text search of items
The system SHALL support full-text search of items across item name, product name, category ID, and description fields. The search query SHALL be tokenized by whitespace, with each keyword matched against any searchable field using case-insensitive pattern matching.

#### Scenario: Search returns items matching keywords
- **GIVEN** a catalog with items containing "large", "parrot", "african"
- **WHEN** the user searches for "large african"
- **WHEN** the system shall return items matching both keywords (AND) in any searchable field (OR)
- **THEN** the results SHALL include items matching both "large" AND "african" in any field

#### Scenario: Search results are paginated
- **GIVEN** a search query returning 100 matching items
- **WHEN** the system returns search results with start=0, count=25
- **THEN** the results SHALL be paginated with 25 items per page

#### Scenario: Single keyword search
- **GIVEN** a search query "parrot"
- **WHEN** the system searches
- **THEN** items with "parrot" in name, description, or category SHALL be returned

### Requirement: Localized catalog content
The system SHALL support localized versions of category names, product names, and descriptions. Queries in a specific locale SHALL return language-appropriate content for that locale only.

#### Scenario: Category content is localized
- **GIVEN** a category with English name "Dogs" and Japanese name "犬"
- **WHEN** the system retrieves the category for locale en_US
- **THEN** the name SHALL be "Dogs"
- **WHEN** the system retrieves the category for locale ja_JP
- **THEN** the name SHALL be "犬"

#### Scenario: Missing locale data returns null
- **GIVEN** a category without content for locale "de_DE"
- **WHEN** the system retrieves the category for that locale
- **THEN** the system SHALL return null

### Requirement: Item pricing information
The system SHALL store and retrieve two distinct price values for each item: list price (recommended retail price) and unit cost (store cost).

#### Scenario: Item prices are retrieved
- **GIVEN** an item with listPrice=99.99 and unitCost=50.00
- **WHEN** the system retrieves the item
- **THEN** both prices SHALL be returned as numeric values

### Requirement: Item image association
The system SHALL associate each item with an image location (file path or URL) indicating the product image to display.

#### Scenario: Item image location is retrieved
- **GIVEN** an item with imageLocation="/images/parrots/macaw.jpg"
- **WHEN** the system retrieves the item
- **THEN** the imageLocation SHALL be available for display

### Requirement: Item dynamic attributes
The system SHALL support up to five dynamic attributes per item (attribute1 through attribute5) for flexible product specification (size, color, variety, breed details, etc.).

#### Scenario: All item attributes are retrieved
- **GIVEN** an item with attributes: attribute1="Large", attribute2="Green", attribute3="Male", attribute4="African", attribute5="Grey"
- **WHEN** the system retrieves the item
- **THEN** all five attributes SHALL be returned with their values
