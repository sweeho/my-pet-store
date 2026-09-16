# shopping-cart Specification

## Purpose

TBD - created by archiving change swhm-i-0007-shopping-cart-management. Update Purpose after archive.

## Requirements

### Requirement: Add items to shopping cart

The system SHALL allow customers to add items to their shopping cart by specifying an item ID and optional quantity. If quantity is not specified, the system SHALL default to 1.

#### Scenario: Item is added with specified quantity

- **GIVEN** a customer viewing product details for item ID 1001
- **WHEN** the customer clicks "Add to Cart" with quantity 3
- **THEN** 3 units of item 1001 SHALL be added to the cart

#### Scenario: Item is added with default quantity

- **GIVEN** a customer clicking "Add to Cart" without specifying quantity
- **WHEN** the add action completes
- **THEN** 1 unit of the item SHALL be added to the cart

#### Scenario: Duplicate item increases quantity

- **GIVEN** a cart containing 2 units of item 1001
- **WHEN** the customer adds 1 more unit of item 1001
- **THEN** the cart SHALL contain 3 units total of item 1001

### Requirement: Remove items from shopping cart

The system SHALL allow customers to remove individual items from their shopping cart by specifying an item ID.

#### Scenario: Item is removed from cart

- **GIVEN** a cart containing 3 items of different types
- **WHEN** the customer removes item ID 1001
- **THEN** item 1001 SHALL be removed and the cart SHALL contain 2 remaining items

#### Scenario: Empty cart is handled

- **GIVEN** a cart containing 1 item
- **WHEN** that item is removed
- **THEN** the cart SHALL be empty and display "Your Shopping Cart is Empty."

### Requirement: Update item quantities in shopping cart

The system SHALL allow customers to update the quantity of items in their cart. If quantity is set to 0 or negative, the item SHALL be removed from the cart.

#### Scenario: Quantity is updated to positive value

- **GIVEN** a cart item with quantity 3
- **WHEN** the customer updates the quantity to 5
- **THEN** the cart SHALL show 5 units of that item

#### Scenario: Quantity is set to zero removes item

- **GIVEN** a cart item with quantity 2
- **WHEN** the customer updates the quantity to 0
- **THEN** the item SHALL be removed from the cart

#### Scenario: Quantity is set to negative removes item

- **GIVEN** a cart item with quantity 2
- **WHEN** the customer updates the quantity to -1
- **THEN** the item SHALL be removed from the cart

### Requirement: Calculate cart subtotal

The system SHALL calculate the cart subtotal as the sum of (unitCost × quantity) for all items in the cart.

#### Scenario: Subtotal is calculated for single item

- **GIVEN** a cart containing 1 item with unitCost $10.00 and quantity 3
- **WHEN** the cart is displayed
- **THEN** the subtotal SHALL be $30.00

#### Scenario: Subtotal is calculated for multiple items

- **GIVEN** a cart with: item1 ($10 × 2 = $20), item2 ($5 × 4 = $20)
- **WHEN** the cart is displayed
- **THEN** the subtotal SHALL be $40.00

#### Scenario: Subtotal updates when quantity changes

- **GIVEN** a cart with subtotal $40.00
- **WHEN** a customer updates an item quantity from 2 to 3
- **THEN** the subtotal SHALL recalculate to reflect the new total

### Requirement: Shopping cart display with items and controls

The shopping cart screen SHALL display items with their names, quantities, unit costs, and line totals. The screen SHALL provide an "Update Cart" button for batch quantity changes and remove links for each item. An empty cart message is shown when cart.count == 0.

#### Scenario: Cart displays populated items

- **GIVEN** a cart containing 2 items
- **WHEN** the cart page is displayed
- **THEN** a table SHALL show both items with columns for: name, unit cost, quantity input, line total

#### Scenario: Remove link is available per item

- **GIVEN** a populated cart displayed on screen
- **WHEN** the user views the cart
- **THEN** each item SHALL have a remove link/button for deletion

#### Scenario: Update Cart button submits quantity changes

- **GIVEN** a customer who has edited quantities in the cart
- **WHEN** the customer clicks "Update Cart"
- **THEN** the cart SHALL be updated with new quantities and redisplayed

#### Scenario: Empty cart displays message

- **GIVEN** a customer with an empty shopping cart
- **WHEN** the cart page is displayed
- **WHEN** cart.count == 0
- **THEN** the message "Your Shopping Cart is Empty." SHALL be shown with no table

#### Scenario: Cart subtotal is displayed

- **GIVEN** a populated shopping cart
- **WHEN** the cart page is displayed
- **THEN** the cart subtotal SHALL be shown below the items table

### Requirement: Clear cart after order placement

The system SHALL clear all items from the customer's shopping cart upon successful order placement.

#### Scenario: Cart is cleared after order creation

- **GIVEN** a customer with items in their shopping cart
- **WHEN** the order is successfully placed
- **THEN** the shopping cart SHALL be empty (cart.count = 0)

### Requirement: Persist cart in session

The system SHALL maintain the shopping cart throughout the customer session, allowing cart contents to persist as the customer navigates between pages.

#### Scenario: Cart persists across page navigation

- **GIVEN** a customer who added items to cart
- **WHEN** the customer navigates to different pages
- **THEN** the cart contents SHALL remain unchanged and accessible
