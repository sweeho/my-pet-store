# notifications Specification

## Purpose

TBD - created by archiving change swhm-i-0012-customer-notifications-commu. Update Purpose after archive.

## Requirements

### Requirement: Order notification delivery

The system SHALL send email notifications to customers when orders are approved, denied, or completed.

#### Scenario: Customer receives order approval notification

- **GIVEN** an order is approved by administrator
- **WHEN** the approval is processed
- **THEN** an email notification SHALL be sent to the customer email address

#### Scenario: Customer receives order denial notification

- **GIVEN** an order is denied
- **WHEN** the denial is processed
- **THEN** an email notification SHALL be sent to the customer email address

#### Scenario: Customer receives order completion notification

- **GIVEN** an order is fully shipped
- **WHEN** the completion is processed
- **THEN** an email notification SHALL be sent to the customer email address

### Requirement: Notification content

Order notifications SHALL include order ID, customer name, current order status, and relevant order details.

#### Scenario: Notification includes required order information

- **GIVEN** an order notification to be sent
- **WHEN** the email is generated
- **THEN** the email body SHALL include order ID, customer name, and status

### Requirement: Async notification delivery

Notifications SHALL be sent asynchronously via message queue to prevent blocking order processing.

#### Scenario: Notification does not block order status update

- **GIVEN** an order status change triggers a notification
- **WHEN** the notification is queued
- **THEN** the order status update SHALL complete immediately without waiting for email delivery

### Requirement: Customer email retrieval

The system SHALL retrieve the customer email address from the order's associated account contact information.

#### Scenario: Customer email is obtained from account

- **GIVEN** an order with customer account
- **WHEN** a notification is triggered
- **THEN** the customer email SHALL be retrieved from the account ContactInfo
