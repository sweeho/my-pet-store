## ADDED Requirements

### Requirement: Administrator authentication
The system SHALL require administrators to authenticate via form-based login before accessing administrative functions. The authentication mechanism SHALL validate username and password credentials and enforce the "administrator" role for access to admin request processing.

#### Scenario: Administrator logs in with valid credentials
- **GIVEN** an unauthenticated user accesses the admin interface login page
- **WHEN** the user submits username and password credentials via the form-login mechanism to j_security_check
- **THEN** the system SHALL validate the credentials and create an authenticated session with the "administrator" role

#### Scenario: Unauthenticated user attempts to access admin endpoint
- **GIVEN** an HTTP request to /AdminRequestProcessor with no valid session
- **WHEN** the system processes the request
- **THEN** the system SHALL reject the request and redirect to the login page

### Requirement: Session management for administrators
The system SHALL maintain HTTP sessions for authenticated administrators with a maximum inactivity timeout of 54 minutes. The session SHALL be invalidated when the administrator initiates logout.

#### Scenario: Administrator session times out
- **GIVEN** an authenticated administrator with an active session
- **WHEN** 54 minutes of inactivity passes without any request
- **THEN** the system SHALL automatically invalidate the session

#### Scenario: Administrator logs out
- **GIVEN** an authenticated administrator with an active session
- **WHEN** the administrator clicks the logout button or action
- **THEN** the system SHALL invalidate the session and redirect to the login page

### Requirement: JNLP file generation for rich client deployment
The system SHALL dynamically generate a JNLP (Java Network Launch Protocol) file to enable Java Web Start deployment of the admin rich client. The JNLP file SHALL embed the current HTTP session ID as an application argument so the rich client can authenticate to subsequent API requests.

#### Scenario: Administrator launches rich client
- **GIVEN** an authenticated administrator on the admin home page
- **WHEN** the administrator clicks the "Launch Rich Client" button and submits the form with currentScreen=manageorders
- **THEN** the system SHALL generate a dynamic JNLP file with correct codebase, JAR resources, and the current session ID as an application argument

#### Scenario: JNLP file is served with correct content-type
- **GIVEN** a request for JNLP file generation
- **WHEN** the system processes the request
- **THEN** the system SHALL respond with content-type application/x-java-jnlp-file

### Requirement: Order retrieval by status
The system SHALL retrieve all orders matching a specified status (PENDING, APPROVED, DENIED, COMPLETED) and return complete order details including order ID, user ID, order date, order amount, and order status.

#### Scenario: Administrator requests pending orders
- **GIVEN** an authenticated administrator with an active rich client session
- **WHEN** the administrator sends a GETORDERS request with Status=PENDING
- **THEN** the system SHALL query the order database, return all PENDING orders with fields OrderId, UserId, OrderDate, OrderAmount, OrderStatus, and include TotalCount of matching orders

#### Scenario: Order list is empty
- **GIVEN** a GETORDERS request for a status with no matching orders
- **WHEN** the system processes the request
- **THEN** the system SHALL return an empty order list with TotalCount=0

### Requirement: Order status update workflow
The system SHALL accept batch status updates for one or more orders in a single operation. Each order update specifies an OrderId and a new OrderStatus value. Status updates SHALL be sent asynchronously to a message queue for notification processing.

#### Scenario: Administrator approves multiple orders
- **GIVEN** an authenticated administrator selects multiple PENDING orders in the rich client
- **WHEN** the administrator clicks the Approve button and then Commit
- **THEN** the system SHALL send an UPDATESTATUS request with multiple orders and status=APPROVED to the server, delegate to AsyncSender EJB for asynchronous processing, and return success response

#### Scenario: Administrator denies an order
- **GIVEN** an authenticated administrator selects a PENDING order
- **WHEN** the administrator clicks the Deny button and clicks Commit
- **THEN** the system SHALL update the order status to DENIED asynchronously

### Requirement: Revenue report generation
The system SHALL generate revenue reports aggregating order sales amounts by category or item within a specified date range. The report SHALL support optional category filtering and SHALL return per-category/item amounts plus a total sum.

#### Scenario: Administrator generates revenue report by category
- **GIVEN** an authenticated administrator requests a REVENUE report
- **WHEN** the administrator specifies Start date, End date, and no ReqCategory (category-level aggregation)
- **THEN** the system SHALL aggregate order amounts by product category, return each category name with its total revenue as a float value, and include TotalSales as the sum of all category revenues

#### Scenario: Administrator generates revenue report filtered by category
- **GIVEN** a REVENUE report request with ReqCategory=BIRDS
- **WHEN** the system processes the request
- **THEN** the system SHALL aggregate order amounts by individual item (product) within the BIRDS category, return each item with its revenue, and include TotalSales

