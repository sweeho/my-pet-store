## ADDED Requirements

### Requirement: Add items to shopping cart
The system SHALL allow customers to add items to their shopping cart, specifying a quantity for each item. A single item ID may appear in the cart once, with quantity representing the number of that item ordered. Minimum quantity is 1.

#### Scenario: Item added to empty cart with default quantity
- **GIVEN** a customer with an empty shopping cart
- **WHEN** the customer adds an item without specifying quantity
- **THEN** the item SHALL be added with a default quantity of 1

#### Scenario: Item added to cart with explicit quantity
- **GIVEN** a customer with a shopping cart
- **WHEN** the customer adds an item with quantity 5
- **THEN** the item SHALL be added with quantity 5 and stored by itemID

#### Scenario: Item quantity is updated when same item added again
- **GIVEN** an item already in the cart with quantity 3
- **WHEN** the customer adds the same item with quantity 2
- **THEN** the item SHALL be updated in the cart with the new quantity

### Requirement: Remove items from shopping cart
The system SHALL allow customers to remove items from their shopping cart entirely. Removing an item makes it unavailable for purchase in that transaction.

#### Scenario: Item is removed from cart
- **GIVEN** a shopping cart containing items
- **WHEN** the customer removes an item by itemID
- **THEN** the item SHALL be removed from the cart immediately

### Requirement: Update item quantities in shopping cart
The system SHALL allow customers to modify quantities of items already in the cart. Quantity updates require at least 1 item; quantities of 0 or less SHALL result in item removal.

#### Scenario: Quantity is updated to a valid value
- **GIVEN** an item in the cart with quantity 3
- **WHEN** the customer updates the quantity to 5
- **THEN** the item quantity SHALL be updated to 5

#### Scenario: Item is removed when quantity is set to zero or negative
- **GIVEN** an item in the cart with quantity 2
- **WHEN** the customer updates the quantity to 0
- **THEN** the item SHALL be removed from the cart

### Requirement: Display shopping cart with items and subtotal
The shopping cart display SHALL show all items with their names, unit costs, and quantities, providing quantity input fields and remove links for each item. The cart subtotal SHALL be displayed at the bottom.

#### Scenario: Cart displays all current items with details
- **GIVEN** a shopping cart containing 3 items with different costs
- **WHEN** the cart is displayed
- **THEN** each item SHALL show its name, quantity, unit cost, a quantity input field, and a Remove link

#### Scenario: Cart subtotal is calculated and displayed
- **GIVEN** a shopping cart with multiple items
- **WHEN** the cart is displayed
- **THEN** the subtotal SHALL equal the sum of (unitCost × quantity) for all items

### Requirement: Calculate shopping cart subtotal
The system SHALL calculate the shopping cart subtotal as the sum of (unitCost × quantity) for all items in the cart.

#### Scenario: Subtotal is zero for empty cart
- **GIVEN** an empty shopping cart
- **WHEN** the subtotal is calculated
- **THEN** the subtotal SHALL be 0.0

#### Scenario: Subtotal is calculated correctly with multiple items
- **GIVEN** a cart with: item1 (quantity=2, unitCost=10.50), item2 (quantity=3, unitCost=5.00)
- **WHEN** the subtotal is calculated
- **THEN** the subtotal SHALL be (2 × 10.50) + (3 × 5.00) = 36.00

### Requirement: Line items store product references and quantities
Line items SHALL store product identification (categoryId, productId, itemId), line number, ordered quantity, and unit price. Line items support both shopping cart and order fulfillment contexts.

#### Scenario: Line item is created with all required fields
- **GIVEN** cart item data with category "dogs", product "poodle", item "toy-poodle-001", quantity 3, unitPrice 49.99
- **WHEN** a line item entity is created
- **THEN** all fields SHALL be stored persistently with exact values

### Requirement: Line items are serializable to XML format
Line items SHALL be serializable to and from XML format conforming to a DTD schema. The XML representation SHALL include all core fields: CategoryId, ProductId, ItemId, LineNum, Quantity, and UnitPrice in that order.

#### Scenario: Line item is serialized to XML
- **GIVEN** a line item with all core fields populated
- **WHEN** the line item is serialized to XML
- **THEN** the XML SHALL contain all six elements in the order defined by LineItem.dtd

#### Scenario: Line item is deserialized from XML
- **GIVEN** valid XML conforming to LineItem.dtd
- **WHEN** the XML is deserialized
- **THEN** a line item object SHALL be created with all fields set correctly

### Requirement: Line number must be a non-negative integer
Line number (lineNo) in LineItem SHALL be enforced as a non-negative integer (>= 0) via XSD constraint xsd:nonNegativeInteger.

#### Scenario: Line number constraint is validated on parsing
- **GIVEN** XML with lineNo = -1
- **WHEN** the XML is validated against the XSD schema
- **THEN** XSD validation SHALL reject the document

#### Scenario: Line number zero is accepted
- **GIVEN** XML with lineNo = 0
- **WHEN** the XML is validated against the XSD schema
- **THEN** XSD validation SHALL accept the document

### Requirement: Quantity must be a positive integer
Quantity in LineItem SHALL be enforced as a positive integer (> 0) via XSD constraint xsd:positiveInteger.

#### Scenario: Quantity is rejected when zero or negative
- **GIVEN** XML with quantity = 0
- **WHEN** the XML is validated against the XSD schema
- **THEN** XSD validation SHALL reject the document

#### Scenario: Quantity is accepted when positive
- **GIVEN** XML with quantity = 5
- **WHEN** the XML is validated against the XSD schema
- **THEN** XSD validation SHALL accept the document

### Requirement: Unit price must be non-negative decimal
Unit price in LineItem SHALL be enforced as a non-negative decimal (>= 0.0) via XSD constraint positiveDecimal with minInclusive="0.0".

#### Scenario: Unit price zero is accepted
- **GIVEN** XML with unitPrice = 0.00
- **WHEN** the XML is validated against the XSD schema
- **THEN** XSD validation SHALL accept the document

#### Scenario: Unit price is rejected when negative
- **GIVEN** XML with unitPrice = -5.00
- **WHEN** the XML is validated against the XSD schema
- **THEN** XSD validation SHALL reject the document
