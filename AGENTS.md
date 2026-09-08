# AGENTS.md — Rebuild Team Guidance

This document provides guidance for the implementation and validation agents rebuilding this system from OpenSpec specifications.

## Overview

This is a petstore e-commerce application with 11 capabilities spanning user authentication, catalog management, shopping cart, order placement, payment processing, fulfillment, and notifications.

**Key architectural shape:**
- Vite React SPA frontend + Nitro (H3) server backend, single repo
- SQLite via better-sqlite3 + Drizzle ORM
- Tailwind CSS + shadcn/ui primitives for UI
- Vitest + Testing Library for unit/integration testing
- Playwright for E2E testing

## Capabilities at a Glance

### Core Flows (Sequential)

1. **user-authentication** → accounts → catalog → cart → order → payment → fulfillment → approval → notifications

### Key Data Model

**Hierarchy:** Category → Product → Item (all with locale-specific details)

**Order Lifecycle:** Cart → PurchaseOrder → LineItem (tracks ordered & shipped qty) → SupplierOrder

**User:** Username (PK, max 25 chars) + password, stored in User entity

### Stack Constraints

- **No remote services:** Everything lives in one monolith (SQLite, not a remote DB)
- **No complex frameworks:** React Router + vite-plugin-pages for routing
- **No Prisma:** Use Drizzle ORM exclusively
- **No app-level transactions:** Rely on container-managed (database) transactions
- **No auto-imports beyond React/Router:** Specified in auto-imports.d.ts; don't add more

## Implementation Notes

### Database Schema

All entities use Drizzle ORM with migrations in `drizzle/`. Schema lives in `db/`. Locale-specific data stored in `*_details` tables with composite keys `(id, locale)`.

### Frontend Routes

File-based via `vite-plugin-pages`:
- `src/pages/` → routes (e.g., `src/pages/catalog.tsx` → `/catalog`)
- Dynamic routes: `[id].tsx` or `[...slug].tsx`

### Server Routes

File-based via Nitro:
- `routes/api/` → endpoints (e.g., `routes/api/cart/add.ts` → `POST /api/cart/add`)
- Method-specific: `routes/api/endpoint.get.ts`, `.post.ts`, etc.

### Authentication

SignOnFilter is the legacy pattern. Rebuild as middleware that:
- Intercepts protected routes
- Checks session `j_signon` attribute
- Redirects unsigned-on users to sign-on page
- Preserves original URL for post-auth redirect

### Session State

HTTP session attributes (from legacy):
- `j_signon`: Boolean, true if authenticated
- `j_signon_username`: String, authenticated username
- `j_signon_original_url`: String, pre-auth request URL

Rebuild using express-session or similar; session cookie for state.

### Styles

Tailwind only; no Tailwind config file should exist (CSS-first configuration via styles). Use utilities for all styling.

### Testing

- **Unit tests:** `src/utils/*.test.ts`, `src/components/*.test.tsx`
- **Integration tests:** `routes/api/*.test.ts` (runs in Vitest `server` project with real SQLite)
- **E2E tests:** `e2e/*.spec.ts` (Playwright, real browser)

**Run `bun run verify:full`** before marking work complete.

### Locale Support

Supported locales: `en_US`, `ja_JP`, `zh_CN`

Queries accept `locale` parameter; missing locale data returns `null`. No fallback to another language.

### Error Handling

Validation failures throw exceptions with descriptive messages (mirroring legacy error messages where extracted):
- "User ID cant be more than 25 chars long"
- "User Id cannot have '%' or '*' characters"
- "Shopping cart is empty"

These are surfaced to users in error screens (signon_failed.jsp → modern error page).

### Key Decisions from Legacy

1. **Passwords stored plaintext** — no hashing in legacy. Rebuild MUST hash (this is a security fix, not a defect).
2. **Quantity constraints enforced via XML schema** (lineNo ≥ 0, quantity > 0). Rebuild enforces at EJB/service layer.
3. **Order status workflow** — PENDING → APPROVED|DENIED → COMPLETED. Only PENDING orders can transition.
4. **Cookie persistence** — bp_signon cookie lasts 2,678,400 seconds (≈31 days). Store username on sign-in if "remember" checked.
5. **Cart lifecycle** — in-memory during session, cleared after order placement. No persistence across sessions.

### Locale Propagation

Locale parameter flows through: HTTP request → controller → service → DAO → SQL query. Every query that returns user-facing content must include locale filter.

### Line Items

LineItem entity models both cart items (pre-order) and purchased line items (post-order). Tracks:
- ordered quantity (set at creation, immutable)
- shipped quantity (updated by fulfillment, starts at 0)

### Translation of Legacy Concepts

| Legacy | Rebuild | Notes |
|--------|---------|-------|
| SignOnFilter (servlet filter) | Express/Nuxt middleware | Intercept and guard routes |
| ShoppingCartLocalEJB (session bean) | In-memory map or Zustand store | Manage cart state during session |
| UserEJB (CMP entity) | Drizzle User table | Store credentials |
| PurchaseOrder XML | Database model or JSON | Order representation |
| JMS queues (async notifications) | Bull/BullMQ or similar | Async task processing |

### Configuration

No environment-specific config in code. Use `.env` files:
- `DB_PATH` — SQLite database file
- `SESSION_SECRET` — session encryption key
- `NODE_ENV` — development/production

Locale list (`en_US,ja_JP,zh_CN`) is a constant in code or env var.

## Quality Gates Before DONE

- [ ] All acceptance criteria met (per spec)
- [ ] Unit tests pass (`bun run test`)
- [ ] Lint passes (`bun run lint`)
- [ ] Type check passes (`bun run typecheck`)
- [ ] E2E tests pass (`bun run test:e2e`) or verified manually
- [ ] Locale parameter flows through all queries
- [ ] Plaintext password hashing added (legacy → rebuild security fix)
- [ ] Session management stores signed-on state
- [ ] Protected routes redirect unsigned-on users
- [ ] Cart cleared after order placement

## Common Pitfalls

1. **Forgetting locale parameter** — queries return data for all locales, breaking multi-language support
2. **Storing plaintext passwords** — legacy did this; rebuild must hash
3. **Cart persistence across sessions** — legacy is in-memory; don't add database persistence unless spec says to
4. **Inventing screens** — spec has screen requirements; build only those, no extras
5. **Role-based auth beyond authenticated/unauthenticated** — not in spec; don't add
6. **Prisma instead of Drizzle** — stack is Drizzle; don't substitute

## References

- [Pinned Stack](../README.md#stack) — exact tech choices
- `openspec/changes/sx-*/design.md` — architecture and data model per capability
- `openspec/changes/sx-*/specs/*/spec.md` — requirements with scenarios
- `architecture/schema.sql` — legacy database schema (evidence)
- `api/openapi.yaml` — legacy API endpoints (evidence)
