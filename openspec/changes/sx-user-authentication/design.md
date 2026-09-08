# User Authentication — Design Document

## User Entity

The User entity stores authentication credentials:
- **userName** (String, primary key) — max 25 characters, no '%' or '*' characters
- **password** (String) — max length enforced by MAX_PASSWD_LENGTH constant
- Storage: Container-Managed Persistent entity (UserEJB, CMP 2.x)

## Authentication Flow

**Sign-In:**
1. User submits j_signon_check with userName and password
2. SignOnFilter.validateSignOn() calls SignOnEJB.authenticate()
3. SignOnEJB looks up user by userName, calls user.matchPassword(password)
4. On success: set session attributes j_signon_username and j_signon (Boolean true), redirect to original URL
5. On failure: redirect to sign-on error page

**Account Creation:**
1. User submits createuser.do with userName and password
2. CreateUserServlet.doPost() calls getSignOnEjb().createUser()
3. SignOnEJB.createUser() delegates to UserEJB.ejbCreate()
4. UserEJB validates constraints (length, special characters) and creates User entity
5. On validation failure: CreateException redirects to user_creation_error.jsp

**Protected Resource Access:**
1. SignOnFilter.doFilter() checks session for j_signon attribute (defaults to false)
2. If unsigned-on, matches URL against configured protectedResources
3. If URL matches protected resource: store ORIGINAL_URL in session, forward to signOnPage
4. If signed-on: allow request through filter chain

## Password Verification

Passwords are compared using exact string matching via String.equals() method (case-sensitive, no hashing).

## Username Persistence

When "Remember My User Name" checkbox is selected:
- Cookie named "bp_signon" is created with username value
- maxAge set to 2,678,400 seconds (approximately 31 days)
- If not selected: existing bp_signon cookie is removed by setting maxAge to 0

## Protected Resources

Configured in signon-config.xml (loaded at filter init):
- customer.screen
- customer.do
- enter_order_information.screen
- signon_welcome.screen

Each resource is checked against request URL for access control.

## Session State

After successful authentication:
- j_signon_username = authenticated userName
- j_signon = Boolean true
- ORIGINAL_URL = preserved for post-auth redirect

New sessions initialize j_signon to false by default.

## Form Parameters

Sign-in form (j_signon_check):
- j_username (text input)
- j_password (password input)
- j_remember_username (checkbox, optional)

Account creation form (createuser.do):
- j_username (text input)
- j_password (password input)
- j_password_2 (password confirmation input)
