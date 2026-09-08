# Account Management — Design Document

## Entity Hierarchy

**Customer (root)** — userId (PK, String)
  ├─ Account — status ("active" or "disabled")
  │   ├─ ContactInfo — givenName, familyName, telephone, email
  │   │   └─ Address — streetName1, streetName2, city, state, zipCode, country
  │   └─ CreditCard — cardNumber, cardType, expiryDate (MM/YYYY)
  └─ Profile — preferredLanguage, favoriteCategory, myListPreference, bannerPreference

## Account Lifecycle

1. **Customer Creation** — ejbCreate(userId) called
2. **Account Auto-Creation** — ejbPostCreate creates Account with status "active" and default Profile
3. **Data Population** — updateCustomer() populates ContactInfo, CreditCard, Profile from form
4. **Updates** — subsequent updateCustomer() calls modify existing entities

## Profile Defaults

- preferredLanguage: "en_US"
- favoriteCategory: null
- myListPreference: true
- bannerPreference: true

## Supported Values

**Languages:** en_US, ja_JP, zh_CN

**Categories:** BIRDS, CATS, DOGS, FISH, REPTILES

**States (Address):** California, New York, Texas

**Countries:** USA, Canada, Japan, China

**Card Types:** Java(TM) Card, Duke Express, Meow Card

## Account Status

Valid statuses defined in AccountLocalHome:
- "active" — account is operational
- "disabled" — account is suspended/inactive

## Credit Card Expiry Parsing

Expiry date stored as string in MM/YYYY format. Accessor methods parse the string:
- getExpiryMonth() — substring before "/" or default "01"
- getExpiryYear() — substring after "/" or default "2010"

## Form Actions

**Create Account:** POST to createcustomer.do with action=create

**Edit Account:** POST to customer.do with action=update

All fields propagate through CustomerEvent payload and updateCustomer() orchestration.
