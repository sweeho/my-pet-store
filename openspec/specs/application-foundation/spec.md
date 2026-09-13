# application-foundation Specification

## Purpose

The running My Pet Store application and the automated gate that proves it: what a visitor sees when they load the app, what a clean checkout of the repository must be able to produce, and what continuous integration must report before work is considered landed.

## Requirements

### Requirement: Product-branded application shell

The application SHALL identify itself as My Pet Store everywhere a person or a user agent can read its name, and SHALL NOT present the name or placeholder copy of the boilerplate it was generated from.

#### Scenario: Home page names the product

- **GIVEN** the application is running
- **WHEN** a visitor loads the home page at `/`
- **THEN** the page's level-1 heading reads "My Pet Store", and no boilerplate product name or placeholder hero copy remains anywhere in the rendered page

#### Scenario: Browser tab and web app manifest name the product

- **GIVEN** the application is running
- **WHEN** a user agent loads the home page and fetches the web app manifest the page links
- **THEN** the document title is "My Pet Store", the manifest resolves successfully with its `name` set to "My Pet Store", and the package manifest's `name` field is `my-pet-store`

### Requirement: Verified build from a clean checkout

The project SHALL be buildable and verifiable from a checkout that carries no generated files and no machine-local state, and its automated test suites SHALL pass against the branded application.

#### Scenario: Clean checkout builds

- **GIVEN** a checkout of the repository with no generated files and no machine-local state
- **WHEN** dependencies are installed and a production build is produced
- **THEN** the build completes without error and emits both the client bundle in `dist/` and the Nitro server output in `.output/`

#### Scenario: Static checks and automated tests are green

- **GIVEN** the branded application on the sprint branch
- **WHEN** linting, type-checking and the unit and integration suites are run
- **THEN** all three report zero failures, and the page test in `src/pages/index.test.tsx` asserts the "My Pet Store" heading rather than the boilerplate heading

#### Scenario: Smoke test passes against the running app

- **GIVEN** the application running under the Bun runtime in a browser-equipped environment
- **WHEN** the smoke specification drives a real browser against it
- **THEN** the home page loads with no console errors, the `/api/hello` route responds successfully, and the database-backed `/api/users` route responds with a payload carrying a `users` property

### Requirement: Continuous verification on branch pushes

Continuous integration SHALL run the project's full verification pipeline on every push to a sprint branch and report a verdict against the pushed commit.

#### Scenario: CI reports a verdict on a sprint branch

- **GIVEN** the continuous integration workflow configured for branches matching `vortex/**`
- **WHEN** a commit is pushed to such a branch
- **THEN** a check run appears against that commit whose conclusion is success, having covered documentation links, type-checking, linting, the unit and integration suites, the production build, and the browser end-to-end tier

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

### Requirement: Observable pending state on data-gated screens

A screen whose content is gated on a client-side data read SHALL present an accessible pending
indicator while that read is in flight, and SHALL NOT present an empty page. This applies to the
route guard that gates a protected screen on its access check as well as to the screen beneath it.
The indicator SHALL carry the `status` role, SHALL name what is being loaded, and SHALL be absent
once the screen's content is present. A screen whose access check is denied SHALL still be taken to
the sign-on destination and SHALL NOT render its protected content. The project's browser
end-to-end tier SHALL wait on a settled screen before asserting that screen's contents.

#### Scenario: A protected screen announces that it is loading

- **GIVEN** a signed-on visitor navigating to a protected screen
- **WHEN** the access check for that screen has not yet answered
- **THEN** the page presents an element with the `status` role naming what is loading, rather than
  an empty page

#### Scenario: The customer profile announces that it is loading its account

- **GIVEN** a signed-on visitor on the customer profile screen whose access check has answered
- **WHEN** the account read has not yet answered
- **THEN** the page presents the "Customer Profile" heading together with an element with the
  `status` role, rather than an empty page

#### Scenario: The pending indicator is replaced by the screen's content

- **GIVEN** the customer profile screen with its account read in flight
- **WHEN** the account read answers
- **THEN** no element with the `status` role remains on the page, and the contact-information region
  is present

#### Scenario: A denied visitor is redirected rather than left on the pending indicator

- **GIVEN** an unauthenticated visitor navigating to a protected screen
- **WHEN** the access check answers that access is denied
- **THEN** the visitor is taken to the sign-on destination and the protected screen's content is
  never rendered

#### Scenario: The cross-session profile check waits on the settled screen

- **GIVEN** the browser end-to-end specification that saves a first name and a language preference,
  starts a new session, and returns to the customer profile screen

- **WHEN** it asserts the saved first name after that return
- **THEN** it has first waited for the contact-information region to be present, and it reports a
  failure if that region never appears
