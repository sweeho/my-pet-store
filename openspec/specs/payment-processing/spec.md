# payment-processing Specification

## Purpose

TBD - created by archiving change swhm-i-0009-payment-credit-card-processi. Update Purpose after archive.

## Requirements

### Requirement: Credit card storage

The system SHALL store credit card information including card number, card type, and expiry date for payment processing.

#### Scenario: Card is stored during checkout

- **GIVEN** a customer providing credit card during checkout
- **WHEN** the card is validated
- **THEN** the card SHALL be stored for authorization

### Requirement: Card expiry validation

The system SHALL validate that credit card expiry dates are not expired at the time of payment.

#### Scenario: Expired card is rejected

- **GIVEN** a card with expiry date in the past
- **WHEN** authorization is attempted
- **THEN** the payment SHALL be rejected due to expiry

#### Scenario: Valid card expiry is accepted

- **GIVEN** a card with future expiry date
- **WHEN** authorization is attempted
- **THEN** the expiry SHALL be considered valid

### Requirement: Card type acceptance

The system SHALL accept only recognized card types (Visa, MasterCard, American Express) and reject unknown types.

#### Scenario: Known card type is accepted

- **GIVEN** a Visa card provided during payment
- **WHEN** card type is validated
- **THEN** the card type SHALL be accepted

### Requirement: Payment authorization

The system SHALL authorize payments by validating card information and sending authorization requests to the payment processor.

#### Scenario: Card is authorized for payment

- **GIVEN** valid card information
- **WHEN** payment is submitted
- **THEN** authorization request SHALL be sent to payment gateway
