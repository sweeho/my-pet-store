# Administrative Operations — Design Document

## Admin Workflow

The administrator workflow consists of the following sequence:

1. Authenticate with username/password via form-based login (J2EE standard)
2. Access protected admin interface requiring administrator role
3. View admin home page with launch and logout options
4. Launch Java Web Start rich client by POST to AdminRequestProcessor with currentScreen=manageorders
5. Rich client connects to server via ApplRequestProcessor with session ID in URL
6. Rich client retrieves and displays orders, revenue, order count data
7. Rich client sends batch order status updates to server

## Authentication & Session Management

- **Login Page:** form-based login to j_security_check with username and password
- **Default Credentials:** jps_admin / admin (pre-populated in form for development/testing)
- **Session Timeout:** 54 minutes per web.xml session-config
- **Role-Based Access:** administrator role required for AdminRequestProcessor and protected endpoints
- **Session Attributes:** j_signon (boolean), j_signon_username (String)
- **Logout:** session.invalidate() on logout.jsp

## Protected Resources

- /AdminRequestProcessor — GET and POST
- Admin JSP pages (login.jsp, index.jsp, logout.jsp, error.jsp)
- ApplRequestProcessor — Rich client request handler

## Rich Client Deployment

**Java Web Start Launch**

- POST to AdminRequestProcessor with currentScreen=manageorders
- Response: JNLP file (application/x-java-jnlp-file)
- JNLP includes session ID appended to server URL for authentication

**Rich Client Request Format**

- POST to /admin/ApplRequestProcessor with XML request body
- Request types: GETORDERS, UPDATESTATUS, REVENUE, ORDERS
- Request includes jsessionid for session tracking
- Response: XML document with results or error

## Order Management

### Order Retrieval

- Request type: GETORDERS with Status parameter
- Retrieves orders by status: pending, approved, completed, denied
- Response fields: OrderId, UserId, OrderDate, OrderAmount, OrderStatus

### Order Status Updates

- Request type: UPDATESTATUS with list of orders and new status
- Accepts multiple orders in single operation
- Delegates to AsyncSender EJB for asynchronous processing
- Returns SUCCESS or error message

### Order Details Storage

- OrderDetails transfer object with: orderId, userId, orderDate, orderValue, orderStatus
- Marshaled to/from XML representation

## Reporting

### Revenue Reports

- Request type: REVENUE with date range (Start, End) and optional ReqCategory
- Returns revenue amounts by category or item
- Response includes Category/Item elements with name attribute and revenue value
- TotalSales element with sum of all revenues

### Order Count Reports

- Request type: ORDERS with date range (Start, End) and optional ReqCategory
- Returns order quantities by category or item
- Response includes Category/Item elements with name attribute and quantity value
- TotalSales element with sum of all quantities

**Date Format:** MM/dd/yyyy (e.g., 01/15/2023)

## Rich Client UI Components

### Orders View Panel

- Read-only table of all approved, completed, and denied orders
- Columns: Order ID, User ID, Order Date, Order Amount, Status
- Table model: DataSource.OrdersViewTableModel

### Orders Approval Panel (separate feature)

- Editable table of pending orders
- Status column with dropdown selector (PENDING, APPROVED, DENIED)
- Three buttons: Approve, Deny, Commit
- Color-coded status background: green=APPROVED, red=DENIED, yellow=PENDING

### Chart Models (separate feature)

- RevenueChartModel and OrderChartModel
- Properties: startDate, endDate, viewMode
- Supports date range filtering

## Business Delegate Layer

**AdminRequestBD** — Business delegate for admin operations

- getOrdersByStatus(status) → OrdersTO
- updateOrders(OrderApproval oa) → delegates to AsyncSender
- getChartInfo(request, start, end, category) → Map of chart data

**OPCAdminFacade EJB** — Remote EJB for admin operations

- getOrdersByStatus(status) → OrdersTO
- getChartInfo(request, start, end, category) → Map

**AsyncSender EJB** — Asynchronous message sender

- sendAMessage(String xml) — sends OrderApproval to message queue

---

# Planning record — SWHM-S-0012

Everything above this line is the extraction from the legacy application and is unedited. Everything
below is the sprint-planning record: what this repository actually contains, where it contradicts the
extraction, and how each contradiction is resolved. Implementation agents read this section first.

## Codebase findings

