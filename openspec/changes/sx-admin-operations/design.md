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

