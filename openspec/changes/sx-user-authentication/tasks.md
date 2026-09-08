# User Authentication — Implementation Tasks

## 1. User Entity

- [ ] 1.1 Define User CMP entity bean with userName and password fields
- [ ] 1.2 Set userName as primary key (max 25 characters)
- [ ] 1.3 Implement matchPassword(String) method for credential verification
- [ ] 1.4 Declare ejbCreate(userName, password) method with validation

## 2. User Creation Validation

- [ ] 2.1 Validate username does not exceed MAX_USERID_LENGTH (25 characters)
- [ ] 2.2 Validate username does not contain '%' or '*' characters
- [ ] 2.3 Validate password does not exceed MAX_PASSWD_LENGTH
- [ ] 2.4 Throw CreateException on validation failures with descriptive messages

## 3. Authentication Service

- [ ] 3.1 Implement SignOnEJB.authenticate(userName, password) method
- [ ] 3.2 Look up user by userName via UserLocalHome.findByPrimaryKey()
- [ ] 3.3 Call user.matchPassword(password) for verification
- [ ] 3.4 Return false if user not found (catch FinderException)
- [ ] 3.5 Implement SignOnEJB.createUser(userName, password) for user registration

## 4. Session Management

- [ ] 4.1 Set j_signon_username session attribute after successful authentication
- [ ] 4.2 Set j_signon Boolean session attribute (true/false based on auth state)
- [ ] 4.3 Initialize j_signon to false for new sessions where not set
- [ ] 4.4 Store ORIGINAL_URL in session for protected resource redirect

## 5. SignOn Filter

- [ ] 5.1 Implement SignOnFilter servlet filter with doFilter() method
- [ ] 5.2 Check session j_signon attribute to determine signed-on status
- [ ] 5.3 Load protected resource patterns from signon-config.xml
- [ ] 5.4 Redirect unsigned-on users to sign-on page when accessing protected resources

## 6. Cookie Persistence

- [ ] 6.1 Create bp_signon cookie when "Remember My User Name" is checked
- [ ] 6.2 Set cookie maxAge to 2,678,400 seconds (31 days)
- [ ] 6.3 Remove bp_signon cookie when remember checkbox not selected
- [ ] 6.4 Pre-fill username field from bp_signon cookie in sign-in form

## 7. Sign-In Workflow

- [ ] 7.1 Accept POST to j_signon_check endpoint
- [ ] 7.2 Extract j_username and j_password parameters
- [ ] 7.3 Call SignOnEJB.authenticate() with credentials
- [ ] 7.4 On success: redirect to ORIGINAL_URL with session attributes set
- [ ] 7.5 On failure: redirect to sign-on error page

## 8. Account Creation Workflow

- [ ] 8.1 Accept POST to createuser.do endpoint
- [ ] 8.2 Extract j_username, j_password parameters
- [ ] 8.3 Call SignOnEJB.createUser() to register new account
- [ ] 8.4 On success: establish session and redirect appropriately
- [ ] 8.5 On CreateException: redirect to user_creation_error.jsp

## 9. User Interfaces

- [ ] 9.1 Create sign-in form (signon.jsp) with username/password inputs and remember checkbox
- [ ] 9.2 Create sign-up form (signon.jsp new customer section) with username/password/confirm fields
- [ ] 9.3 Implement username field pre-population from bp_signon cookie
- [ ] 9.4 Create sign-on error page (signon_failed.jsp) with error message
- [ ] 9.5 Add password confirmation validation on client side

## 10. Integration Testing

- [ ] 10.1 Test successful user creation with valid credentials
- [ ] 10.2 Test username length validation (max 25 chars)
- [ ] 10.3 Test special character rejection (%, *)
- [ ] 10.4 Test successful authentication with correct credentials
- [ ] 10.5 Test authentication failure with incorrect password
- [ ] 10.6 Test authentication failure with non-existent username
- [ ] 10.7 Test remember username cookie creation and retrieval
- [ ] 10.8 Test protected resource redirect to sign-on page
- [ ] 10.9 Test post-auth redirect to original URL

