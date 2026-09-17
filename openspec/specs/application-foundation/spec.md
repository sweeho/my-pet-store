# application-foundation Specification

## Purpose

The running My Pet Store application and the automated gate that proves it: what a visitor sees when they load the app, what a clean checkout of the repository must be able to produce, and what continuous integration must report before work is considered landed.

## Requirements

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

### Requirement: Application shell navigation

Every navigation and call-to-action control the application presents SHALL lead to a screen the
application serves. A control that names no such screen SHALL NOT be presented.

#### Scenario: Primary call to action opens the catalogue

- **GIVEN** a visitor on the home page at `/`
- **WHEN** the visitor activates the primary hero call to action
- **THEN** the browser is on the catalogue screen at `/catalog`

#### Scenario: Sign-in control opens the sign-on screen

- **GIVEN** a signed-out visitor on the home page at `/`
- **WHEN** the visitor activates the header's sign-in control
- **THEN** the browser is on the sign-on screen at `/signon`

#### Scenario: No control leads nowhere

- **GIVEN** a visitor on a screen that carries the header
- **WHEN** every navigation and hero link on the page is inspected, in the header and in the
  screen's own content

- **THEN** each one targets a path the application routes, and none targets a placeholder fragment

### Requirement: Persistent store header on every screen

The application SHALL render one shared header, in the same position, on every routable screen
except the four sign-on screens (`/signon`, `/signon-failed`, `/admin/signon`,
`/admin/signon-failed`). The header SHALL carry the store mark linking to the home page, a link to
the catalogue at `/catalog`, and a link to the cart at `/cart` showing the number of lines the cart
holds, with no number shown when the cart is empty. On the administration and supplier screens the
header SHALL additionally present the administration context those screens show today, and the
back-link those screens carry SHALL continue to lead one level up. Every control in the header
SHALL be reachable from the keyboard, in the order it appears, ahead of the screen's own content.
At a narrow viewport the header's controls SHALL remain readable and reachable and SHALL NOT
overlap the screen's title. The header SHALL accept a trailing slot a screen may fill with a
control of its own.

#### Scenario: The header renders on a screen that had none

- **GIVEN** a visitor on the cart screen at `/cart`
- **WHEN** the screen has rendered
- **THEN** the shared header is present, carrying the store mark, a catalogue link and a cart link

#### Scenario: The store mark leads home

- **GIVEN** a visitor on any screen that carries the header
- **WHEN** the visitor activates the store mark in the header
- **THEN** the browser is on the home page at `/`

#### Scenario: The catalogue link leads to the catalogue

- **GIVEN** a visitor on the cart screen at `/cart`
- **WHEN** the visitor activates the header's catalogue link
- **THEN** the browser is on the catalogue screen at `/catalog`

#### Scenario: The cart link reports how many lines the cart holds

- **GIVEN** a visitor whose cart holds two distinct lines
- **WHEN** any screen carrying the header has rendered
- **THEN** the header's cart link is accompanied by the number 2 and leads to `/cart`

#### Scenario: An empty cart shows no number

- **GIVEN** a visitor whose cart is empty
- **WHEN** any screen carrying the header has rendered
- **THEN** the header's cart link leads to `/cart` and no line count is shown beside it

#### Scenario: The sign-on screens carry no header

- **GIVEN** a visitor on the sign-on screen at `/signon`
- **WHEN** the screen has rendered
- **THEN** the shared header is absent and the screen presents its bare centred card

#### Scenario: The administration screens keep their context and their back-link

- **GIVEN** an administrator on the order queue screen at `/admin/orders`
- **WHEN** the screen has rendered
- **THEN** the header presents the administration context together with the signed-in username, a
  catalogue link, a cart link and a sign-out control, and the screen's back-link still leads to
  `/admin`

#### Scenario: The administration header offers no route to where the visitor already is

- **GIVEN** an administrator on any administration or supplier screen
- **WHEN** the screen has rendered
- **THEN** the header presents no administration link and no account link, since the visitor is
  already in the administration area

#### Scenario: The header is reached before the screen's content

- **GIVEN** a visitor on any screen that carries the header
- **WHEN** the visitor moves through the screen from the keyboard alone
- **THEN** every header control is reached, in the order it appears, before the first control
  belonging to the screen's own content

#### Scenario: The header holds together at a narrow viewport

- **GIVEN** a visitor on a screen carrying the header at a 375-pixel-wide viewport
- **WHEN** the screen has rendered
- **THEN** every header control is visible and reachable, and none of them overlaps the screen's
  title

#### Scenario: A catalogue screen fills the header's trailing slot

- **GIVEN** a visitor on the catalogue screen at `/catalog`
- **WHEN** the screen has rendered
- **THEN** the language switcher is present in the header, and choosing a different language there
  leaves that language in effect after navigating to another catalogue screen

### Requirement: Header reports who the visitor is

The header SHALL present the signed-on state of the visitor, and SHALL present nothing about it
until that state is known. While the session state is unresolved the header SHALL present neither a
sign-in control, nor a username, nor an administrative link. Once resolved, a signed-out visitor
SHALL be offered a sign-in control and SHALL be offered no account, sign-out or administrative
link; a signed-on visitor SHALL be shown their username together with a link to their account and a
sign-out control. Activating the sign-out control SHALL end the session and take the visitor to the
home page. Rendering the header SHALL NOT change where a visitor is taken after signing on.

