# Account Management — Implementation Tasks

## 1. Data Model & Schema

- [ ] 1.1 Define Customer entity with userId primary key and relationships to Account and Profile
- [ ] 1.2 Define Account entity with status field and relationships to ContactInfo and CreditCard
- [ ] 1.3 Define ContactInfo entity with givenName, familyName, email, telephone fields
- [ ] 1.4 Define Address entity with street (two lines), city, state, zip, country fields
- [ ] 1.5 Define Profile entity with preferredLanguage, favoriteCategory, myListPreference, bannerPreference fields
- [ ] 1.6 Declare cascading delete relationships (Customer→Account, Customer→Profile, Account→ContactInfo, Account→CreditCard, ContactInfo→Address)
- [ ] 1.7 Create database migrations for all five entity tables
- [ ] 1.8 Verify primary key and foreign key constraints are correct

## 2. Business Logic & Rules

- [ ] 2.1 Implement Customer creation workflow with automatic Account and Profile provisioning
- [ ] 2.2 Implement automatic Address creation when ContactInfo is created with no parameters
- [ ] 2.3 Implement Account status tracking (at minimum, "Active" status must be supported)
- [ ] 2.4 Implement Profile defaults (preferred language, favorite category, feature toggles)
- [ ] 2.5 Implement optional StreetName2 field in Address (not serialized if empty)
- [ ] 2.6 Implement Customer update workflow for modifying contact, address, and profile data
- [ ] 2.7 Implement transaction management with Required attribute for all entity operations
- [ ] 2.8 Implement cascading delete semantics (deleting Customer cascades to Account, Profile, ContactInfo, Address, CreditCard)

## 3. Validation & Business Rules

- [ ] 3.1 Implement required field validation for ContactInfo (given name, family name, telephone, street1, city, state, postal code, country)
- [ ] 3.2 Implement email as optional in ContactInfo (null allowed, but trimmed if present)
- [ ] 3.3 Implement maxlength constraints: street=70, city=70, postal code=12
- [ ] 3.4 Implement state/province dropdown with at least: California, New York, Texas
- [ ] 3.5 Implement country dropdown with at least: United States, Canada, Japan, China
- [ ] 3.6 Implement language preference options: English (en_US), Japanese (ja_JP), Chinese (zh_CN)
- [ ] 3.7 Implement favorite category options: Birds, Cats, Dogs, Fish, Reptiles
- [ ] 3.8 Implement MyList and banner preference toggles (boolean, default OFF)
- [ ] 3.9 Implement server-side validation for credit card (number, type, expiry all required)
- [ ] 3.10 Implement server-side validation that throws MissingFormDataException on validation failure

## 4. Service APIs

- [ ] 4.1 Define CustomerService with methods for create, read, update, delete customer accounts
- [ ] 4.2 Define AccountService with methods for account status queries and updates
- [ ] 4.3 Define ContactInfoService with methods for create, read, update contact information
- [ ] 4.4 Define AddressService with methods supporting three creation patterns (six fields, Address object, no-arg)
- [ ] 4.5 Define ProfileService with methods for querying and updating user preferences
- [ ] 4.6 Implement service methods with proper exception handling and transaction support
- [ ] 4.7 Document expected exceptions (e.g., CreateException, RemoveException, FinderException)

## 5. User Interface

- [ ] 5.1 Create customer creation form (create_customer page) with all required sections
- [ ] 5.2 Implement Contact Information section with first name, last name, email, telephone fields
- [ ] 5.3 Implement Address section with street (line 1 & 2), city, state, postal code, country
- [ ] 5.4 Implement Credit Card section with card number, type, expiry month/year
- [ ] 5.5 Implement Profile Information section with language, favorite category, feature toggle checkboxes
- [ ] 5.6 Create customer edit form (edit_customer page) with identical sections to create form
- [ ] 5.7 Implement form submission handlers (createcustomer.do for create, customer.do for update)
- [ ] 5.8 Implement form prefilling on edit (load existing account data into form fields)
- [ ] 5.9 Implement client-side maxlength constraints via HTML attributes
- [ ] 5.10 Implement error display for validation failures

## 6. Localization

- [ ] 6.1 Support multi-language UI (English, Japanese, Chinese directory variants)
- [ ] 6.2 Create localized versions of create_customer.jsp (en, ja, zh)
- [ ] 6.3 Create localized versions of edit_customer.jsp (en, ja, zh)
- [ ] 6.4 Implement language preference storage in Profile
- [ ] 6.5 Implement language-aware form submission and validation

## 7. Integration & Coordination

- [ ] 7.1 Integrate Account creation with authentication/sign-up flow
- [ ] 7.2 Integrate Account with Payment Processing (CreditCard storage and validation)
- [ ] 7.3 Integrate Account with Order Management (customer reference in order creation)
- [ ] 7.4 Integrate Account with Notifications (customer email stored in ContactInfo)
- [ ] 7.5 Integrate Profile preferences with catalog browsing (favorite category filtering)
- [ ] 7.6 Verify cascading deletes propagate correctly across integrated components

## 8. Testing

- [ ] 8.1 Write unit tests for Customer entity creation
- [ ] 8.2 Write unit tests for Account status updates
- [ ] 8.3 Write unit tests for ContactInfo creation with automatic Address provisioning
- [ ] 8.4 Write unit tests for Address optional StreetName2 handling
- [ ] 8.5 Write unit tests for Profile default preference initialization
- [ ] 8.6 Write unit tests for validation (required fields, maxlength constraints)
- [ ] 8.7 Write integration tests for full customer creation workflow
- [ ] 8.8 Write integration tests for customer account updates
- [ ] 8.9 Write integration tests for cascading deletes
- [ ] 8.10 Write UI tests for form submission and error handling
- [ ] 8.11 Write tests for multi-language form handling
- [ ] 8.12 Test concurrent customer creation (ensure no race conditions on unique userId)
