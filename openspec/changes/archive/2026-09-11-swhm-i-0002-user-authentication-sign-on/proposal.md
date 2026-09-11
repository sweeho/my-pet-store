# User Authentication Capability — Proposal

## Summary

User authentication enables customers to create accounts, sign in with credentials, and maintain session state across protected resources. The system tracks authentication status and provides session-based access control.

## Scope

- User account creation with username and password validation
- User authentication via username/password verification
- Session management with authentication state tracking
- Username cookie persistence ("Remember My User Name" feature)
- Protected resource access control
- Sign-in and sign-up user interfaces
- Authentication error handling

## Key Features

- Create new user accounts with validation (max 25-char username, special character restrictions)
- Authenticate users against stored credentials
- Maintain HTTP session attributes for signed-in status and username
- Store username in cookies for remembered logins (30-day expiration)
- Intercept requests to protected resources and redirect unsigned-on users
- Preserve original request URL for post-authentication redirect
- Display sign-on error feedback to users

## Risk

- Password verification uses case-sensitive string matching (no hashing)
- Username length limited to 25 characters
- Special characters (%, *) prohibited in usernames
- Protected resources require explicit configuration in signon-config.xml