| #   | Finding                                                                                                                                                                                                                                         | Evidence                                                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1  | No order data exists anywhere — no orders table, no line-items table, no status column. Task groups 5–9 all read order data.                                                                                                                    | `db/schema.ts` declares `users`, `auth_users`, `sessions`, six account tables and six catalogue tables, and nothing else. The only `order` tokens in server code are sort-order comments and the legacy path at `auth/protected-resources.ts:8`. |
| F2  | The identity model has no role dimension. `evaluateAccess()` answers one boolean question.                                                                                                                                                      | `auth/signon-filter.ts:6-11`; `auth/protected-resources.ts:5-10`; `AuthUser = { userName, password }` at `auth/user.ts:11`.                                                                                                                      |
| F3  | Access control is one pure function enforced in two places — a binding Key Decision, not an implementation detail.                                                                                                                              | `middleware/signon.ts:11-28` (server) and `routes/api/signon/check.get.ts` → `src/components/RequireSignOn.tsx` (client).                                                                                                                        |
| F4  | There is no logout anywhere, and sessions never expire. `sessions.updated_at` is written by `auth/session.ts` and read by nothing.                                                                                                              | grep for logout/signout/invalidate across `auth/ routes/ src/ middleware/` returns nothing; `e2e/customer-profile.spec.ts:14` states it outright.                                                                                                |
| F5  | `vitest.config.ts` hard-codes `auth/`, `account/` and `catalog/` in BOTH the `client` project's exclude and the `server` project's include. A new top-level module absent from both runs under jsdom, where `bun:sqlite` cannot resolve at all. | `vitest.config.ts:44-52` and `:58-63`.                                                                                                                                                                                                           |
| F6  | Every route is JSON in, JSON out. No XML serializer exists and no route dispatches on a request-type discriminator.                                                                                                                             | `routes/api/catalog/**`, e.g. `routes/api/catalog/categories/index.get.ts`.                                                                                                                                                                      |
| F7  | The transaction precedent already records that the legacy EJB/async framing does not survive an embedded single-connection database.                                                                                                            | `catalog/transaction.ts:15-17` and its S5 comment.                                                                                                                                                                                               |
| F8  | A paginated read returns a page plus `hasNext`, never a COUNT — and the decision names administrative lists explicitly.                                                                                                                         | `ARCHITECTURE.md` § Key Decisions.                                                                                                                                                                                                               |
| F9  | Prices are `real` and nothing sums them yet; how money is represented once totalled is an open decision.                                                                                                                                        | `db/schema.ts:139-140`; `ARCHITECTURE.md` § Data model, ticket SWHM-T-0058.                                                                                                                                                                      |
| F10 | Category names are per-locale, so a report grouped by category must choose a locale to label rows with.                                                                                                                                         | `db/schema.ts:89-103`; `DEFAULT_LOCALE` at `catalog/locale.ts:4`.                                                                                                                                                                                |
| F11 | The four mockups reuse this repository's own OKLCH token values verbatim. No new token, type scale, grid or accessibility standard.                                                                                                             | `mockup-*.html` `:root` blocks against `DESIGN.md` § Tokens.                                                                                                                                                                                     |
| F12 | No charting dependency exists.                                                                                                                                                                                                                  | `package.json` dependencies.                                                                                                                                                                                                                     |
| F13 | CI already triggers on push and pull request to `vortex/**`, `dev` and `main`, in one job covering every tier.                                                                                                                                  | `.github/workflows/ci.yml:15-22`.                                                                                                                                                                                                                |

## Spec discrepancies

The specification above was extracted from a legacy Java EE application. Each row is a place where it
describes something this repository does not contain. **None of these was resolved by editing the
delta spec** — the spec of record keeps the extracted wording, and the acceptance criteria on each
ticket are the extracted ones verbatim. What follows is how the extracted mechanism is realised here.

