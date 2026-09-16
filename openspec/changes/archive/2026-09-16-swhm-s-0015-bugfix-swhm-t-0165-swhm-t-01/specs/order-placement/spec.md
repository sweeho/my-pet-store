# order-placement — delta

## MODIFIED Requirements

### Requirement: Order confirmation screen displays order ID and email

Upon successful order placement, the system SHALL display a confirmation screen with the order ID and customer email address, confirming that a confirmation email will be sent.

The identifier and email address the confirmation screen shows SHALL be the ones the placement that reached it produced. Submitting a valid order SHALL carry that placement's result through to the confirmation screen; the screen SHALL NOT be reached without it. A confirmation screen that has no placement result to show SHALL omit the identifier and the email line rather than present a placeholder or a stale value.

#### Scenario: Confirmation screen shows order ID

- **GIVEN** a successfully placed order with ID 1005
- **WHEN** the order confirmation screen is displayed
- **THEN** the screen SHALL show "Your order Id is 1005" (using orderresponse.orderId)

#### Scenario: Confirmation screen shows customer email

- **GIVEN** an order placed by customer user@example.com
- **WHEN** the confirmation screen is displayed
- **THEN** the screen SHALL show "You should receive a confirmation e-mail soon at user@example.com"

#### Scenario: Confirmation indicates email will be sent

- **GIVEN** the order confirmation screen
- **WHEN** displayed after order placement
- **THEN** a message SHALL confirm "You should receive a confirmation e-mail soon at [email address]"

#### Scenario: Submitting a valid order carries that placement's identifier to the confirmation screen

- **GIVEN** a signed-on shopper with a populated cart who has completed the billing and shipping sections of the order form
- **WHEN** the shopper submits the order and the placement succeeds
- **THEN** the confirmation screen SHALL show the identifier that placement returned, in its labelled order-id group, and SHALL show the billing email the order was placed with

#### Scenario: A second order's confirmation shows that order's own identifier

- **GIVEN** a shopper who has already placed one order and confirmed it, and who then places a second order in the same session
- **WHEN** the second placement succeeds
- **THEN** the confirmation screen SHALL show the second order's own identifier, higher than the first order's, and not a repeated or fixed value

#### Scenario: A confirmation screen reached without a placement result shows no identifier

- **GIVEN** the confirmation screen opened with no placement result available to it
- **WHEN** the screen is displayed
- **THEN** it SHALL render its acknowledgement without an order-id group and without the confirmation-email line, and SHALL NOT present a placeholder identifier
