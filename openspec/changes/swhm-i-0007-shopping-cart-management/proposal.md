# Shopping Cart Management Capability — Proposal

## Summary

Shopping cart provides a temporary container for customers to accumulate items before checkout. The system supports adding items, updating quantities, removing items, and calculating cart totals. Cart operations are session-scoped and cleared upon order placement.

## Scope

- Add items to cart with default or specified quantity
- Remove individual items from cart
- Update item quantities with removal when quantity becomes 0 or negative
- Calculate cart subtotal as sum of (unitCost × quantity)
- Display cart contents with items, quantities, costs, and line totals
- Persist cart in session during shopping
- Clear cart after order placement
- Show empty cart message when no items present

## Key Features

- In-memory session-based cart (no database persistence across sessions)
- Item addition with optional quantity parameter
- Quantity updates with automatic removal on zero/negative
- Line-item total calculation (unitCost × quantity)
- Cart subtotal calculation
- Update Cart button for bulk quantity changes
- Remove links for per-item deletion
- Empty cart message display
- Cart item count tracking

## Risk

- Cart data lost on session timeout or browser close
- No cart persistence or recovery mechanism
- No abandoned cart recovery
- Cart sharing not supported
- No maximum cart size enforced
- No minimum order validation before checkout

