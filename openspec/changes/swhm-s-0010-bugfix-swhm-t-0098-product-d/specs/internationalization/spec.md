# internationalization — delta

## MODIFIED Requirements

### Requirement: Language recovery from an untranslated screen

A screen that has nothing to show in the visitor's language SHALL offer a control that changes the language from within that screen. The control SHALL remain usable for as long as the screen is open, however many times the language has already been changed during the visit.

A screen SHALL distinguish content that does not exist from content that exists but has no translation in the language being read, and SHALL NOT present its not-found screen for the second case. This holds for every catalogue screen that shows a single thing, whichever level of the catalogue that thing sits at.

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

#### Scenario: A catalogue entry that does not exist still reaches the not-found screen

- **GIVEN** an identifier that names no category, product or item in the catalogue
- **WHEN** a visitor opens that identifier's screen in any supported language
- **THEN** the not-found screen is presented, and the language-unavailable state is not
