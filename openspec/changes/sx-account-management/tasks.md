# Account Management — Implementation Tasks

## 1. Core Entities

- [ ] 1.1 Implement Customer entity with userId primary key
- [ ] 1.2 Implement Account entity with status field (active/disabled)
- [ ] 1.3 Implement Profile entity with preferredLanguage, favoriteCategory, myListPreference, bannerPreference
- [ ] 1.4 Implement ContactInfo entity with givenName, familyName, telephone, email
- [ ] 1.5 Implement Address entity with streetName1, streetName2, city, state, zipCode, country
- [ ] 1.6 Implement relationships: Customer→Account, Account→ContactInfo, ContactInfo→Address

## 2. Entity Creation & Relationships

- [ ] 2.1 Implement Customer.ejbCreate(userId) to store userId
- [ ] 2.2 Implement Customer.ejbPostCreate() to auto-create Account and Profile with defaults
- [ ] 2.3 Set Account status to "active" on creation
- [ ] 2.4 Initialize Profile with default values (en_US, null, true, true)
- [ ] 2.5 Implement cascade-delete relationships for ContactInfo→Address and Account→ContactInfo/CreditCard

## 3. Account Workflows

- [ ] 3.1 Implement customer creation workflow via CustomerEJBAction.perform(CREATE event)
- [ ] 3.2 Implement scf.createCustomer(userId) method
- [ ] 3.3 Implement updateCustomer() method to populate Account/ContactInfo/Profile from event
- [ ] 3.4 Implement UPDATE event handling in CustomerEJBAction

## 4. Validation Rules

- [ ] 4.1 Validate supported languages (en_US, ja_JP, zh_CN)
- [ ] 4.2 Validate supported categories (BIRDS, CATS, DOGS, FISH, REPTILES)
- [ ] 4.3 Validate state values (California, New York, Texas)
- [ ] 4.4 Validate country values (USA, Canada, Japan, China)
- [ ] 4.5 Validate card types (Java Card, Duke Express, Meow Card)

## 5. Credit Card Management

- [ ] 5.1 Implement CreditCard entity with cardNumber, cardType, expiryDate
- [ ] 5.2 Parse expiry date in MM/YYYY format
- [ ] 5.3 Implement getExpiryMonth() and getExpiryYear() accessor methods

## 6. Account Creation Form

- [ ] 6.1 Build account creation form with contact information section
- [ ] 6.2 Add credit card information input to creation form
- [ ] 6.3 Add profile preferences (language, category, myList, banners) to form
- [ ] 6.4 Wire form submission to POST createcustomer.do with action=create
- [ ] 6.5 Pre-populate form with default values

## 7. Account Edit Form

- [ ] 7.1 Build account edit form with all fields
- [ ] 7.2 Pre-populate all fields with current entity values via EL expressions
- [ ] 7.3 Wire form submission to POST customer.do with action=update
- [ ] 7.4 Support updates to contact info, address, credit card, and profile

## 8. Integration Testing

- [ ] 8.1 Test customer creation creates Account and Profile
- [ ] 8.2 Test Account created with "active" status
- [ ] 8.3 Test Profile defaults are set correctly
- [ ] 8.4 Test updateCustomer() populates all related entities
- [ ] 8.5 Test account edit updates all fields correctly
- [ ] 8.6 Test language preference change updates profile

