## ADDED Requirements

### Requirement: Customer account creation
The system SHALL support customer account creation where a user provides contact information, billing address, credit card details, and preferences in a single operation.

#### Scenario: A new customer signs up
- **GIVEN** a user accesses the customer creation form
- **WHEN** the user submits the form with all required fields (first name, last name, street address, city, state, postal code, country, telephone, credit card number and type, language preference)
- **THEN** the system SHALL create a new Customer entity with a unique userId, automatically create a linked Account entity with status "Active", automatically create a linked Profile entity with the stated language and category preferences, and automatically create a ContactInfo entity with the provided contact details and an Address entity with the provided address information

#### Scenario: Required contact fields are missing
- **GIVEN** a user submits the customer creation form
- **WHEN** any required field (first name, last name, street address, city, state, postal code, telephone) is empty or missing
- **THEN** the system SHALL raise a MissingFormDataException indicating which fields are missing and return the user to the form without creating any entities

### Requirement: Contact information storage
The system SHALL store customer contact details with given name, family name, email address, and telephone number.

#### Scenario: Contact information is created
- **GIVEN** a customer creation request with contact details
- **WHEN** the system processes the request
- **THEN** the system SHALL create a ContactInfo entity with all four fields (givenName, familyName, email, telephone) persisted and retrievable

#### Scenario: Email field is optional
- **GIVEN** a customer creation form with an empty email field
- **WHEN** the form is submitted with all other required fields populated
- **THEN** the system SHALL allow the submission and store the contact information with a null or empty email value

### Requirement: Address information storage
The system SHALL store mailing address with required fields for street (first line), city, state/province, postal code, country, and an optional second street line.

#### Scenario: Address is created with complete information
- **GIVEN** a customer creation request with full address details including both street lines
- **WHEN** the system processes the request
- **THEN** the system SHALL create an Address entity with all six fields stored and both street lines serialized in the address data

#### Scenario: Optional second street line is omitted
- **GIVEN** a customer creation request where only one street address line is provided (second line is empty)
- **WHEN** the system creates and serializes the Address
- **THEN** the system SHALL create the Address with only the first street line populated, and when serialized to XML, the second StreetName element SHALL not be included

### Requirement: Address field constraints
The system SHALL enforce maximum length constraints on address fields.

#### Scenario: Field constraints are enforced
- **GIVEN** user input for an address field
- **WHEN** the field exceeds the maximum allowed length (70 characters for street and city, 12 for postal code)
- **THEN** the system SHALL reject the input and prompt the user to shorten the value

### Requirement: Customer profile preferences
The system SHALL store customer preferences for language, favorite product category, MyList feature toggle, and pet tips banner toggle.

#### Scenario: Profile is created with preferences
- **GIVEN** a customer creation request with profile information (language = "en_US", favorite category = "Dogs", MyList = checked, banners = unchecked)
- **WHEN** the system processes the request
- **THEN** the system SHALL create a Profile entity with preferredLanguage="en_US", favoriteCategory="Dogs", myListPreference=true, and bannerPreference=false

#### Scenario: Default profile preferences are applied
- **GIVEN** a customer creation with no explicit preference overrides
- **WHEN** the system automatically creates a Profile entity
- **THEN** the system SHALL initialize the profile with default values: preferredLanguage=English, favoriteCategory=first option in list, myListPreference=false, bannerPreference=false

### Requirement: Supported language options
The system SHALL support customer language preferences with three required options: English (en_US), Japanese (ja_JP), and Chinese (zh_CN).

#### Scenario: Language option is selected
- **GIVEN** the customer creation form with a language dropdown
- **WHEN** the user selects Japanese
- **THEN** the system SHALL store preferredLanguage="ja_JP" in the Profile entity

### Requirement: Supported product categories
The system SHALL support favorite product category preferences with five required categories: Birds, Cats, Dogs, Fish, and Reptiles.

#### Scenario: Favorite category is set
- **GIVEN** the customer creation form with category selection
- **WHEN** the user selects "Birds"
- **THEN** the system SHALL store favoriteCategory="BIRDS" in the Profile entity

### Requirement: Feature toggles
The system SHALL support independent boolean toggles for MyList feature and pet tips banner display.

#### Scenario: MyList toggle is checked
- **GIVEN** the customer creation form with MyList checkbox
- **WHEN** the checkbox is checked and the form is submitted
- **THEN** the system SHALL store myListPreference=true, enabling prominent display of favorite items and categories

#### Scenario: Banner toggle is unchecked
- **GIVEN** the customer creation form with banner checkbox
- **WHEN** the checkbox is unchecked (default state)
- **THEN** the system SHALL store bannerPreference=false, disabling pet tips banner display

### Requirement: Account entity with status
The system SHALL maintain an Account entity for each Customer with a status field tracking account state.

