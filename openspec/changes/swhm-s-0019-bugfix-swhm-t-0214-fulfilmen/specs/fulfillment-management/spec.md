# fulfillment-management — delta

## ADDED Requirements

### Requirement: Fulfil only approved purchase orders

The system SHALL fulfil a purchase order only while that order is in APPROVED status. A fulfilment run requested for an order in any other status SHALL leave the order's status, its line items' shipped quantities and inventory quantities unchanged, and SHALL produce no invoice. The line-item requirements of this capability — inventory verification, inventory deduction and shipped-quantity updates — apply only within the fulfilment run of an approved order.

A fulfilment run for an order that does not exist SHALL be reported as a missing order, which is a different answer from a run refused because the order is not approved.

#### Scenario: A denied order is not fulfilled

- **GIVEN** a purchase order in DENIED status whose line items all have sufficient inventory
- **WHEN** a fulfilment run is requested for that order
- **THEN** the order SHALL remain DENIED, no line item's shipped quantity SHALL change, no inventory SHALL be deducted, and no invoice SHALL be produced

#### Scenario: A pending order is not fulfilled

- **GIVEN** a purchase order in PENDING status, awaiting an administrator's approval, whose line items all have sufficient inventory
- **WHEN** a fulfilment run is requested for that order
- **THEN** the order SHALL remain PENDING, no line item's shipped quantity SHALL change, no inventory SHALL be deducted, and no invoice SHALL be produced

#### Scenario: An approved order is fulfilled

- **GIVEN** a purchase order in APPROVED status whose line items all have sufficient inventory
- **WHEN** a fulfilment run is requested for that order
- **THEN** its line items SHALL be shipped, its inventory SHALL be deducted, and an invoice SHALL be produced

#### Scenario: A fulfilment run naming an order that does not exist is reported as missing

- **GIVEN** an order identifier that matches no purchase order
- **WHEN** a fulfilment run is requested for it
- **THEN** the run SHALL report the order as not found, rather than reporting it as not approved

## MODIFIED Requirements

### Requirement: Mark purchase orders as completed when all items are fulfilled

The system SHALL mark the purchase order status as COMPLETED when all line items of an APPROVED order have sufficient inventory and have been fulfilled. COMPLETED SHALL be reached only from APPROVED. A purchase order that is fulfilled only in part SHALL keep the status it already had, and a purchase order that is already COMPLETED SHALL NOT be completed again.

#### Scenario: Order status transitions to completed

- **GIVEN** an APPROVED purchase order with all line items having sufficient inventory
- **WHEN** fulfillment processing completes successfully
- **THEN** the order status SHALL be set to COMPLETED

#### Scenario: Order status remains pending on partial fulfillment

- **GIVEN** an APPROVED purchase order with one line item lacking inventory
- **WHEN** inventory verification finds insufficient stock
- **THEN** the order status SHALL remain APPROVED

#### Scenario: An already completed order is not completed again

- **GIVEN** a purchase order already in COMPLETED status
- **WHEN** a fulfilment run is requested for it a second time
- **THEN** the order SHALL remain COMPLETED, no further inventory SHALL be deducted, and the run SHALL report that nothing changed
