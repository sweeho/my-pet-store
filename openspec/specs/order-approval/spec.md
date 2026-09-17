# order-approval Specification

## Purpose

TBD - created by archiving change swhm-i-0011-order-approval-workflow. Update Purpose after archive.

## Requirements

### Requirement: Auto-approve small orders based on locale and amount

Small orders SHALL be automatically approved based on locale and total price. Orders from US locale with total price less than 500 USD, and orders from Japan locale with total price less than 50,000 JPY SHALL be automatically approved. All other orders SHALL be marked PENDING and await administrator approval.

#### Scenario: US order under $500 is automatically approved

- **GIVEN** a US order with total price $300
- **WHEN** the order is received by the approval system
- **THEN** the order status SHALL be automatically set to APPROVED without manual intervention

#### Scenario: US order over $500 remains pending

- **GIVEN** a US order with total price $600
- **WHEN** the order is received by the approval system
- **THEN** the order status SHALL remain PENDING and require manual approval

#### Scenario: Japan order under ¥50,000 is automatically approved

- **GIVEN** a Japan locale order with total price ¥40,000
- **WHEN** the order is received by the approval system
- **THEN** the order status SHALL be automatically set to APPROVED

#### Scenario: Japan order over ¥50,000 remains pending

- **GIVEN** a Japan locale order with total price ¥60,000
- **WHEN** the order is received by the approval system
- **THEN** the order status SHALL remain PENDING for manual approval

### Requirement: Accept only pending orders for approval or denial

Only purchase orders in PENDING status SHALL be eligible for administrator approval or denial. Orders already in state APPROVED, DENIED, or COMPLETED SHALL be rejected and not re-processed.

#### Scenario: Pending orders are eligible for approval

- **GIVEN** an order with status PENDING
- **WHEN** the approval system processes the order
- **THEN** the order SHALL be eligible for approval or denial

#### Scenario: Approved orders are skipped

- **GIVEN** an order that is already APPROVED
- **WHEN** the approval system receives a re-processing request
- **THEN** the order SHALL be skipped and not re-processed

#### Scenario: Denied orders are skipped

- **GIVEN** an order that is already DENIED
- **WHEN** the approval system receives a re-processing request
- **THEN** the order SHALL be skipped and not re-processed

#### Scenario: Completed orders are skipped

- **GIVEN** an order that is already COMPLETED
- **WHEN** the approval system receives a re-processing request
- **THEN** the order SHALL be skipped and not re-processed

### Requirement: Generate supplier purchase orders for approved orders

When an order is approved, a supplier purchase order SHALL be generated and sent to the supplier queue for fulfillment. The supplier PO SHALL include order ID, order date, shipping address (given name, family name, street, city, state, country, zip code, email, telephone), and all line items (category ID, product ID, item ID, line number, quantity, unit price).

#### Scenario: Supplier PO is generated on order approval

- **GIVEN** an order approved with id=1001, shipping to 123 Main St, City, ST 12345
- **WHEN** the order approval is processed
- **THEN** a supplier purchase order SHALL be generated with order ID, date, and shipping address

#### Scenario: Supplier PO includes all line items

- **GIVEN** an approved order with 3 line items (item IDs: 001, 002, 003)
- **WHEN** the supplier PO is generated
- **THEN** the PO SHALL include all line items with categoryId, productId, itemId, lineNumber, quantity, and unitPrice

#### Scenario: Supplier PO is sent to supplier queue

- **GIVEN** a generated supplier purchase order
- **WHEN** order approval is complete
- **THEN** the PO XML SHALL be sent to the supplier queue for fulfillment processing

### Requirement: Transition order status through approval workflow

The system SHALL transition order status from PENDING to APPROVED or DENIED based on administrator decision or auto-approval logic.

#### Scenario: Order status transitions to APPROVED

- **GIVEN** an order in PENDING status with approval decision
- **WHEN** the approval is committed
- **THEN** the order status SHALL transition to APPROVED

#### Scenario: Order status transitions to DENIED

- **GIVEN** an order in PENDING status with denial decision
- **WHEN** the denial is committed
- **THEN** the order status SHALL transition to DENIED

### Requirement: Send notifications on order approval and denial

The system SHALL queue notifications for approved and denied orders to notify customers of their approval status.

#### Scenario: Notification is queued on approval

- **GIVEN** an order approved by administrator
- **WHEN** the approval is committed
- **THEN** an approval notification SHALL be queued for the customer

#### Scenario: Notification is queued on denial

- **GIVEN** an order denied by administrator
- **WHEN** the denial is committed
- **THEN** a denial notification SHALL be queued for the customer

### Requirement: Orders Approval screen displays pending orders with editable status

The Orders Approval screen SHALL display a table of pending orders with columns for Order ID, User ID, Order Date, Order Amount, and Status. The Status column SHALL be editable via a dropdown selector allowing values PENDING, APPROVED, or DENIED. The screen SHALL provide three buttons: Approve (sets selected rows to APPROVED), Deny (sets selected rows to DENIED), and Commit (sends all changes to the server).

#### Scenario: Approval screen displays all pending orders

- **GIVEN** an administrator accessing the Orders Approval screen
- **WHEN** the screen loads
- **THEN** a table SHALL display all pending orders with ID, User ID, Order Date, Order Amount, Status columns

#### Scenario: Status column is editable via dropdown

- **GIVEN** the Orders Approval screen with orders displayed
- **WHEN** an administrator clicks on a status cell
- **THEN** a dropdown SHALL appear with options PENDING, APPROVED, DENIED

#### Scenario: Approve button sets selected rows to APPROVED

- **GIVEN** the approval screen with one or more orders selected
- **WHEN** the administrator clicks the Approve button
- **THEN** all selected rows' status SHALL be set to APPROVED

#### Scenario: Deny button sets selected rows to DENIED

- **GIVEN** the approval screen with one or more orders selected
- **WHEN** the administrator clicks the Deny button
- **THEN** all selected rows' status SHALL be set to DENIED

#### Scenario: Commit button sends changes to server

- **GIVEN** the approval screen with status changes made
- **WHEN** the administrator clicks the Commit button
- **THEN** all status changes SHALL be sent to the server for processing

#### Scenario: Multiple orders can be bulk-approved

- **GIVEN** the approval screen with 3 pending orders selected
- **WHEN** the administrator clicks Approve and Commit
- **THEN** all 3 orders' status SHALL transition to APPROVED

### Requirement: Orders Approval screen status column displays color-coded status

The Orders Approval screen status column cells SHALL be rendered with background color coding: green for APPROVED status, red for DENIED status, and yellow for PENDING status.

#### Scenario: Status cells display correct background colors

- **GIVEN** the Orders Approval screen with orders in different status states
- **WHEN** the screen displays the table
- **THEN** APPROVED orders SHALL show green background, DENIED orders SHALL show red background, PENDING orders SHALL show yellow background

#### Scenario: Color coding aids visual status identification

- **GIVEN** an administrator reviewing a list of 20 orders
- **WHEN** looking at the status column
- **THEN** color coding SHALL make it easy to visually identify order status without reading the text
