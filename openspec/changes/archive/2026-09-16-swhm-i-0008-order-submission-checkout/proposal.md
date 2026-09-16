# Order Placement & Checkout Capability — Proposal

## Summary

Order placement provides the workflow for customers to submit orders with billing, shipping, and payment information. The system accepts customer details, generates unique order IDs, records line items from the shopping cart, clears the cart, and displays confirmation.

## Scope

- Order information form (billing and shipping address capture)
- Billing and shipping information validation
- Customer contact detail capture (names, addresses, email, phone)
- Geographic constraints (state/country dropdowns)
- Order ID generation (UniqueIdGenerator with seed 1001)
- Line item creation from shopping cart
- Order date capture
- Order confirmation display with ID and email
- Cart clearing on successful order placement
- Empty cart error handling (ShoppingCartEmptyOrderException)

## Key Features

- Two-section form (Billing Information, Shipping Information)
- Address fields with maxlength constraints (30 for names, 70 for addresses)
- State validation (CA, NY, TX)
- Country validation (USA, Canada, Japan, China)
- Unique order ID generation starting from seed 1001
- Automatic inclusion of current date as order date
- Line items created from cart with quantity and unit price
- Order confirmation screen displaying order ID and customer email
- Confirmation email sent after successful order placement
- Shopping cart cleared after order submission
- Validation of non-empty cart before order placement

## Risk

- Order ID generation uses hardcoded seed value without re-seeding logic
- No shipping cost calculation visible in order submission
- No tax calculation in order totals
- Address validation relies on dropdown constraints only (no postal code format validation)
- Async notification sending may fail silently

