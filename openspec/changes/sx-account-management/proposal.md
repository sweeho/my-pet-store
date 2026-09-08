# Account Management Capability — Proposal

## Summary

Account management enables customers to create and maintain their account profiles, contact information, and preferences. Customers can register new accounts and update their profile at any time.

## Scope

- Customer account creation with contact information capture
- Account profile management with preference storage
- Contact information and address management
- Credit card information storage and management
- Language and category preference settings
- Account status tracking (active/disabled)

## Key Features

- Create customer account with automatic Account and Profile entity creation
- Store contact information (first/last name, address, phone, email)
- Manage address with street, city, state, postal code, country
- Store credit card information with card type and expiry date
- Set language preferences (en_US, ja_JP, zh_CN)
- Select favorite product category (BIRDS, CATS, DOGS, FISH, REPTILES)
- Enable/disable myList and banner preferences
- Edit existing account information

## Risk

- Account status can be "active" or "disabled" but no UI shown for disabling
- Address state/country constrained to specific values via UI
- Credit card storage requires security considerations
- Language preference affects system-wide content display

