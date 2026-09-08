# Shopping Cart Capability — Proposal

## Summary

Shopping cart functionality enables customers to add items to a cart, manage quantities, view cart contents with pricing, and prepare for order placement. The cart maintains items as line items with product references and quantities.

## Scope

- Item addition and removal from shopping cart
- Quantity management and updates
- Cart display with subtotal calculation
- Line item entity support
- XML serialization of cart line items
- XML validation constraints on quantities

## Key Features

- Add items by item ID with optional quantity parameter
- Remove items from cart
- Update item quantities with validation (minimum 1)
- Display cart contents with unit costs and quantities
- Calculate cart subtotal as sum of (unitCost × quantity)
- Store line items with category, product, and item identifiers
- Support XML serialization conforming to DTD schema

## Risk

- Quantity validation must enforce minimum of 1 item per line
- Cart subtotal calculation must account for all items
- Line number constraints (>= 0) and quantity constraints (> 0) enforced via XSD
