# application-foundation — delta

## ADDED Requirements

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
