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

#### Scenario: No page fetches a web font from a third-party host

- **GIVEN** the application is running
- **WHEN** a visitor loads a page and every request the page issues is recorded, together with the link elements in the document's head
- **THEN** no request and no link element — stylesheet, font file, preconnect or prefetch hint — names a host other than the application's own origin, and the page's text is legible in the store's type without any font having been downloaded

#### Scenario: Boilerplate example screens are not reachable

- **GIVEN** the application is running
- **WHEN** a visitor navigates directly to `/users`, to `/users/1`, or to `/users/profile`
- **THEN** each path renders the application's not-found screen, and no page presents the boilerplate's placeholder people or example-route copy
