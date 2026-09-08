## ADDED Requirements

### Requirement: Automatic order approval for small orders
The system SHALL automatically approve orders based on total price and customer locale. Orders with totals less than USD 500 (US locale) or JPY 50,000 (Japan locale) SHALL be immediately approved without administrator intervention.

#### Scenario: Small US order is auto-approved
- **GIVEN** an order from US locale with total $350
- **WHEN** the order is submitted
- **THEN** the order status SHALL be automatically set to APPROVED

#### Scenario: Small JP order is auto-approved
- **GIVEN** an order from Japan locale with total ¥40,000
- **WHEN** the order is submitted
- **THEN** the order status SHALL be automatically set to APPROVED

### Requirement: Pending approval for large orders
Orders exceeding the auto-approval threshold SHALL be marked PENDING and require administrator review before proceeding to fulfillment.

#### Scenario: Large order requires admin approval
- **GIVEN** an order from US locale with total $750
- **WHEN** the order is submitted
- **THEN** the order status SHALL be set to PENDING, awaiting administrator review

### Requirement: Administrator order approval
Administrators SHALL be able to review pending orders and approve or deny them, determining their progression to fulfillment.

#### Scenario: Administrator approves pending order
- **GIVEN** a pending order awaiting review
- **WHEN** an administrator approves the order
- **THEN** the order status SHALL change to APPROVED and fulfillment SHALL proceed

#### Scenario: Administrator denies order
- **GIVEN** a pending order under review
- **WHEN** an administrator denies the order
- **THEN** the order status SHALL change to DENIED and no fulfillment SHALL occur

### Requirement: Approved order fulfillment trigger
Approved orders SHALL trigger supplier purchase order generation for fulfillment processing.

#### Scenario: Approved order generates supplier PO
- **GIVEN** an order that is approved
- **WHEN** the approval is processed
- **THEN** a supplier purchase order SHALL be generated with order details