#### Scenario: Nothing is claimed before the session state is known

- **GIVEN** a visitor loading a screen that carries the header
- **WHEN** the session read has not yet answered
- **THEN** the header presents no sign-in control, no username and no administrative link, and says
  instead that it is checking the visitor's session

#### Scenario: A signed-out visitor is offered sign-in only

- **GIVEN** a visitor who is not signed on
- **WHEN** a screen carrying the header has rendered and the session read has answered
- **THEN** the header presents a sign-in control leading to `/signon`, and presents no account
  link, no sign-out control and no administrative link

#### Scenario: A signed-on visitor is named

- **GIVEN** a visitor signed on as "alice"
- **WHEN** a screen carrying the header has rendered and the session read has answered
- **THEN** the header presents "alice", a link to the account screen at `/customer`, and a sign-out
  control

#### Scenario: Signing out ends the session and returns home

- **GIVEN** a signed-on visitor on a screen carrying the header
- **WHEN** the visitor activates the header's sign-out control
- **THEN** the session is ended, the browser is on the home page at `/`, and the header presents a
  sign-in control again

#### Scenario: The header does not displace the post-sign-on destination

- **GIVEN** a signed-out shopper on the cart screen at `/cart` who is sent to `/signon` from there
- **WHEN** the shopper signs on successfully
- **THEN** the browser is on `/cart`, and not on `/admin` or the home page

### Requirement: Administrative entry from the header

A signed-on visitor holding the administrator role SHALL be offered a link to the administration
home page at `/admin` in the header of every store screen that carries one, including the home page;
the administration and supplier screens are excepted, because the visitor is already there. A
visitor who does not hold that role SHALL be offered no such link on any screen. The presence of
that link is a convenience and SHALL NOT be the mechanism that protects the administration area:
`/admin` SHALL remain refused to a visitor who does not hold the role whether or not the link was
ever shown.

#### Scenario: An administrator is offered the administration area

- **GIVEN** a visitor signed on as an identity holding the administrator role
- **WHEN** the home page at `/` has rendered and the session read has answered
- **THEN** the header presents a link to `/admin`

#### Scenario: A shopper is offered nothing of the kind

- **GIVEN** a visitor signed on as an identity that does not hold the administrator role
- **WHEN** any screen carrying the header has rendered and the session read has answered
- **THEN** the header presents no link to `/admin`

#### Scenario: The administration area is refused without the link

- **GIVEN** a visitor signed on as an identity that does not hold the administrator role
- **WHEN** the visitor requests `/admin` directly
- **THEN** the request is refused and the administration content is never presented

### Requirement: Shared content column widths

Every screen's main content SHALL sit in a shared column width, and no screen SHALL declare a column
width of its own. There SHALL be exactly two such widths, each declared in one place in the codebase:
one for the store's customer-facing screens, and a wider one for the administration and supplier
screens. The header's own inner container on a screen SHALL take the same width as the content
beneath it. The four sign-on screens, which present a bare centred card rather than a column of
content, are excepted.

#### Scenario: Two screens in a purchase sit in the same column

- **GIVEN** a shopper moving from the cart screen at `/cart` to the order form at
  `/enter-order-information`

- **WHEN** both screens have rendered
- **THEN** the main content of each occupies the same column width, and the page does not shift
  sideways between them

#### Scenario: The header lines up with the content beneath it

- **GIVEN** a visitor on any screen that carries the header
- **WHEN** the screen has rendered
- **THEN** the header's controls begin and end on the same vertical edges as the screen's own
  content

#### Scenario: No screen declares a width of its own

- **GIVEN** the application's screen sources
- **WHEN** they are examined for the column width each screen's main content container declares
- **THEN** every screen but the four sign-on screens takes one of the two shared declarations, and
  the project's test suite reports a failure naming any screen that declares its own

#### Scenario: The order form stays usable in the shared column

- **GIVEN** a shopper on the order form at `/enter-order-information` at a desktop viewport
- **WHEN** the screen has rendered
- **THEN** the billing and shipping sections and the order summary are each fully readable within
  the shared column, and no field is cut off or overlapped

### Requirement: Store-wide conformance to the design tokens

Every screen the application serves SHALL take its colours from the project's design tokens, and no
screen SHALL use a raw utility-framework palette colour.

#### Scenario: The home page and About page use the tokens

- **GIVEN** the sources of the home page and the About page
- **WHEN** they are examined for colour classes
- **THEN** neither contains a raw palette colour — no grey, indigo, or bare white background or
  text class — and the project's test suite reports a failure naming the file if one is
  reintroduced

#### Scenario: The home page reads as the same store as the catalogue

- **GIVEN** a visitor moving from the home page at `/` to the catalogue screen at `/catalog`
- **WHEN** both screens have rendered
- **THEN** both present the same header and the same background and text colours

#### Scenario: The not-found screen is a screen of the store

- **GIVEN** a visitor requesting a path the application does not route
- **WHEN** the not-found screen has rendered
- **THEN** it carries the shared header and the store's own typography, rather than an unstyled
  message
