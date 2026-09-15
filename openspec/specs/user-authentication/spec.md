# user-authentication Specification

## Purpose

TBD - created by archiving change swhm-i-0002-user-authentication-sign-on. Update Purpose after archive.

## Requirements

### Requirement: Create new user account

The system SHALL allow users to register new accounts by providing a username and password. The system SHALL validate username and password constraints and reject invalid input with descriptive error messages.

#### Scenario: User account is created with valid credentials

- **GIVEN** the sign-up form
- **WHEN** a user enters username "alice" and password "secret123" and submits
- **THEN** a new User entity SHALL be created with those credentials

#### Scenario: Username validation rejects length exceeding 25 characters

- **GIVEN** the sign-up form
- **WHEN** a user enters a username with 26 characters and submits
- **THEN** creation SHALL fail with error "User ID cant be more than 25 chars long"

#### Scenario: Username validation rejects special characters

- **GIVEN** the sign-up form
- **WHEN** a user enters username with '%' or '*' characters
- **THEN** creation SHALL fail with error "User Id cannot have '%' or '*' characters"

### Requirement: Authenticate user with credentials

The system SHALL verify user credentials by matching the provided username and password against stored user data. Authentication SHALL return success only when both username exists and password matches exactly.

#### Scenario: Authentication succeeds with correct credentials

- **GIVEN** a registered user "alice" with password "secret123"
- **WHEN** the user signs in with username "alice" and password "secret123"
- **THEN** authentication SHALL return true

#### Scenario: Authentication fails with incorrect password

- **GIVEN** a registered user "alice" with password "secret123"
- **WHEN** the user signs in with username "alice" and password "wrongpass"
- **THEN** authentication SHALL return false

#### Scenario: Authentication fails with non-existent username

- **GIVEN** a sign-on form
- **WHEN** a user signs in with username "nonexistent" and any password
- **THEN** authentication SHALL return false (user not found)

### Requirement: Sign-in form displays username and password inputs

The sign-in form SHALL display a username text input field and a password input field, along with a "Remember My User Name" checkbox and submit button.

#### Scenario: Sign-in form displays with correct fields

- **GIVEN** a customer accessing the sign-in page
- **WHEN** the signon.jsp page is displayed
- **THEN** the form SHALL show: username (text), password (password field), "Remember My User Name" checkbox, and submit button

### Requirement: Sign-in form pre-populates username from cookie

The sign-in form SHALL pre-populate the username input field with the value from the "bp_signon" cookie when that cookie exists in the browser.

#### Scenario: Username field pre-populates from existing cookie

- **GIVEN** a browser with bp_signon cookie containing "alice"
- **WHEN** the sign-in form is displayed
- **THEN** the username field SHALL be pre-populated with "alice"

#### Scenario: Username field defaults to empty without cookie

- **GIVEN** a browser without bp_signon cookie
- **WHEN** the sign-in form is displayed
- **THEN** the username field SHALL be empty (or contain default value)

### Requirement: Sign-up form displays registration fields

The sign-up form SHALL display username, password, and password confirmation input fields, along with a submit button.

#### Scenario: Sign-up form displays with correct fields

- **GIVEN** a customer accessing the account creation section
- **WHEN** the new customer sign-up form is displayed
- **THEN** the form SHALL show: username (text), password (password field), password repeat (password field), and submit button

### Requirement: Sign-on error page displays authentication failure message

The sign-on error page SHALL display a generic error message indicating authentication failed and prompt the user to try again.

#### Scenario: Error page shows after failed sign-in

- **GIVEN** a user with incorrect credentials
- **WHEN** sign-in authentication fails
- **THEN** the system SHALL redirect to signon_failed.jsp and display error message: "There were errors signing you in. The user name and password you entered were not found in our records. Please try again."

### Requirement: Establish session on successful authentication

Upon successful authentication, the system SHALL create session attributes to track the signed-in status and authenticated username for subsequent requests.

#### Scenario: Session attributes are set after successful sign-in

- **GIVEN** a user successfully authenticating with correct credentials
- **WHEN** authentication succeeds
- **THEN** session SHALL contain j_signon_username = "alice" and j_signon = true

#### Scenario: New sessions initialize with unsigned-on state

- **GIVEN** a new session without authentication
- **WHEN** the session is created or accessed by SignOnFilter
- **THEN** session SHALL contain j_signon = false by default

