# Account Management Capability — Proposal

## Summary

The Account Management capability enables customers to create and manage user accounts with associated contact information, addresses, and personal preferences. This is the foundation for customer identity and account state within the application.

## Scope

This specification defines:
- **Customer entity creation and management** — unique customer identity with userId primary key
- **Account creation and status tracking** — automatic account provisioning linked to each customer
- **Contact information storage** — given name, family name, email, telephone linked to address
- **Address management** — street, city, state/province, postal code, country with field constraints
- **Profile preferences** — language selection, favorite product category, feature toggles (MyList, banners)
- **Workflows** — customer creation with cascading entity creation, customer account updates
- **Validation** — required field validation for contact and address information

## Key Entities

| Entity | Role | Key Fields |
|--------|------|-----------|
| Customer | Root entity for a user account | userId (PK) |
| Account | Account state and linked data | status, links to ContactInfo + CreditCard |
| ContactInfo | Name and contact details | givenName, familyName, email, telephone, Address link |
| Address | Full mailing address | streetName1, streetName2, city, state, zipCode, country |
| Profile | User preferences | preferredLanguage, favoriteCategory, myListPreference, bannerPreference |

## Key Relationships

- **Customer 1:1 Account** — cascading delete (account deleted when customer deleted)
- **Customer 1:1 Profile** — cascading delete (profile deleted when customer deleted)
- **Account 1:1 ContactInfo** — cascading delete (contact deleted when account deleted)
- **Account 1:1 CreditCard** — cascading delete (card deleted when account deleted)
- **ContactInfo 1:1 Address** — cascading delete (address deleted when contact deleted)

## Integration Points

- **Authentication**: Account creation follows user sign-up; assumes authentication layer exists
- **Payment Processing**: CreditCard is stored on Account; payment validation happens separately
- **Order Management**: Customer account is referenced during order creation and checkout
- **Internationalization**: Profile stores language preference; UI rendering adapts per language

## Risk & Constraints

- **Business Risk**: Account status is critical; invalid status values could break workflows
- **Data Risk**: PII (name, address, email) requires secure storage and handling
- **Operational**: Cascading deletes must be atomic; partial deletes could corrupt data
- **Validation**: Address field constraints (maxlength) are enforced at UI only; no server-side validation found

## Dependencies

- **Upstream**: None (foundational capability)
- **Downstream**: Order Management, Payment Processing, Notifications all depend on Account Management
