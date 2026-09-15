# internationalization Specification

## Purpose

TBD - created by archiving change swhm-i-0005-multi-language-support. Update Purpose after archive.

## Requirements

### Requirement: Multi-language support

The system SHALL support user interface and catalog content in multiple languages: English (en_US), Japanese (ja_JP), and Simplified Chinese (zh_CN).

#### Scenario: Catalog displayed in selected language

- **GIVEN** a user with language preference set to ja_JP
- **WHEN** the user browses the catalog
- **THEN** category names, product names, and descriptions SHALL be displayed in Japanese

### Requirement: Locale-based content retrieval

All catalog queries SHALL accept a Locale parameter and return language-specific content for that locale. If locale-specific content does not exist, the system SHALL return null for that item.

#### Scenario: Category is retrieved in specified locale

- **GIVEN** a category with English name "Dogs" and Japanese name "犬"
- **WHEN** the system retrieves the category for locale ja_JP
- **THEN** the category name SHALL be "犬"

#### Scenario: Missing locale content returns null

- **GIVEN** a product without German translation
- **WHEN** the system retrieves the product for locale de_DE
- **THEN** the system SHALL return null

### Requirement: Language preference persistence

The system SHALL store and retrieve user language preference in the customer profile. The preference SHALL be applied to all subsequent catalog browsing and communication.

#### Scenario: User language preference is stored

- **GIVEN** a customer who selects Japanese as preferred language
- **WHEN** the preference is saved
- **THEN** subsequent catalog queries SHALL use locale ja_JP by default

### Requirement: Locale parameter propagation

The system SHALL pass Locale through all layers (presentation, service, data access) to ensure consistent language-specific content retrieval.

#### Scenario: Locale is used in all queries

- **GIVEN** a search with query "bird" in locale en_US
- **WHEN** the system executes the search
- **THEN** results SHALL be filtered by locale en_US and returned in English

### Requirement: Language recovery from an untranslated screen

A screen that has nothing to show in the visitor's language SHALL offer a control that changes the language from within that screen. The control SHALL remain usable for as long as the screen is open, however many times the language has already been changed during the visit.

A screen SHALL distinguish content that does not exist from content that exists but has no translation in the language being read, and SHALL NOT present its not-found screen for the second case. This holds for every catalogue screen that shows a single thing, whichever level of the catalogue that thing sits at.

The language-unavailable state SHALL describe its subject as the kind of thing the screen is showing — a category, a product or an item — at every level of the catalogue. No level SHALL be described as a level it is not.

#### Scenario: Language can be changed from the untranslated screen

- **GIVEN** a visitor on a catalogue screen that has no content in the language they are reading
- **WHEN** the visitor opens the screen's "Change language" control and selects another language
- **THEN** the screen is shown in the selected language

#### Scenario: The control still works after the language has already been changed

- **GIVEN** a visitor who has already changed the language once during this visit and is now on a catalogue screen with no content in the language they are reading
- **WHEN** the visitor opens the screen's "Change language" control again and selects a further language
- **THEN** the language options are presented and the screen is shown in the newly selected language

#### Scenario: An untranslated product offers recovery instead of a not-found screen

- **GIVEN** a product that exists in the catalogue but has no translation in the language the visitor is reading
- **WHEN** the visitor opens that product's screen in that language
- **THEN** the screen presents the language-unavailable state — a heading naming that language, a body stating that nothing has gone wrong, a control that shows the product in English (US) and a control that changes the language — and the not-found screen is not presented

#### Scenario: The untranslated screen names the kind of thing it is describing

- **GIVEN** a visitor on the screen of a product that has no translation in the language they are reading
- **WHEN** the language-unavailable state is presented
- **THEN** its text refers to the product, and does not describe it as an item

#### Scenario: An untranslated category is described as a category

- **GIVEN** a visitor on the screen of a category that exists in the catalogue but has no translation in the language they are reading
- **WHEN** the language-unavailable state is presented
- **THEN** its text refers to the category, and does not describe it as an item or as a product

#### Scenario: An untranslated item is still described as an item

- **GIVEN** a visitor on the screen of an item that exists in the catalogue but has no translation in the language they are reading
- **WHEN** the language-unavailable state is presented
- **THEN** its text refers to the item, and does not describe it as a category or as a product

#### Scenario: A catalogue entry that does not exist still reaches the not-found screen

- **GIVEN** an identifier that names no category, product or item in the catalogue
- **WHEN** a visitor opens that identifier's screen in any supported language
- **THEN** the not-found screen is presented, and the language-unavailable state is not
