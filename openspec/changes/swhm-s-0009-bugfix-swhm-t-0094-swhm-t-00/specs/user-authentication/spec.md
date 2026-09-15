# user-authentication — delta

## MODIFIED Requirements

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
