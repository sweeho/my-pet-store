# Rebuild Guidance — Petstore E-Commerce

This document provides guidance to the rebuild team for implementing the Petstore E-Commerce capabilities extracted from the legacy Java EE application.

## Stack Constraints

The rebuild is on a pinned stack:
- **Frontend**: Vite React SPA (TypeScript, strict)
- **Backend**: Nitro (H3) server
- **Data**: SQLite via better-sqlite3 + Drizzle ORM
- **Styling**: Tailwind CSS (CSS-first, no config.ts)
- **Routing**: vite-plugin-pages (file-based) + react-router
- **Tests**: Vitest + Testing Library (unit/integration), Playwright (E2E)

Do NOT reach for Next.js, App Router, RSC, Prisma, or other frameworks. This stack is the project's identity.

## Key Decisions from Legacy

### Authentication & Sessions
- Session-based, not token-based (from J2EE HttpSession)
- username cookie (bp_signon) persists on client for 30 days
- Session timeout: 54 minutes (supplier app)
- Form-based login with j_security_check endpoint (J2EE standard)
- Session attributes track sign-on state (j_signon=boolean, j_signon_username=string)

### Order Management
- Order ID generation: UniqueIdGenerator with seed 1001, sequential incrementing
- Order status state machine: PENDING → APPROVED/DENIED → COMPLETED
- Only PENDING orders eligible for approval/denial (status immutability enforced)
- Auto-approval thresholds by locale: US < $500, Japan < ¥50,000
- All other orders require manual approval by admin

### Shopping Cart
- Session-scoped (not persisted)
- In-memory collection, cleared on order placement
- Line totals: quantity × unitCost
- Cart subtotal: SUM of all line totals

### Inventory & Fulfillment
- Inventory reduced at fulfillment time (not at order time)
- Partial shipments supported (quantityShipped tracks separately)
- Order completion detected when all line items fully shipped
- Asynchronous invoice processing via message queue

### Internationalization
- Supported locales: en_US, ja_JP, zh_CN
- Per-locale content in LOCALE_CONTENT table
- Customer profile stores preferredLanguage
- Supported categories: BIRDS, CATS, DOGS, FISH, REPTILES

### Data Constraints
- Username max 25 characters, alphanumeric only (no '%' or '*')
- Password max ~32 characters (configuration varies)
- Address fields: names 30 chars, streets 70 chars
- State/Province: CA, NY, TX (hardcoded dropdown)
- Countries: USA, Canada, Japan, China

## Implementation Notes

### Database Migrations
All capability changes map to the Drizzle schema in `db/schema.ts`. Migrations in `drizzle/` are auto-generated from schema changes; do not hand-write SQL migration files.

### Entity Relationships
- Customer → Account (1:1), Profile (1:1)
- Account → ContactInfo (1:1) → Address (1:1)
- Account → CreditCard (1:1)
- Customer → PurchaseOrder (1:N)
- PurchaseOrder → LineItem (1:N)
- Item → Category (N:1), Product (N:1)

### API Layer
All public endpoints are Nitro routes under `routes/`. File-based routing mirrors the OpenAPI contract, not legacy paths. The legacy paths (signon, cart.do, order.do) do NOT define the rebuild's API.

### Session Management
Session is request-scoped via Nitro middleware. Customer-specific data (cart, orders, profile) is fetched from database per request, not stored in session. Sessions are used only for authentication state and temporary UI state.

### Notification System
- Order placement: async email via message queue
- Order approval/denial: async email via message queue
- Implementation: use a job queue (e.g., Bull, RabbitMQ); email is fire-and-forget

### Testing Strategy
- Unit tests: Vitest + @testing-library for component logic
- Integration tests: Vitest + database fixtures for order/inventory workflows
- E2E tests: Playwright for user workflows (sign-up, add to cart, checkout)
- No mocks for database; use real SQLite fixtures

## Gotchas and Constraints

1. **Order ID Generation**: Seed is 1001, sequence increments by 1. Do NOT use UUIDs; this is a required constraint from legacy.

2. **Status Immutability**: Terminal states (APPROVED, DENIED, COMPLETED) are immutable. Re-processing an order in terminal state must silently skip it, not error.

3. **Inventory Reduction Timing**: Inventory is reduced at fulfillment time (when invoice arrives), not when order is placed. This is different from many e-commerce systems.

4. **Auto-Approval Thresholds**: Hardcoded by locale with no configuration option. If thresholds change, code changes are required.

5. **Cart Clearing**: Cart is cleared AFTER order creation succeeds. If order creation fails, cart is NOT cleared. This is important for retry scenarios.

6. **Session Timeout**: 54 minutes is from supplier app; petstore app may differ. Check if legacy has different timeout per app.

7. **Email Notification**: Async sends must not block order placement. Implement as background job with retry logic.

8. **Address Dropdown Constraints**: State and country dropdowns are hardcoded and must match legacy values exactly for data consistency.

9. **Locale Handling**: getLocaleFromString() in legacy suggests custom locale parsing. Validate that locale parsing matches legacy behavior.

10. **Credit Card Storage**: No explicit PCI compliance guidance in legacy. Assume this is a rebuild opportunity for PCI-compliant vault; legacy probably stores plaintext (bad). Do NOT replicate that.

## Migration Path

Capabilities are ordered as a valid dependency DAG:
1. user-authentication (no deps)
2. account-management (depends on user-authentication)
3. catalog-browsing (no deps)
4. internationalization (no deps)
5. admin-operations (depends on user-authentication)
6. shopping-cart (depends on catalog-browsing)
7. order-placement (depends on shopping-cart, user-authentication)
8. payment-processing (depends on order-placement)
9. fulfillment-management (depends on order-placement)
10. order-approval (depends on fulfillment-management)
11. notifications (no deps on other capabilities)

Build in this order to avoid circular dependencies.

## Quality Gates

Before DONE:
- All acceptance criteria from OpenSpec PASSED in acceptance tests
- No TS errors (tsc --build)
- No lint errors (bun run lint)
- E2E tests pass for user-visible workflows (Playwright)
- Database migrations applied cleanly to a fresh SQLite instance
- No hardcoded secrets or legacy paths in code