| #   | The spec asserts                                                                                                                                                                                                                            | This repository                                                                                                                                                  | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Orders, line items and order status exist to be read (groups 5–9).                                                                                                                                                                          | Nothing of the kind exists (F1).                                                                                                                                 | **This change defines the order tables.** `orders` and `order_line_item` are added to `db/schema.ts` by SWHM-T-0118 with a committed migration. Later capabilities (`swhm-i-0007`, `-0008`, `-0010`, `-0011`) inherit them rather than redefining them. Promoted to `ARCHITECTURE.md` § Key Decisions — it binds four later changes.                                                                                                     |
| S2  | A Java Web Start rich client, launched by a generated JNLP file carrying the session id (group 3, and the "launches rich client" scenario).                                                                                                 | No JVM, no second deployable, no `application/x-java-jnlp-file` producer. The idea's own Out of Scope excludes a desktop client outright.                        | The Launch Rich Client control navigates to the in-SPA administration screens already being served. No JNLP is generated and no session id travels in a URL. What survives from group 3 is the half this repository genuinely lacks: session invalidation and a logout endpoint (F4).                                                                                                                                                    |
| S3  | The login form posts to `j_security_check`.                                                                                                                                                                                                 | A servlet-container endpoint that does not exist.                                                                                                                | The admin login form posts to the existing `POST /api/signon`, which already returns `{ signedOn, redirectTo }`. No second credential store and no second authentication path.                                                                                                                                                                                                                                                           |
| S4  | XML request and response documents, dispatched on a request-type discriminator (`GETORDERS`, `UPDATESTATUS`, `REVENUE`, `ORDERS`).                                                                                                          | JSON throughout, file-based routes, one handler per path (F6).                                                                                                   | Four JSON routes under `routes/api/admin/`, following `routes/api/catalog/**`. The request type becomes the route; the XML envelope becomes the response body. Field names from the scenarios (`OrderId`, `UserId`, `OrderDate`, `OrderAmount`, `OrderStatus`) are preserved as the JSON keys `orderId`, `userId`, `orderDate`, `orderAmount`, `orderStatus`, so the scenario remains checkable.                                         |
| S5  | Batch status updates delegate to an `AsyncSender` EJB which posts an `OrderApproval` message to a queue.                                                                                                                                    | A single deployable with an embedded SQLite database. There is no queue to hand work to, and `catalog/transaction.ts` already records this exact reasoning (F7). | One `db.transaction`. The observable property the scenario is really asserting — every order in the batch moves or none does — is what a transaction gives; a queue would give strictly less.                                                                                                                                                                                                                                            |
| S6  | `OrdersViewTableModel.isCellEditable()` returns false for every cell.                                                                                                                                                                       | A Swing API with no analogue in React.                                                                                                                           | The orders table renders no form controls at all — no input, select, button or contenteditable inside it. That is checkable from the DOM, which `isCellEditable()` is not.                                                                                                                                                                                                                                                               |
| S7  | `session.invalidate()` on logout.                                                                                                                                                                                                           | A servlet API. Sessions are database rows (F4).                                                                                                                  | Logout deletes the session row and clears the `bp_session` cookie.                                                                                                                                                                                                                                                                                                                                                                       |
| S8  | A 54-minute session timeout, framed as an admin setting.                                                                                                                                                                                    | Sessions never expire, for anyone (F4).                                                                                                                          | Recorded as a known gap, not built in this sprint. It is new behaviour for **every** user, not an admin-only setting, so it belongs to the authentication capability rather than here. Raised as an improvement ticket. The admin home page still states the 54-minute figure because the mockup does; that copy will be honest only once the timeout exists, which is noted on SWHM-T-0115.                                             |
| S9  | The login form ships pre-populated with `jps_admin` / `admin`.                                                                                                                                                                              | No seeded admin account exists.                                                                                                                                  | Implemented as the scenario requires, because the criterion is asserted verbatim — but the account is seeded by `db/client.ts` alongside the existing demo content, which is development data, and the pre-filled form carries a visible note saying so. Shipping a known credential to a deployed store is a product risk, not an implementation one; raised as an improvement ticket for a human to settle before any real deployment. |
| S10 | Revenue and order counts are displayed as a pie chart and a bar chart.                                                                                                                                                                      | No charting dependency (F12).                                                                                                                                    | The scenarios under that requirement assert date-range storage and date-range filtering of the **data**, not the rendering. The reports therefore serve filtered data and render it as a table with proportional bars drawn in CSS. No dependency is added; a charting library stays available as a later decision.                                                                                                                      |
| S11 | Revenue is summed from item prices.                                                                                                                                                                                                         | `item.list_price` is `real` and nothing has summed money yet (F9).                                                                                               | Line items store the price at the time of the order rather than joining back to a price that may since have changed; totals are summed in SQL and rounded to two decimals at the boundary. This is the first money arithmetic in the repository and does not settle SWHM-T-0058.                                                                                                                                                         |
| S12 | Reports group by category.                                                                                                                                                                                                                  | Category names are per-locale (F10).                                                                                                                             | Report rows are keyed on `catid` and labelled with the `DEFAULT_LOCALE` name, as `catalog/locale.ts` already defines. A per-locale report is not in scope.                                                                                                                                                                                                                                                                               |
| S13 | A dedicated administrator login form (group 1, and the pre-populated-credentials requirement). The mockup shows one. The idea's own Solution section says the opposite — "Sign-in reuses `/signon`. No second login form".                  | Neither exists yet.                                                                                                                                              | The spec and the mockup win on the surface, the Solution wins on the substance: there is a dedicated admin login **page** at `/admin/signon`, and it posts to the existing `POST /api/signon`. One credential store, one authentication path, two entry screens.                                                                                                                                                                         |
| S14 | Group 5 retrieves orders of any status; the Orders View requirement restricts the table to `APPROVED`, `COMPLETED`, `DENIED`.                                                                                                               | —                                                                                                                                                                | Both hold, and they are not in conflict: the API serves any requested status, the read-only view requests those three.                                                                                                                                                                                                                                                                                                                   |
| S15 | Group 10's checkboxes (role validation on protected endpoints, null-session denial, invalid request types, failed updates, `RemoteException`, `ServiceLocatorException`) are cross-cutting concerns, not a body of work with its own files. | —                                                                                                                                                                | The checkboxes are tagged to SWHM-T-0123 because every box in a group takes that group's key, but the code they describe is implemented in the tickets that own those routes (SWHM-T-0114 and SWHM-T-0117 for the guard, SWHM-T-0119 for update failures). SWHM-T-0123 owns the administrator error page and the end-to-end coverage that proves each of those paths. It does not re-open another ticket's routes.                       |

