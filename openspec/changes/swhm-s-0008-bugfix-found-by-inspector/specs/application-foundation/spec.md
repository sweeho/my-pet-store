# application-foundation — delta

## MODIFIED Requirements

### Requirement: Product-branded application shell

The application SHALL identify itself as My Pet Store everywhere a person or a user agent can read its name, and SHALL NOT present the name, placeholder copy, example screens or hosted assets of the boilerplate it was generated from.

#### Scenario: Home page names the product

- **GIVEN** the application is running
- **WHEN** a visitor loads the home page at `/`
- **THEN** the page's level-1 heading reads "My Pet Store", and no boilerplate product name or placeholder hero copy remains anywhere in the rendered page

#### Scenario: Browser tab and web app manifest name the product

- **GIVEN** the application is running
- **WHEN** a user agent loads the home page and fetches the web app manifest the page links
- **THEN** the document title is "My Pet Store", the manifest resolves successfully with its `name` set to "My Pet Store", and the package manifest's `name` field is `my-pet-store`

#### Scenario: Home page requests no third-party asset

- **GIVEN** the application is running
- **WHEN** a visitor loads the home page at `/` and opens the mobile navigation panel
- **THEN** a store-branded mark is rendered in both the header and the panel, and every asset the page requests is served from the application's own origin

#### Scenario: Boilerplate example screens are not reachable

- **GIVEN** the application is running
- **WHEN** a visitor navigates directly to `/users`, to `/users/1`, or to `/users/profile`
- **THEN** each path renders the application's not-found screen, and no page presents the boilerplate's placeholder people or example-route copy

## ADDED Requirements

### Requirement: Application shell navigation

Every navigation and call-to-action control on the home page SHALL lead to a screen the application serves. A control that names no such screen SHALL NOT be presented.

#### Scenario: Primary call to action opens the catalogue

- **GIVEN** a visitor on the home page at `/`
- **WHEN** the visitor activates the primary hero call to action
- **THEN** the browser is on the catalogue screen at `/catalog`

#### Scenario: Sign-in control opens the sign-on screen

- **GIVEN** a visitor on the home page at `/`
- **WHEN** the visitor activates the "Log in" control, whether from the header or from the mobile navigation panel
- **THEN** the browser is on the sign-on screen at `/signon`

#### Scenario: No control leads nowhere

- **GIVEN** a visitor on the home page at `/`
- **WHEN** every navigation and hero link on the page is inspected, in the header and in the mobile navigation panel
- **THEN** each one targets a path the application routes, and none targets a placeholder fragment
