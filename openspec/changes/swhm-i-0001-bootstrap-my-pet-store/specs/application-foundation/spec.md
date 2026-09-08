## Purpose

The running My Pet Store application and the automated gate that proves it: what a visitor sees when they load the app, what a clean checkout of the repository must be able to produce, and what continuous integration must report before work is considered landed.

## ADDED Requirements

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
