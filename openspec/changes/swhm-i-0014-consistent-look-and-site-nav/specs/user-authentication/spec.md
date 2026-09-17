## ADDED Requirements

### Requirement: Report signed-on identity and administrative role to the client

The application SHALL offer a read of the current session that reports whether the visitor is
signed on, the username they are signed on as, and the role their identity holds, so that a screen
can present what belongs to that identity without probing a protected resource to find out. That
read SHALL have no effect on the session: in particular it SHALL NOT set, clear or overwrite the
resource the visitor is returned to after signing on.

#### Scenario: A signed-on administrator's role is reported

- **GIVEN** a visitor signed on as an identity whose record holds the administrator role
- **WHEN** the current session is read
- **THEN** the read reports that the visitor is signed on, names them, and reports the
  administrator role

#### Scenario: A signed-on shopper holds no role

- **GIVEN** a visitor signed on as an identity whose record holds no role
- **WHEN** the current session is read
- **THEN** the read reports that the visitor is signed on, names them, and reports no role

#### Scenario: A signed-out visitor is reported as such

- **GIVEN** a visitor who is not signed on
- **WHEN** the current session is read
- **THEN** the read reports that the visitor is not signed on, and names no username and no role

#### Scenario: Reading the session does not become the post-sign-on destination

- **GIVEN** a signed-out shopper who navigated to `/cart`, whose screen read the current session
- **WHEN** the shopper then goes to the sign-on screen and signs on successfully
- **THEN** the shopper is returned to `/cart`, and the resource recorded as their destination was
  never replaced by anything the session read touched
