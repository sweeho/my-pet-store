## ADDED Requirements

### Requirement: Order submission
The system SHALL accept customer orders with billing address, shipping address, and line items, generating a unique order ID and persisting the order to the database.

#### Scenario: Order is created and ID is assigned
- **GIVEN** a customer submitting checkout with cart items and shipping address
- **WHEN** the order is submitted
- **THEN** a unique order ID SHALL be generated and the order SHALL be persisted

### Requirement: Order data capture
The system SHALL capture all required customer information during checkout: name, email, shipping address (street, city, state, zip, country), and billing address.

#### Scenario: Order stores customer contact and address
- **GIVEN** customer checkout with complete address
- **WHEN** order is submitted
- **THEN** shipping and billing addresses SHALL be stored with the order

### Requirement: Order line items
The system SHALL associate all cart items with the order, capturing product ID, quantity, and unit price for each line item.

#### Scenario: Order line items are captured
- **GIVEN** a cart with multiple items
- **WHEN** order is submitted
- **THEN** each item SHALL be stored with quantity and price

### Requirement: Order total calculation
The system SHALL calculate and store the total order amount based on line item quantities and prices.

#### Scenario: Order total is calculated
- **GIVEN** an order with line items
- **WHEN** order is submitted
- **THEN** the order total SHALL equal the sum of (quantity × price) for all line items

### Requirement: Order confirmation
The system SHALL send a confirmation to the customer containing order ID, items ordered, and total amount.

#### Scenario: Confirmation is sent after order placement
- **GIVEN** an order successfully submitted
- **WHEN** the order is created
- **THEN** a confirmation email SHALL be sent to the customer email address
