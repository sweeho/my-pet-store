# Admin Operations — Implementation Tasks

## 1. Authentication & Authorization

- [ ] 1.1 Implement form-based authentication for /admin endpoints with login.jsp
- [ ] 1.2 Configure security-constraint in web.xml to restrict /AdminRequestProcessor to administrator role
- [ ] 1.3 Implement session-based authorization checking in ApplRequestProcessor
- [ ] 1.4 Configure session timeout of 54 minutes in web.xml
- [ ] 1.5 Implement logout functionality that invalidates the session
- [ ] 1.6 Implement session validation error response when session is expired

## 2. JNLP & Web Start Deployment

- [ ] 2.1 Implement dynamic JNLP generation in AdminRequestProcessor.buildJNLP()
- [ ] 2.2 Embed HTTP session ID in JNLP application arguments
- [ ] 2.3 Set JNLP codebase to correct server URL
- [ ] 2.4 Configure JAR file resources in JNLP
- [ ] 2.5 Set appropriate Java version requirement in JNLP
- [ ] 2.6 Configure JNLP response content-type as application/x-java-jnlp-file
- [ ] 2.7 Test rich client launch via Web Start

## 3. Rich Client Backend API

- [ ] 3.1 Implement XML parsing in ApplRequestProcessor for incoming requests
- [ ] 3.2 Implement request type dispatching (GETORDERS, UPDATESTATUS, REVENUE, ORDERS)
- [ ] 3.3 Implement error handling for invalid/unknown request types
- [ ] 3.4 Implement XML response generation with proper headers and structure
- [ ] 3.5 Implement ServletOutputStream-based response writing

## 4. Order Management Workflows

- [ ] 4.1 Implement GETORDERS workflow to retrieve orders by status
- [ ] 4.2 Implement AdminRequestBD.getOrdersByStatus() to delegate to OPCAdminFacade EJB
- [ ] 4.3 Implement response marshaling with OrderId, UserId, OrderDate, OrderAmount, OrderStatus fields
- [ ] 4.4 Implement UPDATESTATUS workflow to update order status in batch
- [ ] 4.5 Implement OrderApproval object serialization to XML
- [ ] 4.6 Implement AsyncSender EJB invocation for asynchronous notification
- [ ] 4.7 Test batch order updates complete without errors

## 5. Report Generation

- [ ] 5.1 Implement REVENUE report generation (getChartInfo with request type REVENUE)
- [ ] 5.2 Implement ORDERS report generation (getChartInfo with request type ORDERS)
- [ ] 5.3 Implement date range filtering (Start and End dates)
- [ ] 5.4 Implement optional category filtering (ReqCategory parameter)
- [ ] 5.5 Implement date parsing in getProperDate() for mm/dd/yyyy format
- [ ] 5.6 Implement revenue aggregation with float values and TotalSales sum
- [ ] 5.7 Implement order quantity aggregation with integer values and TotalSales sum
- [ ] 5.8 Implement category-level and item-level aggregation based on ReqCategory presence
- [ ] 5.9 Test date parsing with valid and edge-case dates (e.g., 01/01/2020, 12/31/2025)
- [ ] 5.10 Test report generation for all supported categories

## 6. Rich Client Communication

- [ ] 6.1 Implement HttpPostPetStoreProxy to connect to ApplRequestProcessor
- [ ] 6.2 Implement session ID embedding in request URL (jsessionid parameter)
- [ ] 6.3 Implement XML request serialization for GETORDERS, UPDATESTATUS, REVENUE, ORDERS
- [ ] 6.4 Implement XML response parsing in rich client
- [ ] 6.5 Implement error message extraction and display in rich client
- [ ] 6.6 Test rich client can establish connection and send requests
- [ ] 6.7 Test session persistence across multiple requests

## 7. Data Access & Integration

- [ ] 7.1 Implement OPCAdminFacade EJB lookup and invocation
- [ ] 7.2 Implement order retrieval by status from order database
- [ ] 7.3 Implement AsyncSender EJB lookup via ServiceLocator
- [ ] 7.4 Implement message sending for order approvals/denials
- [ ] 7.5 Implement chart/report data queries (revenue, order quantities)
- [ ] 7.6 Implement category and date filtering in database queries
- [ ] 7.7 Test end-to-end order retrieval workflow
- [ ] 7.8 Test asynchronous order approval notifications

## 8. Error Handling & Validation

- [ ] 8.1 Implement session null check with appropriate error message
- [ ] 8.2 Implement request parsing error handling
- [ ] 8.3 Implement database query error handling with user-friendly messages
- [ ] 8.4 Implement EJB lookup error handling
- [ ] 8.5 Implement date parsing error handling (invalid format)
- [ ] 8.6 Implement null value handling for optional fields (ReqCategory)
- [ ] 8.7 Test error scenarios (invalid dates, empty status, missing required fields)

## 9. Testing

- [ ] 9.1 Write unit tests for GETORDERS request parsing and response generation
- [ ] 9.2 Write unit tests for UPDATESTATUS request parsing
- [ ] 9.3 Write unit tests for REVENUE report aggregation
- [ ] 9.4 Write unit tests for ORDERS report aggregation
- [ ] 9.5 Write unit tests for date parsing (mm/dd/yyyy format)
- [ ] 9.6 Write integration tests for order retrieval from OPCAdminFacade
- [ ] 9.7 Write integration tests for async order approval notifications
- [ ] 9.8 Write integration tests for report generation with real data
- [ ] 9.9 Write E2E tests for rich client to server communication
- [ ] 9.10 Write E2E tests for complete admin workflow (login → launch → manage orders → reports)
- [ ] 9.11 Test session timeout behavior
- [ ] 9.12 Test concurrent admin sessions

## 10. Security & Compliance

- [ ] 10.1 Verify form-based authentication enforces password requirements
- [ ] 10.2 Verify administrator role check on all admin endpoints
- [ ] 10.3 Verify session validation on every request
- [ ] 10.4 Consider upgrading transport-guarantee to CONFIDENTIAL (HTTPS) for production
- [ ] 10.5 Verify no sensitive data is logged in error messages
- [ ] 10.6 Review JNLP file for security permissions (all-permissions required?)
- [ ] 10.7 Test against unauthorized access attempts