### Requirement: Order quantity report generation
The system SHALL generate order quantity reports aggregating order counts by category or item within a specified date range. The report structure SHALL match revenue reports but return integer quantities instead of float amounts.

#### Scenario: Administrator generates order report by category
- **GIVEN** an authenticated administrator requests an ORDERS report
- **WHEN** the administrator specifies Start date, End date, and no ReqCategory
- **THEN** the system SHALL aggregate order quantities by product category, return each category name with its total order count as an integer, and include TotalSales as the sum of all quantities

### Requirement: Date format for reports
The system SHALL parse date inputs for reports in mm/dd/yyyy format. Dates SHALL be converted to Date objects for backend processing.

#### Scenario: Administrator submits report with valid dates
- **GIVEN** a report request with Start=09/15/2025 and End=09/30/2025
- **WHEN** the system processes the request
- **THEN** the system SHALL parse the dates in mm/dd/yyyy format and convert them to Date objects for filtering

#### Scenario: Administrator submits report with different valid dates
- **GIVEN** a report request with Start=01/01/2020 and End=12/31/2025
- **WHEN** the system processes the dates
- **THEN** the system SHALL correctly parse and convert both dates

### Requirement: Session validation in rich client requests
The system SHALL validate the HTTP session ID on every request from the rich client. If the session is invalid or expired, the system SHALL return an error message indicating session timeout and instruct the user to re-login.

#### Scenario: Rich client sends request with valid session ID
- **GIVEN** a rich client with a valid, embedded session ID in the request URL
- **WHEN** the ApplRequestProcessor receives the request
- **THEN** the system SHALL proceed with processing

#### Scenario: Rich client sends request with expired session
- **GIVEN** a rich client with a session ID that has timed out or been invalidated
- **WHEN** the ApplRequestProcessor receives the request
- **THEN** the system SHALL return error message "Session Timed Out; Please exit and login as admin from the login page"

### Requirement: XML request/response protocol for rich client
The system SHALL implement an XML-based RPC protocol for communication between the rich client and server. All requests and responses SHALL be well-formed XML documents containing a Type element specifying the operation (GETORDERS, UPDATESTATUS, REVENUE, ORDERS).

#### Scenario: Rich client sends GETORDERS request
- **GIVEN** a rich client sending an order management request
- **WHEN** the client sends XML with Type=GETORDERS and Status=PENDING
- **THEN** the server SHALL parse the XML, dispatch to the correct handler, and return XML response with matching structure

#### Scenario: Rich client receives revenue report response
- **GIVEN** a REVENUE report request in XML format
- **WHEN** the server generates the report
- **THEN** the system SHALL return XML response with Type=REVENUE, Start, End, ReqCategory, aggregated data elements, and TotalSales

### Requirement: Error handling for admin requests
The system SHALL return structured XML error responses when requests fail or encounter exceptional conditions. Error responses SHALL include a Type element matching the request type and an Error element with a descriptive message.

#### Scenario: Invalid request type is submitted
- **GIVEN** a request with an unrecognized Type value
- **WHEN** ApplRequestProcessor receives the request
- **THEN** the system SHALL return error response: "Unable to process request : Unknown request type - [TYPE]"

#### Scenario: Exception occurs during request processing
- **GIVEN** an order update request that fails
- **WHEN** an exception is thrown during processing
- **THEN** the system SHALL return error response: "Exception while processing : [exception message]. Please try again"

### Requirement: Asynchronous order approval notifications
The system SHALL send order approval and denial notifications asynchronously via message queue. When order status is updated to APPROVED or DENIED, the system SHALL queue a notification message without blocking the admin user interface.

#### Scenario: Order status update triggers asynchronous notification
- **GIVEN** an administrator updates order status to APPROVED
- **WHEN** the UPDATESTATUS request is processed
- **THEN** the system SHALL serialize the order data to XML, invoke AsyncSender EJB to send a message to the queue, and return success to the client without waiting for message processing

### Requirement: Order status values
The system SHALL support four distinct order statuses throughout the order lifecycle: PENDING (initial state), APPROVED (administrator approval), DENIED (administrator rejection), and COMPLETED (fulfillment complete).

#### Scenario: Order transitions through statuses
- **GIVEN** an order in PENDING status
- **WHEN** the administrator updates status to APPROVED
- **THEN** the system SHALL accept the status change and transition the order

#### Scenario: All supported statuses are accessible
- **GIVEN** the order management system
- **WHEN** administrators query or update orders
- **THEN** the system SHALL recognize and handle PENDING, APPROVED, DENIED, and COMPLETED as valid statuses
