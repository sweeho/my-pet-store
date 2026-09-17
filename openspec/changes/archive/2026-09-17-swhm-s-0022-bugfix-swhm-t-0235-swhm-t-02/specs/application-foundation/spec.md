# application-foundation — delta

## MODIFIED Requirements

### Requirement: Product-branded application shell

The application SHALL identify itself as My Pet Store everywhere a person or a user agent can read
its name, and SHALL NOT present the name, placeholder copy, example screens or hosted assets of the
boilerplate it was generated from. It SHALL publish an address only for a screen it intends a visitor
to reach: a component that is not a screen SHALL NOT be reachable at an address of its own, and no
screen SHALL be reachable at more than one address.

#### Scenario: Home page names the product

- **GIVEN** the application is running
- **WHEN** a visitor loads the home page at `/`
- **THEN** the page's level-1 heading reads "My Pet Store", and no boilerplate product name or
  placeholder hero copy remains anywhere in the rendered page

#### Scenario: Browser tab and web app manifest name the product

- **GIVEN** the application is running
- **WHEN** a user agent loads the home page and fetches the web app manifest the page links
- **THEN** the document title is "My Pet Store", the manifest resolves successfully with its `name`
  set to "My Pet Store", and the package manifest's `name` field is `my-pet-store`

#### Scenario: Home page requests no third-party asset

- **GIVEN** the application is running
- **WHEN** a visitor loads the home page at `/`
- **THEN** a store-branded mark is rendered in the page's header, and every asset the page requests
  is served from the application's own origin

#### Scenario: No page fetches a web font from a third-party host

- **GIVEN** the application is running
- **WHEN** a visitor loads a page and every request the page issues is recorded, together with the
  link elements in the document's head

- **THEN** no request and no link element — stylesheet, font file, preconnect or prefetch hint —
  names a host other than the application's own origin, and the page's text is legible in the
  store's type without any font having been downloaded

#### Scenario: Boilerplate example screens are not reachable

- **GIVEN** the application is running
- **WHEN** a visitor navigates directly to `/users`, to `/users/1`, or to `/users/profile`
- **THEN** each path renders the application's not-found screen, and no page presents the
  boilerplate's placeholder people or example-route copy

#### Scenario: Components that are not screens have no address of their own

- **GIVEN** the application is running
- **WHEN** a visitor navigates directly to `/NotFound` or to `/RootErrorBoundary`
- **THEN** each path renders the application's not-found screen, and neither page presents the
  error-boundary's "An error occurred" copy

#### Scenario: The not-found screen keeps its single address

- **GIVEN** the application is running
- **WHEN** a visitor navigates to a path no screen claims
- **THEN** the application's not-found screen renders, reached through the catch-all rather than
  through an address of its own

#### Scenario: Regression guard rejects an unclassified page file

- **GIVEN** a `.tsx` source file under the application's pages directory that is neither recorded as
  an intended screen nor named as excluded from route generation
- **WHEN** the repository's automated checks run
- **THEN** a check fails and names that file, so a component parked in the pages directory cannot
  become a public address unnoticed