### Requirement: Redirect to originally-requested resource after authentication

After successful authentication, the system SHALL redirect the user to the URL they originally requested before being redirected to the sign-on page.

#### Scenario: User is redirected to original URL after successful sign-in

- **GIVEN** a user attempting to access customer.screen without authentication
- **WHEN** they are redirected to sign-on, authenticate successfully, and submit
- **THEN** the system SHALL redirect to customer.screen (the original URL)

### Requirement: Intercept unauthenticated access to protected resources

The system SHALL intercept HTTP requests to protected resources from unauthenticated users and redirect them to the sign-on page, preserving the original URL for post-authentication redirection. A URL SHALL be preserved as the post-authentication destination only when the user navigated to it; a request a page issued in the background SHALL be refused without becoming that destination.

#### Scenario: Unauthenticated user is redirected to sign-on page

- **GIVEN** an unauthenticated user attempting to access customer.screen
- **WHEN** the request is intercepted by SignOnFilter
- **THEN** the system SHALL store customer.screen in session ORIGINAL_URL and forward to the sign-on page

#### Scenario: Authenticated user accesses protected resource without redirection

- **GIVEN** an authenticated user with j_signon = true
- **WHEN** they access a protected resource
- **THEN** the request SHALL pass through the filter without redirection

#### Scenario: A background request to a protected resource is refused without a redirect

- **GIVEN** an unauthenticated visitor on a screen that reads a protected resource in the background
- **WHEN** that background request reaches the system
- **THEN** the response SHALL report the request as unauthenticated rather than redirect it to the sign-on page, and the screen SHALL continue on the path it takes for a visitor with no session

#### Scenario: Browsing before signing on does not change where the user lands

- **GIVEN** an unauthenticated visitor who has browsed screens that read a protected resource in the background, and who has never navigated to a protected screen
- **WHEN** the visitor then signs on successfully
- **THEN** the visitor SHALL land on the sign-on welcome screen, and no resource requested in the background SHALL be used as the destination

### Requirement: Persist username in browser cookie when requested

When a user checks the "Remember My User Name" checkbox during sign-in, the system SHALL store the username in a cookie for future sign-in prefilling.

#### Scenario: Username cookie is created when remember checkbox is selected

- **GIVEN** a user signing in with "Remember My User Name" checkbox checked
- **WHEN** authentication succeeds
- **THEN** the system SHALL create a cookie named "bp_signon" with the username value and maxAge of 2,678,400 seconds

#### Scenario: Username cookie is removed when remember checkbox is not selected

- **GIVEN** a user signing in without "Remember My User Name" checkbox checked
- **WHEN** a bp_signon cookie exists
- **THEN** the system SHALL remove the bp_signon cookie by setting maxAge to 0

### Requirement: Enforce maximum username length

The system SHALL limit usernames to a maximum of 25 characters during account creation and reject longer usernames.

#### Scenario: Username at maximum length is accepted

- **GIVEN** an account creation request with username of exactly 25 characters
- **WHEN** the username is validated
- **THEN** account creation SHALL proceed

#### Scenario: Username exceeding maximum length is rejected

- **GIVEN** an account creation request with username of 26 characters
- **WHEN** the username is validated
- **THEN** creation SHALL fail

### Requirement: Enforce password length constraints

The system SHALL enforce a maximum password length defined by MAX_PASSWD_LENGTH and reject passwords exceeding this limit.

#### Scenario: Password exceeding maximum length is rejected

- **GIVEN** an account creation request with password exceeding MAX_PASSWD_LENGTH
- **WHEN** the password is validated
- **THEN** creation SHALL fail with error "Password cant be more than [max] chars long"

### Requirement: Redirect to error page on authentication failure

When user authentication fails, the system SHALL redirect the user to a sign-on error page indicating the failure.

#### Scenario: User is redirected to error page on authentication failure

- **GIVEN** a user submitting invalid credentials
- **WHEN** authentication fails
- **THEN** the system SHALL redirect to signOnErrorPage

### Requirement: Protect specified resources with authentication

The system SHALL require authentication for access to specific protected resources: customer.screen, customer.do, enter_order_information.screen, and signon_welcome.screen.

#### Scenario: Protected resource requires authentication

- **GIVEN** an unauthenticated user attempting to access customer.screen
- **WHEN** the resource is matched against configured protected resources
- **THEN** access SHALL be denied and the user SHALL be redirected to the sign-on page
