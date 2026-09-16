## ADDED Requirements

### Requirement: Administrator workflow with login, home page, and rich client launch
The system SHALL provide an administrator workflow consisting of: login to admin interface, access admin home page, launch Java Web Start rich client application, and use rich client for order and sales management.

#### Scenario: Administrator authenticates and accesses admin interface
- **GIVEN** an administrator attempting to access the admin interface
- **WHEN** the administrator provides valid credentials (username and password)
- **THEN** the system SHALL authenticate the user, create a session, and grant access to the admin interface

#### Scenario: Authenticated administrator launches rich client
- **GIVEN** an authenticated administrator on the admin home page
- **WHEN** the administrator clicks the Launch Rich Client button
- **THEN** the system SHALL generate a JNLP file with the session ID and initiate Java Web Start deployment

### Requirement: Retrieve and display orders by status
The system SHALL retrieve pending or approved orders and display order details including order ID, user ID, order date, order amount, and order status.

#### Scenario: Administrator requests orders with specific status
- **GIVEN** the rich client requesting orders via GETORDERS request type
- **WHEN** the Status parameter is set to "approved"
- **THEN** the system SHALL return XML with order list containing OrderId, UserId, OrderDate, OrderAmount, OrderStatus

#### Scenario: Orders are displayed in read-only table
- **GIVEN** orders retrieved from server
- **WHEN** displayed in Orders View Panel
- **THEN** the table SHALL show approved, completed, and denied orders with columns for ID, User, Date, Amount, Status (all read-only)

### Requirement: Update order status in batch
The system SHALL update the status of one or more orders in a single operation, accepting order IDs and a new status value.

#### Scenario: Administrator updates multiple orders
- **GIVEN** a list of selected orders and a new status value
- **WHEN** the administrator submits the update
- **THEN** the system SHALL send UPDATESTATUS request with all orders and new status, and delegate to AsyncSender for processing

#### Scenario: Status update is processed asynchronously
- **GIVEN** an order status update request
- **WHEN** the update is submitted to AdminRequestBD.updateOrders()
- **THEN** the system SHALL create an OrderApproval XML and send message via AsyncSender EJB

### Requirement: Generate revenue reports by category
The system SHALL generate revenue reports showing total sales by category or item for a specified date range, with optional filtering by product category.

#### Scenario: Administrator requests revenue report
- **GIVEN** the rich client requesting revenue data via REVENUE request type
- **WHEN** Start date "01/15/2023", End date "01/31/2023", and optional ReqCategory are provided
- **THEN** the system SHALL return XML with revenue amounts by category/item and TotalSales sum

#### Scenario: Revenue report filters by category
- **GIVEN** a revenue report request with ReqCategory specified
- **WHEN** the category parameter is provided
- **THEN** the system SHALL return revenue data by Item (not Category)

#### Scenario: Revenue report includes all categories
- **GIVEN** a revenue report request without category filter
- **WHEN** ReqCategory is null
- **THEN** the system SHALL return revenue data by Category for all categories

### Requirement: Generate order count reports by category
The system SHALL generate order count reports showing order quantity by category or item for a specified date range, with optional filtering by product category.

#### Scenario: Administrator requests order count report
- **GIVEN** the rich client requesting order counts via ORDERS request type
- **WHEN** Start and End dates are provided with optional ReqCategory
- **THEN** the system SHALL return XML with order quantities by category/item and TotalSales sum

#### Scenario: Order count report filters by category
- **GIVEN** an order count request with category filter
- **WHEN** the category parameter is provided
- **THEN** the system SHALL return quantities by Item (not Category)

### Requirement: Retrieve and display chart data with date range filtering
The system SHALL retrieve and display sales data in two chart formats: revenue by category (pie chart) and order count by category (bar chart). Each chart SHALL be filterable by a date range (start date and end date) and by category.

#### Scenario: Chart model stores date range
- **GIVEN** a ChartModel object
- **WHEN** dates are set via setDates(Date startDate, Date endDate)
- **THEN** the chart SHALL store the date range and apply it to subsequent queries

#### Scenario: Chart data is retrieved with date filtering
- **GIVEN** a revenue or order count report request with date range
- **WHEN** the request is submitted to getChartInfo()
- **THEN** the system SHALL filter data to only include transactions within the specified date range

### Requirement: Administrator login form with pre-populated default values
The system SHALL display an administrator login form accepting username and password, with fields pre-populated with default values (username: jps_admin, password: admin).

#### Scenario: Login form displays with pre-populated credentials
- **GIVEN** an administrator accessing the login page
- **WHEN** login.jsp is rendered
- **THEN** the form SHALL display username text field with value="jps_admin" and password field with value="admin"

#### Scenario: Administrator can modify and submit credentials
- **GIVEN** the login form with pre-populated values
- **WHEN** the administrator enters different credentials and submits
- **THEN** the form SHALL POST to j_security_check endpoint with provided username and password

### Requirement: Administrator home page with rich client launch and logout options
The system SHALL display an administrator home page that presents options to launch a Java Web Start rich client application or logout. The home page SHALL describe the rich client's capabilities for order and sales management.

#### Scenario: Admin home page displays launch and logout buttons
- **GIVEN** an authenticated administrator after login
- **WHEN** index.jsp is displayed
- **THEN** the page SHALL show title, description of admin capabilities, Launch Rich Client button, and logout button

#### Scenario: Launch Rich Client form submits to correct endpoint
- **GIVEN** the admin home page
- **WHEN** Launch Rich Client button is clicked
- **THEN** the form SHALL POST to AdminRequestProcessor with currentScreen=manageorders

#### Scenario: Logout form invalidates session
- **GIVEN** an authenticated administrator
- **WHEN** the logout button is clicked
- **THEN** the form SHALL POST to AdminRequestProcessor with currentScreen=logout, triggering session.invalidate()

### Requirement: Orders View screen displays approved and completed orders in read-only table
The Orders View screen SHALL display a read-only table of all approved, completed, and denied orders, with columns for Order ID, User ID, Order Date, Order Amount, and Status.

#### Scenario: Orders View displays all order columns
- **GIVEN** the Orders View Panel in rich client
- **WHEN** orders are retrieved from server and loaded into table
- **THEN** the table SHALL show columns for Order ID, User ID, Order Date, Order Amount, Status

#### Scenario: Table is read-only
- **GIVEN** the Orders View table model
- **WHEN** any cell is queried via isCellEditable()
- **THEN** the model SHALL return false for all rows and columns (preventing user edits)

#### Scenario: Orders View shows approved, completed, and denied orders
- **GIVEN** orders retrieved from server
- **WHEN** displayed in OrdersViewTableModel
- **THEN** the table SHALL include only orders with status in [APPROVED, COMPLETED, DENIED]

### Requirement: Administrator error page displays authentication failure message
The sign-on error page SHALL display a generic error message indicating authentication failed and prompt the user to try again.

#### Scenario: Error page shows after failed login
- **GIVEN** an administrator with incorrect credentials
- **WHEN** login authentication fails
- **THEN** the system SHALL redirect to error.jsp and display error message directing user to verify credentials

#### Scenario: Error page provides link to retry login
- **GIVEN** the authentication error page
- **WHEN** displayed
- **THEN** the page SHALL provide a link or way to return to the login page for another attempt

