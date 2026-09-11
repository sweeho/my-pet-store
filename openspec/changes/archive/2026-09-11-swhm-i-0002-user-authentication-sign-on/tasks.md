# User Authentication — Implementation Tasks

## 1. User Entity

- [x] 1.1 Define User CMP entity bean with userName and password fields (SWHM-T-0015)
- [x] 1.2 Set userName as primary key (max 25 characters) (SWHM-T-0015)
- [x] 1.3 Implement matchPassword(String) method for credential verification (SWHM-T-0015)
- [x] 1.4 Declare ejbCreate(userName, password) method with validation (SWHM-T-0015)

## 2. User Creation Validation

- [x] 2.1 Validate username does not exceed MAX_USERID_LENGTH (25 characters) (SWHM-T-0016)
- [x] 2.2 Validate username does not contain '%' or '\*' characters (SWHM-T-0016)
- [x] 2.3 Validate password does not exceed MAX_PASSWD_LENGTH (SWHM-T-0016)
- [x] 2.4 Throw CreateException on validation failures with descriptive messages (SWHM-T-0016)

## 3. Authentication Service

- [x] 3.1 Implement SignOnEJB.authenticate(userName, password) method (SWHM-T-0017)
- [x] 3.2 Look up user by userName via UserLocalHome.findByPrimaryKey() (SWHM-T-0017)
- [x] 3.3 Call user.matchPassword(password) for verification (SWHM-T-0017)
- [x] 3.4 Return false if user not found (catch FinderException) (SWHM-T-0017)
- [x] 3.5 Implement SignOnEJB.createUser(userName, password) for user registration (SWHM-T-0017)

## 4. Session Management

- [x] 4.1 Set j_signon_username session attribute after successful authentication (SWHM-T-0018)
- [x] 4.2 Set j_signon Boolean session attribute (true/false based on auth state) (SWHM-T-0018)
- [x] 4.3 Initialize j_signon to false for new sessions where not set (SWHM-T-0018)
- [x] 4.4 Store ORIGINAL_URL in session for protected resource redirect (SWHM-T-0018)

## 5. SignOn Filter

- [x] 5.1 Implement SignOnFilter servlet filter with doFilter() method (SWHM-T-0019)
- [x] 5.2 Check session j_signon attribute to determine signed-on status (SWHM-T-0019)
- [x] 5.3 Load protected resource patterns from signon-config.xml (SWHM-T-0019)
- [x] 5.4 Redirect unsigned-on users to sign-on page when accessing protected resources (SWHM-T-0019)

## 6. Cookie Persistence

- [x] 6.1 Create bp_signon cookie when "Remember My User Name" is checked (SWHM-T-0020)
- [x] 6.2 Set cookie maxAge to 2,678,400 seconds (31 days) (SWHM-T-0020)
- [x] 6.3 Remove bp_signon cookie when remember checkbox not selected (SWHM-T-0020)
- [x] 6.4 Pre-fill username field from bp_signon cookie in sign-in form (SWHM-T-0020)

## 7. Sign-In Workflow

- [x] 7.1 Accept POST to j_signon_check endpoint (SWHM-T-0021)
- [x] 7.2 Extract j_username and j_password parameters (SWHM-T-0021)
- [x] 7.3 Call SignOnEJB.authenticate() with credentials (SWHM-T-0021)
- [x] 7.4 On success: redirect to ORIGINAL_URL with session attributes set (SWHM-T-0021)
- [x] 7.5 On failure: redirect to sign-on error page (SWHM-T-0021)

## 8. Account Creation Workflow

- [x] 8.1 Accept POST to createuser.do endpoint (SWHM-T-0022)
- [x] 8.2 Extract j_username, j_password parameters (SWHM-T-0022)
- [x] 8.3 Call SignOnEJB.createUser() to register new account (SWHM-T-0022)
- [x] 8.4 On success: establish session and redirect appropriately (SWHM-T-0022)
- [x] 8.5 On CreateException: redirect to user_creation_error.jsp (SWHM-T-0022)

## 9. User Interfaces

- [x] 9.1 Create sign-in form (signon.jsp) with username/password inputs and remember checkbox (SWHM-T-0023)
- [x] 9.2 Create sign-up form (signon.jsp new customer section) with username/password/confirm fields (SWHM-T-0023)
- [x] 9.3 Implement username field pre-population from bp_signon cookie (SWHM-T-0023)
- [x] 9.4 Create sign-on error page (signon_failed.jsp) with error message (SWHM-T-0023)
- [x] 9.5 Add password confirmation validation on client side (SWHM-T-0023)

## 10. Integration Testing

- [x] 10.1 Test successful user creation with valid credentials (SWHM-T-0024)
- [x] 10.2 Test username length validation (max 25 chars) (SWHM-T-0024)
- [x] 10.3 Test special character rejection (%, \*) (SWHM-T-0024)
- [x] 10.4 Test successful authentication with correct credentials (SWHM-T-0024)
- [x] 10.5 Test authentication failure with incorrect password (SWHM-T-0024)
- [x] 10.6 Test authentication failure with non-existent username (SWHM-T-0024)
- [x] 10.7 Test remember username cookie creation and retrieval (SWHM-T-0024)
- [x] 10.8 Test protected resource redirect to sign-on page (SWHM-T-0024)
- [x] 10.9 Test post-auth redirect to original URL (SWHM-T-0024)
