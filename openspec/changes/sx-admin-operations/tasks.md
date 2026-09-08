# Administrative Operations — Implementation Tasks

## 1. Admin Authentication & Security

- [ ] 1.1 Configure web.xml security-constraint for administrator role
- [ ] 1.2 Set form-based login-config with login.jsp and error.jsp
- [ ] 1.3 Implement session-timeout of 54 minutes in web.xml
- [ ] 1.4 Create login.jsp with username (j_username) and password (j_password) fields
- [ ] 1.5 Pre-populate login form with default values (jps_admin / admin) for development
- [ ] 1.6 Implement form action as j_security_check (J2EE standard endpoint)
- [ ] 1.7 Create error.jsp for failed authentication display
- [ ] 1.8 Implement session attributes j_signon and j_signon_username
- [ ] 1.9 Create logout.jsp to call session.invalidate() and redirect to index.html

## 2. Admin Home Page & Navigation

- [ ] 2.1 Create index.jsp for authenticated admin users
- [ ] 2.2 Display description of admin client capabilities (order management, sales visibility)
- [ ] 2.3 Add form to launch Java Web Start with currentScreen=manageorders
- [ ] 2.4 Add form to logout with currentScreen=logout
- [ ] 2.5 Wire AdminRequestProcessor routing for both forms

## 3. Rich Client Deployment (Java Web Start)

- [ ] 3.1 Implement AdminRequestProcessor.doPost to handle manageorders screen
- [ ] 3.2 Generate JNLP file in buildJNLP() method
- [ ] 3.3 Include session ID (jsessionid) in JNLP server URL
- [ ] 3.4 Set response content type to application/x-java-jnlp-file
- [ ] 3.5 Implement logout handling in AdminRequestProcessor

## 4. Rich Client Request Handler (ApplRequestProcessor)

- [ ] 4.1 Implement ApplRequestProcessor for rich client XML requests
- [ ] 4.2 Parse XML request and extract request type and parameters
- [ ] 4.3 Validate session ID and deny requests from unauthenticated clients
- [ ] 4.4 Route request types: GETORDERS, UPDATESTATUS, REVENUE, ORDERS
- [ ] 4.5 Return XML responses with consistent structure

## 5. Order Management

- [ ] 5.1 Implement AdminRequestBD.getOrdersByStatus(status)
- [ ] 5.2 Delegate to OPCAdminFacade.getOrdersByStatus(status)
- [ ] 5.3 Implement ApplRequestProcessor.getOrders() to marshal XML response
- [ ] 5.4 Create OrderDetails transfer object with orderId, userId, orderDate, orderValue, orderStatus
- [ ] 5.5 Implement XML marshaling to <Order> elements with OrderId, UserId, OrderDate, OrderAmount, OrderStatus

## 6. Order Status Updates

- [ ] 6.1 Implement AdminRequestBD.updateOrders(OrderApproval oa)
- [ ] 6.2 Delegate to AsyncSender EJB via ServiceLocator
- [ ] 6.3 Implement ApplRequestProcessor.updateOrders() to parse XML
- [ ] 6.4 Extract order IDs and new status from XML
- [ ] 6.5 Create ChangedOrder objects for each order
- [ ] 6.6 Support multiple orders in single batch update
- [ ] 6.7 Return SUCCESS or error message in XML response

## 7. Revenue Reporting

- [ ] 7.1 Implement AdminRequestBD.getChartInfo(REVENUE, start, end, category)
- [ ] 7.2 Delegate to OPCAdminFacade.getChartInfo() with request type REVENUE
- [ ] 7.3 Implement ApplRequestProcessor.getChartInfo() for REVENUE type
- [ ] 7.4 Parse date range from Start/End parameters in MM/dd/yyyy format
- [ ] 7.5 Retrieve revenue Map from EJB
- [ ] 7.6 Marshal results to XML with Category or Item elements (conditional on category parameter)
- [ ] 7.7 Include revenue amounts and TotalSales in response

## 8. Order Count Reporting

- [ ] 8.1 Implement ApplRequestProcessor.getChartInfo() for ORDERS type
- [ ] 8.2 Retrieve order count Map from EJB via getChartInfo(ORDERS, start, end, category)
- [ ] 8.3 Marshal results to XML with Category or Item elements
- [ ] 8.4 Include order quantities and TotalSales in response

## 9. Rich Client UI — Orders View

- [ ] 9.1 Implement OrdersViewPanel in rich client
- [ ] 9.2 Create OrdersViewTableModel extending DefaultTableModel
- [ ] 9.3 Define columns: Order ID, User ID, Order Date, Order Amount, Status
- [ ] 9.4 Set isCellEditable() to return false (read-only)
- [ ] 9.5 Implement DataSource.loadOrdersByStatus() to fetch from server
- [ ] 9.6 Display approved, completed, and denied orders in table

## 10. Error Handling & Validation

- [ ] 10.1 Validate administrator role on all protected endpoints
- [ ] 10.2 Check for null session and deny unauthenticated requests
- [ ] 10.3 Return descriptive error messages for invalid request types
- [ ] 10.4 Return error messages for failed order updates
- [ ] 10.5 Handle RemoteException from EJB calls
- [ ] 10.6 Handle ServiceLocatorException for EJB lookup failures

