# account-management Specification

## Purpose

TBD - created by archiving change swhm-i-0003-customer-account-profile-man. Update Purpose after archive.

## Requirements

### Requirement: Create customer account

The system SHALL allow customers to create a new account by providing contact information, credit card details, and profile preferences. Upon account creation, the system SHALL automatically create an associated Account entity with status "active" and a Profile entity with default preferences.

#### Scenario: Customer account is created with contact information

- **GIVEN** a customer account creation form
- **WHEN** a customer submits contact information (first/last name, address, phone, email)
- **THEN** a new Customer entity SHALL be created with an Account (status="active") and Profile (with defaults)

#### Scenario: Account status is automatically set to active

- **GIVEN** a new customer account creation
- **WHEN** the account is created
- **THEN** the Account.status SHALL be set to "active"

#### Scenario: Profile is created with default preferences

- **GIVEN** a new customer account creation
- **WHEN** the account is created
- **THEN** the Profile SHALL have preferredLanguage="en_US", favoriteCategory=null, myListPreference=true, bannerPreference=true

### Requirement: Store contact information

The system SHALL store customer contact information including first name, last name, telephone, and email address. Contact information SHALL be associated with exactly one Address entity containing street, city, state, postal code, and country.

#### Scenario: Contact information is stored with customer account

- **GIVEN** a customer account creation form with contact fields
- **WHEN** the customer submits first name, last name, phone, and email
- **THEN** a ContactInfo entity SHALL be created with those values

#### Scenario: Address is associated with contact information

- **GIVEN** contact information being created
- **WHEN** address details (street1, street2, city, state, postal code, country) are provided
- **THEN** an Address entity SHALL be created and associated with the ContactInfo

### Requirement: Store credit card information

The system SHALL store credit card information including card number, card type, and expiry date in MM/YYYY format. Valid card types are "Java(TM) Card", "Duke Express", and "Meow Card".

#### Scenario: Credit card information is stored

- **GIVEN** a customer account creation form with credit card section
- **WHEN** the customer enters card number, selects card type, and enters expiry date
- **THEN** a CreditCard entity SHALL be created with those values

#### Scenario: Expiry date is parsed correctly

- **GIVEN** a credit card with expiryDate="12/2025"
- **WHEN** getExpiryMonth() and getExpiryYear() are called
- **THEN** the system SHALL return "12" for month and "2025" for year

### Requirement: Store profile preferences

The system SHALL store customer profile preferences including preferred language, favorite product category, myList preference, and banner preference. Supported languages are "en_US", "ja_JP", and "zh_CN". Supported categories are "BIRDS", "CATS", "DOGS", "FISH", "REPTILES".

#### Scenario: Profile preferences are stored with defaults

- **GIVEN** a new customer account being created
- **WHEN** profile preferences are not explicitly set
- **THEN** the Profile SHALL have defaults: preferredLanguage="en_US", favoriteCategory=null, myListPreference=true, bannerPreference=true

#### Scenario: Profile preferences are stored with customer selection

- **GIVEN** a customer account creation form with profile section
- **WHEN** the customer selects language, category, and preference checkboxes
- **THEN** a Profile entity SHALL be created with those selected values

### Requirement: Customer account creation form display

The system SHALL present a customer account creation form with three sections: Contact Information (first name, last name, street address line 1 and 2, city, state/province, postal code, country, telephone, email), Credit Card Information (card number, card type selection, expiry month/year), and Profile Information (language selection, favorite category selection, myList enablement checkbox, banners enablement checkbox). The form SHALL post to createcustomer.do with action=create.

#### Scenario: Account creation form displays all required fields

- **GIVEN** a customer accessing the account creation form
- **WHEN** the form is displayed
- **THEN** it SHALL show: contact information fields, credit card fields, profile preference dropdowns/checkboxes, and a submit button

#### Scenario: Form submission creates account

- **GIVEN** a completed account creation form
- **WHEN** the customer submits the form
- **THEN** the system SHALL POST to createcustomer.do and create the customer account

### Requirement: Customer account edit form display

The system SHALL present a customer account edit form with the same sections as the creation form. All fields SHALL be pre-populated with current values from customer.account.contactInfo, customer.account.creditCard, and customer.profile. The form SHALL post to customer.do with action=update.

#### Scenario: Account edit form displays current values

- **GIVEN** a customer accessing their account edit form
- **WHEN** the form is displayed
- **THEN** all fields SHALL be pre-populated with current entity values via expression language

#### Scenario: Form submission updates account

- **GIVEN** a completed account edit form with modified values
- **WHEN** the customer submits the form
- **THEN** the system SHALL POST to customer.do and update all account fields

### Requirement: Address constraints

The system SHALL support address state values of "California", "New York", and "Texas". Supported countries are "USA", "Canada", "Japan", and "China".

#### Scenario: Valid state is stored

- **GIVEN** an address with state="California"
- **WHEN** the address is created
- **THEN** the state SHALL be stored successfully

#### Scenario: Valid country is stored

- **GIVEN** an address with country="Japan"
- **WHEN** the address is created
- **THEN** the country SHALL be stored successfully

### Requirement: Account status field

The system SHALL maintain an Account status field with valid values "active" and "disabled". New accounts are created with status="active".

#### Scenario: Account status is initialized as active

- **GIVEN** a new customer account being created
- **WHEN** the Account entity is created
- **THEN** status SHALL be set to "active"
