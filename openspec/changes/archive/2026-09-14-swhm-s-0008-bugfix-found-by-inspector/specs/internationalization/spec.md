# internationalization — delta

## ADDED Requirements

### Requirement: Language recovery from an untranslated screen

A screen that has nothing to show in the visitor's language SHALL offer a control that changes the language from within that screen. The control SHALL remain usable for as long as the screen is open, however many times the language has already been changed during the visit.

#### Scenario: Language can be changed from the untranslated screen

- **GIVEN** a visitor on a catalogue screen that has no content in the language they are reading
- **WHEN** the visitor opens the screen's "Change language" control and selects another language
- **THEN** the screen is shown in the selected language

#### Scenario: The control still works after the language has already been changed

- **GIVEN** a visitor who has already changed the language once during this visit and is now on a catalogue screen with no content in the language they are reading
- **WHEN** the visitor opens the screen's "Change language" control again and selects a further language
- **THEN** the language options are presented and the screen is shown in the newly selected language