## Decisions

- **D1 — This change defines the order tables.** `orders` (`order_id` pk, `user_name`, `order_date`, `order_amount`, `status`) and `order_line_item` (`order_id` + `line_number` pk, `itemid`, `quantity`, `unit_price`). The alternative was to wait for `swhm-i-0008`, which would leave this capability unbuildable and reverse the dependency for no gain: reading orders is a strictly smaller commitment to their shape than creating them. `order_id` is its own key rather than a shared one, as `ARCHITECTURE.md` § Key Decisions requires of anything 1:N. Promoted to `ARCHITECTURE.md`.
- **D2 — `evaluateAccess()` grows a second dimension rather than a second function.** A protected resource becomes `{ path, requiresRole? }`, and the verdict distinguishes "not signed on" from "signed on without the role" so the two can be answered differently — a redirect to sign-on versus a refusal. Adding a separate admin check would give the repository two access decisions that could disagree, which is exactly what the existing Key Decision forbids. Promoted to `ARCHITECTURE.md`.
- **D3 — A denial for a missing role is 403 and is never a return address.** An unauthenticated navigation to an admin path is still redirected to sign-on and still records where to come back to. A signed-on user without the role is refused outright: sending them to a sign-on page they have already passed produces a loop. This extends the existing return-address decision (`swhm-s-0009`) rather than reopening it.
- **D4 — Line items carry the price paid.** `order_line_item.unit_price` is written at order creation, so revenue is a sum over line items and never a join back to `item.list_price`. A report that joins to the current price silently restates history every time a price changes.
- **D5 — The batch status update is one transaction and reports per-order outcomes.** Unknown order ids do not fail the batch silently: the response names which ids moved and which were not found, so the caller can tell a partial request from a complete one.
- **D6 — One shared guard for every admin route.** `admin/request.ts` resolves the session, applies the role check and produces the one JSON error shape. Each route calls it rather than repeating the check, for the same reason the sign-on filter is one function.

## Phases

1. **Identity and access** — the role marker, `evaluateAccess()`'s second dimension, the admin login page, the client-side role guard. (SWHM-T-0114)
2. **Admin API foundation** — the `admin/` module, the shared guard and error shape, and `vitest.config.ts` registration (F5 — without this the module's tests run under jsdom and cannot load the database driver at all). (SWHM-T-0117)
3. **Session invalidation and logout** — the gap this repository genuinely has (F4). (SWHM-T-0116)
4. **Admin shell and home** — the chrome every admin screen shares, and the home page's two actions. (SWHM-T-0115)
5. **Orders** — the order tables and their migration, the read-by-status API, the batch status update. (SWHM-T-0118, SWHM-T-0119)
6. **Orders View** — the read-only table and the `ui/table` primitive it introduces. (SWHM-T-0122)
7. **Reporting** — the shared date-range parsing, revenue by category or item, order counts by category or item. (SWHM-T-0120, SWHM-T-0121)
8. **Test harness** — no new harness is required. Vitest's two projects already cover both tiers; the one registration this change owes is adding `admin/**` to both project lists, which is phase 2's first step. Module tests sit beside the module as `*.test.ts`; page tests as `*.test.tsx`; the browser tier gains one `e2e/admin.spec.ts` owned by SWHM-T-0123. Implementation containers ship no Chromium, so those assertions are observed in CI and at integration QA, not locally.
9. **CI** — unchanged and verified, not assumed: `.github/workflows/ci.yml` already triggers on push and pull request to `vortex/**`, `dev` and `main`, and its single job runs lint, typecheck, unit and browser tiers (F13). No ticket in this sprint edits it.

## Design references

Exported from idea SWHM-I-0006 (doc version 8) to `artifacts/SWHM-S-0012/design/`:
`wireframe-admin-login.html`, `wireframe-admin-home.html`, `wireframe-login-error.html`,
`wireframe-orders-view.html`, and the four `mockup-*.html` siblings. `MANIFEST.md` beside them says
what each one fixes. The mockups use this repository's own design tokens unchanged (F11).