#### Scenario: Account is created with Active status
- **GIVEN** a new Customer is created
- **WHEN** the system processes the creation
- **THEN** the system SHALL automatically create an associated Account entity with status="Active"

### Requirement: One-to-one relationships with cascading delete
The system SHALL enforce one-to-one relationships between entities such that deleting a parent entity cascades deletion to child entities.

#### Scenario: Deleting a Customer cascades to Account and Profile
- **GIVEN** an existing Customer with linked Account and Profile entities
- **WHEN** the Customer is deleted
- **THEN** the system SHALL automatically delete the associated Account and Profile entities

#### Scenario: Deleting an Account cascades to ContactInfo and CreditCard
- **GIVEN** an existing Account with linked ContactInfo and CreditCard entities
- **WHEN** the Account is deleted
- **THEN** the system SHALL automatically delete the associated ContactInfo and CreditCard entities

#### Scenario: Deleting ContactInfo cascades to Address
- **GIVEN** an existing ContactInfo with linked Address entity
- **WHEN** the ContactInfo is deleted
- **THEN** the system SHALL automatically delete the associated Address entity

### Requirement: Customer account updates
The system SHALL support updating customer account information including contact details, billing address, credit card, and profile preferences.

#### Scenario: Customer updates profile language preference
- **GIVEN** an existing Customer with a Profile set to English
- **WHEN** the customer edits their account and changes the language preference to Japanese
- **THEN** the system SHALL update the Profile entity with preferredLanguage="ja_JP" and the change SHALL persist

#### Scenario: Customer updates address information
- **GIVEN** an existing Customer with an Address entity
- **WHEN** the customer edits their account and changes the city and postal code
- **THEN** the system SHALL update the Address entity with the new city and postal code values

### Requirement: State/Province options
The system SHALL provide a predefined list of state/province options for address entry, including at minimum California, New York, and Texas.

#### Scenario: State option is selected
- **GIVEN** the address entry form with state dropdown
- **WHEN** the user selects "California"
- **THEN** the system SHALL accept and store state="California" in the Address entity

### Requirement: Country options
The system SHALL provide a predefined list of country options for address entry, including at minimum United States, Canada, Japan, and China.

#### Scenario: Country option is selected
- **GIVEN** the address entry form with country dropdown
- **WHEN** the user selects "Japan"
- **THEN** the system SHALL accept and store country="Japan" in the Address entity

### Requirement: Transaction safety for all account operations
The system SHALL execute all Account entity operations (creation, updates, retrievals, deletions) within a transaction context to ensure consistency.

#### Scenario: Customer creation is atomic
- **GIVEN** a customer creation request for a new customer
- **WHEN** the system processes the request and an error occurs partway through (e.g., after Customer creation but before Account creation)
- **THEN** the system SHALL roll back the entire transaction, leaving no partial Customer record in the database

### Requirement: Cascading address creation
The system SHALL automatically create a new Address entity when ContactInfo is created without an explicit Address parameter.

#### Scenario: ContactInfo is created with no parameters
- **GIVEN** a request to create a ContactInfo entity with no arguments
- **WHEN** the creation is processed
- **THEN** the system SHALL automatically create a linked Address entity and associate it with the ContactInfo

### Requirement: Unrestricted account access
The system SHALL allow all authenticated users to invoke account management operations without role-based authorization checks.

#### Scenario: User accesses account management
- **GIVEN** an authenticated user with basic application access
- **WHEN** the user requests to create or update an account
- **THEN** the system SHALL permit the operation without checking for specific roles or permissions (authorization decisions are delegated to the application layer, e.g., users may only update their own account)

### Requirement: Credit card information validation
The system SHALL validate that credit card number, card type, and expiry date are provided and non-empty when creating or updating a customer account.

#### Scenario: Valid credit card is provided
- **GIVEN** a customer creation form with credit card number "4111111111111111", type "Visa", expiry "12/2025"
- **WHEN** the form is submitted
- **THEN** the system SHALL accept the credit card information and pass it to the payment processing component for further validation

#### Scenario: Credit card type or expiry is missing
- **GIVEN** a customer creation form with credit card number provided but card type or expiry date empty
- **WHEN** the form is submitted
- **THEN** the system SHALL raise a validation error and require the user to provide all credit card fields

### Requirement: Address XML serialization
The system SHALL support converting Address objects to XML representations conforming to the Address schema (Address.dtd).

#### Scenario: Address is serialized to XML
- **GIVEN** an Address entity with all fields populated
- **WHEN** the system converts the Address to an XML Document
- **THEN** the XML SHALL include StreetName (repeated if both street lines present), City, State, ZipCode, and Country elements in that order, with the second StreetName omitted if empty
