# Account Management — Design Document

## Data Model Architecture

### Entity Hierarchy

```
Customer (root entity)
├── Account
│   ├── ContactInfo
│   │   └── Address
│   └── CreditCard
└── Profile
```

Each Customer serves as the root aggregate; all other entities are logically owned by and cascade-deleted with the Customer.

### CMP Persistence

All entities use Container-Managed Persistence (CMP 2.x) via EJB. No hand-written SQL or ORM.

**Entity Definitions:**

| Entity | CMP Fields | Primary Key | Relationships |
|--------|-----------|-------------|----------------|
| **Customer** | userId | userId | CMR: account, profile |
| **Account** | status | (generated) | CMR: customer, contactInfo, creditCard |
| **ContactInfo** | givenName, familyName, email, telephone | (generated) | CMR: account, address |
| **Address** | streetName1, streetName2, city, state, zipCode, country | (Object - ambiguous) | CMR: contactInfo |
| **Profile** | preferredLanguage, favoriteCategory, myListPreference, bannerPreference | (generated) | CMR: customer |

**Note**: AddressEJB has an ambiguous primary key declaration (`prim-key-class=java.lang.Object`). This is unusual and its semantics are unclear; Address appears to be accessed only through its ContactInfo relationship, not independently.

## Workflow Sequences

### Customer Creation Workflow

```
User submits create_customer.jsp form
  ↓
CustomerHTMLAction.perform(action="create")
  ├─ extractContactInfo(form, "_a") → ContactInfo
  ├─ extractProfileInfo(form) → ProfileInfo
  ├─ extractCreditCard(form) → CreditCard
  └─ CustomerEvent(CREATE, ...)
    ↓
CustomerEJB.ejbCreate(userId)
  ↓
CustomerEJB.ejbPostCreate(userId)
  ├─ AccountLocalHome.create(Active)
  │   └─ Triggers AccountEJB.ejbCreate() → Account with status="Active"
  └─ ProfileLocalHome.create(defaults)
      └─ Triggers ProfileEJB.ejbCreate() → Profile with language/category/boolean defaults
```

All operations in a single transaction (Required attribute ensures atomicity).

### Customer Update Workflow

```
User submits edit_customer.jsp form
  ↓
CustomerHTMLAction.perform(action="update")
  ├─ extractContactInfo(form, "_a")
  ├─ extractProfileInfo(form)
  └─ extractCreditCard(form)
    ↓
Existing Account/ContactInfo/Profile entities updated
```

**Gap**: The implementation details of the update path (which setter methods are called, transaction handling) are not fully visible in the extracted IR.

## Validation Architecture

### Field-Level Validation

**ContactInfo (Required):**
- Given Name: required, non-empty
- Family Name: required, non-empty
- Telephone: required, non-empty
- Email: optional (null allowed)
- Street Address (line 1): required, maxlength 70
- City: required, maxlength 70
- State/Province: required, from dropdown list
- Postal Code: required, maxlength 12
- Country: required, from dropdown list

**Address (Optional field):**
- StreetName2 is optional; only serialized to XML if non-empty

**CreditCard:**
- Number: required (but validation logic has defects — see findings)
- Type: required (but validation logic has defects)
- Expiry: required (but validation logic has defects)

### Validation Implementation

Validation occurs in `CustomerHTMLAction.extractContactInfo()` and `extractCreditCard()`. If validation fails, a `MissingFormDataException` is raised and an error attribute is set on the request.

**Known Issue**: Credit card validation has logic errors (lines 141-179 of CustomerHTMLAction.java check creditCardNumber three times instead of checking each field). This is a defect that should be fixed.

## Preference & Localization

### Language Options

Supported languages (from profile):
- English (en_US)
- Japanese (ja_JP)
- Chinese (zh_CN)

Language is stored in Profile.preferredLanguage and used to adapt UI rendering.

### Product Category Preferences

Favorite category options (from profile):
- Birds
- Cats
- Dogs
- Fish
- Reptiles

### Feature Toggles

**MyList**: When enabled, favorite items and categories are more prominent in the UI
**Banners**: When enabled, pet tips banners are displayed based on user preferences

Both are boolean preferences stored in Profile; default to OFF (unchecked).

## Geographic Constraints

### State/Province List

Sample states shown in forms (others may exist):
- California
- New York
- Texas

### Country List

Countries supported:
- United States
- Canada
- Japan
- China

## Transaction Management

All entity operations are container-managed with `trans-attribute=Required`. This ensures:
- Every method call either reuses an existing transaction or creates a new one
- Counter increments (for unique IDs) are atomic
- Entity updates are never partially committed

## Authorization

No role-based authorization is enforced at the EJB level. All methods are marked `unchecked`, meaning:
- Any authenticated user can create/read/update accounts
- Authorization decisions (if any) are made at the application layer (e.g., user can only update their own account)

## User Interface

The account management capability uses two primary JSP pages:

**create_customer.jsp** — Customer sign-up form with sections:
- Contact Information (first name, last name, email, telephone)
- Address (street 1&2, city, state, postal code, country)
- Credit Card (number, type, expiry month/year)
- Profile Information (language, favorite category, MyList toggle, banners toggle)
- Form action: POST to createcustomer.do with action=create

**edit_customer.jsp** — Account update form with identical sections to create_customer.jsp
- Form action: POST to customer.do with action=update
- Prefills fields from existing account data

### Form Field Constraints

All constraint values are applied at the HTML level (maxlength, select dropdowns):
- Street address: maxlength="70"
- City: maxlength="70"
- Postal code: maxlength="12"
- State/Province: select dropdown (required)
- Country: select dropdown (required)
- Language: select dropdown (default English)
- Favorite Category: select dropdown (default first option)

**Gap**: No server-side validation of maxlength constraints found in the bean code; client-side constraints alone are insufficient.

## Known Issues & Ambiguities

1. **Address Primary Key**: AddressEJB uses `prim-key-class=java.lang.Object`, which is ambiguous. Normal CMP entities use a concrete type (String, Integer, or a key class). This suggests Address is not meant to be looked up independently, only via its CMR relationship to ContactInfo.

2. **Credit Card Validation Bug**: The extractCreditCard method in CustomerHTMLAction has a logic error where card type and expiry validation always check creditCardNumber instead of their respective fields.

3. **Account Creation Overloads**: AccountEJB has two ejbCreate overloads (one with status only, one with status+contactInfo+creditCard), but the three-parameter form's usage is unclear.

4. **Multi-Language Form Handling**: JSP references localized directories (zh, ja) with identical form structure, but the flow of multi-language form submission and validation is not documented.

5. **Country Field Optionality**: Address.dtd marks Country as optional (Country?), but JSP forms and validation treat it as required. This conflict is unresolved.

6. **Update Workflow Internals**: The update action is recognized in CustomerHTMLAction, but the exact EJB calls and persistence semantics are not visible in the extracted code.

## Implementation Notes

- All entities use local interfaces only (no remote access)
- ServiceLocator pattern used for EJB lookups in ContactInfoEJB.ejbPostCreate()
- No explicit caching strategy visible
- No explicit optimistic/pessimistic locking strategy visible
- Cascading deletes are container-managed via CMR relationships
