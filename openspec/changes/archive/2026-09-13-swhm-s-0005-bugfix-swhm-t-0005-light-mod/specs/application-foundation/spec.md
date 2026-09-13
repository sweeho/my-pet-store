# application-foundation — delta

## ADDED Requirements

### Requirement: Legible destructive surface colours

The application's theme tokens SHALL resolve `--destructive-foreground` to a colour distinct from
`--destructive` in every theme, and in the light theme the pair SHALL meet the WCAG 2.1 AA contrast
minimum for normal text of 4.5:1. The project's automated unit suite SHALL fail when either theme
collapses the pair to a single colour.

#### Scenario: Destructive button label is legible in the light theme

- **GIVEN** the application rendered with the light theme active
- **WHEN** a visitor is shown a destructive-variant button
- **THEN** the button's label colour differs from its background colour, and the contrast ratio
  between the two is at least 4.5:1

#### Scenario: Neither theme collapses the destructive pair

- **GIVEN** the application's theme tokens
- **WHEN** either the light or the dark theme is active
- **THEN** the destructive foreground colour and the destructive background colour resolve to
  different colours

#### Scenario: Regression guard rejects an identical pair

- **GIVEN** the project's automated unit suite
- **WHEN** a theme's destructive foreground colour is set to the same value as that theme's
  destructive background colour
- **THEN** the suite reports a failure that names the offending theme
