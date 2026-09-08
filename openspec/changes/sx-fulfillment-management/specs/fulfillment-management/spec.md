## ADDED Requirements

### Requirement: Purchase order entity
The system SHALL maintain purchase orders with order ID, customer identification, contact information, shipping address, line items, and status tracking.

#### Scenario: Purchase order stores customer and shipping data
- **GIVEN** an approved order with customer contact and address
- **WHEN** the system creates a purchase order
- **THEN** the order SHALL retain customer information, contact details, and shipping address

### Requirement: Line item quantity tracking
The system SHALL track both ordered and shipped quantities for each line item. The quantityShipped field SHALL be incremented when supplier invoices are received.

#### Scenario: Shipped quantity is updated from invoice
- **GIVEN** a line item with quantity=10, quantityShipped=0
- **WHEN** an invoice arrives with shipment of 5 units
- **THEN** quantityShipped SHALL be incremented to 5

### Requirement: Supplier PO generation
When an order is approved, the system SHALL generate a supplier purchase order containing the order ID, shipping address, and all line items with their ordered quantities.

#### Scenario: PO is generated from approved order
- **GIVEN** an approved customer order
- **WHEN** the system processes the approval
- **THEN** a supplier PO SHALL be created with customer shipping address and all line item quantities

### Requirement: Order completion detection
The system SHALL determine order fulfillment completion: an order is complete only when all line items have been shipped in their entirety (quantity == quantityShipped for every line item).

#### Scenario: Order is marked complete when fully shipped
- **GIVEN** an order with 2 line items: item1 (qty=5), item2 (qty=3)
- **WHEN** invoices arrive and cumulative shipments reach item1=5, item2=3
- **THEN** the order status SHALL be updated to COMPLETED

#### Scenario: Order is partial when incompletely shipped
- **GIVEN** an order with 2 line items each quantity=10
- **WHEN** invoice arrives with shipments of 7 and 10 respectively
- **THEN** the order status SHALL be SHIPPED_PART (first item incomplete)

### Requirement: Invoice processing for shipments
The system SHALL process supplier invoices by updating shipped quantities for line items and determining order completion status.

#### Scenario: Invoice updates shipment tracking
- **GIVEN** an invoice for orderID with line item shipment quantities
- **WHEN** the system processes the invoice
- **THEN** quantityShipped for each line item SHALL be updated and order status SHALL be re-evaluated

### Requirement: Partial shipment support
The system SHALL support multiple partial shipments for a single order. Each invoice increments the quantityShipped total until all quantities reach their ordered amounts.

#### Scenario: Multiple invoices accumulate shipments
- **GIVEN** an order with line item qty=100, currently quantityShipped=40
- **WHEN** a new invoice arrives with 30 units shipped
- **WHEN** the system processes the invoice
- **THEN** quantityShipped SHALL become 70 (cumulative)

### Requirement: Order status workflow
The system SHALL maintain order status through the fulfillment lifecycle: PENDING → APPROVED → (DENIED or SHIPPED_PART → COMPLETED).

#### Scenario: Order transitions through status states
- **GIVEN** an order created in PENDING state
- **WHEN** it is approved
- **THEN** status becomes APPROVED
- **WHEN** first invoice arrives
- **THEN** status becomes SHIPPED_PART or COMPLETED depending on fulfillment
