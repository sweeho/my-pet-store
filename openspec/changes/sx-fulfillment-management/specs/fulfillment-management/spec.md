## ADDED Requirements

### Requirement: Receive purchase orders asynchronously via JMS queue
The system SHALL receive purchase orders from the Order Processing Center via a JMS queue (OPC queue).

#### Scenario: PO is received from message queue
- **GIVEN** the SupplierOrderMDB listening to the OPC queue
- **WHEN** a message containing a serialized purchase order arrives
- **THEN** the message-driven bean SHALL extract the message content and process the order

### Requirement: Verify inventory availability for line items
The system SHALL check each line item in a purchase order to determine if the requested quantity is available in inventory.

#### Scenario: Inventory check for available items
- **GIVEN** a line item requesting 50 units of an item
- **WHEN** inventory contains 100 units of that item
- **THEN** the system SHALL confirm availability

#### Scenario: Inventory check for unavailable items
- **GIVEN** a line item requesting 50 units of an item
- **WHEN** inventory contains 25 units of that item
- **THEN** the system SHALL report insufficient inventory

### Requirement: Deduct ordered quantities from inventory upon fulfillment
The system SHALL deduct the requested quantity from inventory quantity when inventory is available for a line item.

#### Scenario: Inventory quantity is reduced after fulfillment
- **GIVEN** inventory contains 100 units and a line item orders 30 units
- **WHEN** the inventory check passes
- **THEN** the system SHALL reduce inventory quantity to 70 units

#### Scenario: Inventory reduction is atomic
- **GIVEN** a line item being fulfilled with quantity 30
- **WHEN** inventory reduction is executed with Required transaction attribute
- **THEN** the quantity change SHALL be atomic and durable

### Requirement: Skip already-shipped line items during processing
The system SHALL skip processing of line items that have already been partially or fully shipped.

#### Scenario: Shipped line items are skipped
- **GIVEN** a line item with quantity=50 and quantityShipped=50
- **WHEN** the purchase order is reprocessed
- **THEN** the system SHALL skip that line item and move to the next

#### Scenario: Partially shipped items are skipped
- **GIVEN** a line item with quantity=50 and quantityShipped=50
- **WHEN** inventory verification iteration occurs
- **THEN** that line item SHALL NOT undergo inventory checking

### Requirement: Mark purchase orders as completed when all items are fulfilled
The system SHALL mark the purchase order status as COMPLETED when all line items have sufficient inventory and have been fulfilled.

#### Scenario: Order status transitions to completed
- **GIVEN** a purchase order with all line items having sufficient inventory
- **WHEN** fulfillment processing completes successfully
- **THEN** the order status SHALL be set to COMPLETED

#### Scenario: Order status remains pending on partial fulfillment
- **GIVEN** a purchase order with one line item lacking inventory
- **WHEN** inventory verification finds insufficient stock
- **THEN** the order status SHALL remain PENDING

### Requirement: Update line item shipped quantities during fulfillment
The system SHALL set the line item quantity shipped equal to the line item quantity when fulfillment completes.

#### Scenario: Shipped quantity is set to ordered quantity
- **GIVEN** a line item with quantity=50 and quantityShipped=0
- **WHEN** inventory verification succeeds
- **THEN** quantityShipped SHALL be set to 50

#### Scenario: Shipped quantity tracks fulfillment progress
- **GIVEN** a line item with quantity=100
- **WHEN** fulfillment occurs
- **THEN** quantityShipped SHALL equal the fulfilled quantity

### Requirement: Generate XML invoices for fulfilled items
The system SHALL create an invoice in XML format containing the fulfilled line items with their details (category, product, item id, line number, quantity, unit price).

#### Scenario: Invoice is generated with line item details
- **GIVEN** line items with: itemId=1001, categoryId=CATS, productId=CAT-005, lineNumber=1, quantity=2, unitPrice=29.99
- **WHEN** fulfillment creates an invoice
- **THEN** the invoice XML SHALL include all item details

#### Scenario: Invoice includes order metadata
- **GIVEN** a purchase order being fulfilled
- **WHEN** invoice generation occurs
- **THEN** the invoice SHALL include poId, userId, poDate, and current shipping date

### Requirement: Return serialized invoice to order processing after fulfillment
The system SHALL return the serialized invoice XML document after fulfillment is complete.

#### Scenario: Invoice XML is returned on successful fulfillment
- **GIVEN** fulfilled items with generated invoice
- **WHEN** fulfillment processing completes
- **THEN** the invoice XML string SHALL be returned to the message-driven bean

#### Scenario: Null is returned when no items fulfilled
- **GIVEN** a purchase order with no available inventory
- **WHEN** fulfillment completes with no fulfilled items
- **THEN** null SHALL be returned instead of an invoice

### Requirement: Inventory update screen displays items with quantities and update options
The system SHALL display an inventory update screen that lists all current inventory items with their existing quantities and allows administrators to enter new quantities. The screen SHALL display item ID, existing quantity, a text input for new quantity, and a checkbox to mark items for update.

#### Scenario: Inventory screen shows all items with quantities
- **GIVEN** an administrator accessing the inventory update screen
- **WHEN** the displayinventory.jsp page loads
- **THEN** the screen SHALL display: item ID, existing quantity, input field for new quantity, update checkbox for each item

#### Scenario: Admin can select items for update
- **GIVEN** the inventory update screen with multiple items
- **WHEN** an administrator checks the checkbox for selected items and enters new quantities
- **THEN** the form SHALL track which items are selected for update

#### Scenario: Form posts to correct endpoint
- **GIVEN** the inventory update form
- **WHEN** the administrator submits the form
- **THEN** the form SHALL POST to RcvrRequestProcessor with action=updateinventory

#### Scenario: Only administrators can access inventory screen
- **GIVEN** the inventory update screen
- **WHEN** request.isUserInRole("administrator") is checked
- **THEN** only users with administrator role SHALL see the inventory update form

### Requirement: Supplier home page displays navigation and module information
The system SHALL display a home screen with a heading, description of the supplier module, and buttons to display inventory or logout.

#### Scenario: Home page displays module description
- **GIVEN** a supplier user accessing the home page
- **WHEN** index.jsp is loaded
- **THEN** the page SHALL display heading, description of inventory management capabilities, and navigation options

#### Scenario: Home page provides display inventory button
- **GIVEN** the supplier home page
- **WHEN** the page is displayed
- **THEN** a form button SHALL be available to navigate to the inventory display screen

#### Scenario: Home page provides logout button
- **GIVEN** the supplier home page
- **WHEN** displayed to an authenticated user
- **THEN** a logout form SHALL be available to end the session

