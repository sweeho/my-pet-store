# Administrative Operations — Implementation Tasks

## 1. Admin Authentication & Security

- [x] 1.1 Configure web.xml security-constraint for administrator role (SWHM-T-0114)
- [x] 1.2 Set form-based login-config with login.jsp and error.jsp (SWHM-T-0114)
- [x] 1.3 Implement session-timeout of 54 minutes in web.xml (SWHM-T-0114)
- [x] 1.4 Create login.jsp with username (j_username) and password (j_password) fields (SWHM-T-0114)
- [x] 1.5 Pre-populate login form with default values (jps_admin / admin) for development (SWHM-T-0114)
- [x] 1.6 Implement form action as j_security_check (J2EE standard endpoint) (SWHM-T-0114)
- [x] 1.7 Create error.jsp for failed authentication display (SWHM-T-0114)
- [x] 1.8 Implement session attributes j_signon and j_signon_username (SWHM-T-0114)
- [x] 1.9 Create logout.jsp to call session.invalidate() and redirect to index.html (SWHM-T-0114)

## 2. Admin Home Page & Navigation

- [x] 2.1 Create index.jsp for authenticated admin users (SWHM-T-0115)
- [x] 2.2 Display description of admin client capabilities (order management, sales visibility) (SWHM-T-0115)
- [x] 2.3 Add form to launch Java Web Start with currentScreen=manageorders (SWHM-T-0115)
- [x] 2.4 Add form to logout with currentScreen=logout (SWHM-T-0115)
- [x] 2.5 Wire AdminRequestProcessor routing for both forms (SWHM-T-0115)

## 3. Rich Client Deployment (Java Web Start)

- [x] 3.1 Implement AdminRequestProcessor.doPost to handle manageorders screen (SWHM-T-0116)
- [x] 3.2 Generate JNLP file in buildJNLP() method (SWHM-T-0116)
- [x] 3.3 Include session ID (jsessionid) in JNLP server URL (SWHM-T-0116)
- [x] 3.4 Set response content type to application/x-java-jnlp-file (SWHM-T-0116)
- [x] 3.5 Implement logout handling in AdminRequestProcessor (SWHM-T-0116)

## 4. Rich Client Request Handler (ApplRequestProcessor)

- [x] 4.1 Implement ApplRequestProcessor for rich client XML requests (SWHM-T-0117)
- [x] 4.2 Parse XML request and extract request type and parameters (SWHM-T-0117)
- [x] 4.3 Validate session ID and deny requests from unauthenticated clients (SWHM-T-0117)
- [x] 4.4 Route request types: GETORDERS, UPDATESTATUS, REVENUE, ORDERS (SWHM-T-0117)
- [x] 4.5 Return XML responses with consistent structure (SWHM-T-0117)

## 5. Order Management

- [x] 5.1 Implement AdminRequestBD.getOrdersByStatus(status) (SWHM-T-0118)
- [x] 5.2 Delegate to OPCAdminFacade.getOrdersByStatus(status) (SWHM-T-0118)
- [x] 5.3 Implement ApplRequestProcessor.getOrders() to marshal XML response (SWHM-T-0118)
- [x] 5.4 Create OrderDetails transfer object with orderId, userId, orderDate, orderValue, orderStatus (SWHM-T-0118)
- [x] 5.5 Implement XML marshaling to <Order> elements with OrderId, UserId, OrderDate, OrderAmount, OrderStatus (SWHM-T-0118)

## 6. Order Status Updates

- [x] 6.1 Implement AdminRequestBD.updateOrders(OrderApproval oa) (SWHM-T-0119)
- [x] 6.2 Delegate to AsyncSender EJB via ServiceLocator (SWHM-T-0119)
- [x] 6.3 Implement ApplRequestProcessor.updateOrders() to parse XML (SWHM-T-0119)
- [x] 6.4 Extract order IDs and new status from XML (SWHM-T-0119)
- [x] 6.5 Create ChangedOrder objects for each order (SWHM-T-0119)
- [x] 6.6 Support multiple orders in single batch update (SWHM-T-0119)
- [x] 6.7 Return SUCCESS or error message in XML response (SWHM-T-0119)

## 7. Revenue Reporting

- [ ] 7.1 Implement AdminRequestBD.getChartInfo(REVENUE, start, end, category) (SWHM-T-0120)
- [ ] 7.2 Delegate to OPCAdminFacade.getChartInfo() with request type REVENUE (SWHM-T-0120)
- [ ] 7.3 Implement ApplRequestProcessor.getChartInfo() for REVENUE type (SWHM-T-0120)
- [ ] 7.4 Parse date range from Start/End parameters in MM/dd/yyyy format (SWHM-T-0120)
- [ ] 7.5 Retrieve revenue Map from EJB (SWHM-T-0120)
- [ ] 7.6 Marshal results to XML with Category or Item elements (conditional on category parameter) (SWHM-T-0120)
- [ ] 7.7 Include revenue amounts and TotalSales in response (SWHM-T-0120)

## 8. Order Count Reporting

- [ ] 8.1 Implement ApplRequestProcessor.getChartInfo() for ORDERS type (SWHM-T-0121)
- [ ] 8.2 Retrieve order count Map from EJB via getChartInfo(ORDERS, start, end, category) (SWHM-T-0121)
- [ ] 8.3 Marshal results to XML with Category or Item elements (SWHM-T-0121)
- [ ] 8.4 Include order quantities and TotalSales in response (SWHM-T-0121)

## 9. Rich Client UI — Orders View

- [ ] 9.1 Implement OrdersViewPanel in rich client (SWHM-T-0122)
- [ ] 9.2 Create OrdersViewTableModel extending DefaultTableModel (SWHM-T-0122)
- [ ] 9.3 Define columns: Order ID, User ID, Order Date, Order Amount, Status (SWHM-T-0122)
- [ ] 9.4 Set isCellEditable() to return false (read-only) (SWHM-T-0122)
- [ ] 9.5 Implement DataSource.loadOrdersByStatus() to fetch from server (SWHM-T-0122)
- [ ] 9.6 Display approved, completed, and denied orders in table (SWHM-T-0122)

## 10. Error Handling & Validation

- [ ] 10.1 Validate administrator role on all protected endpoints (SWHM-T-0123)
- [ ] 10.2 Check for null session and deny unauthenticated requests (SWHM-T-0123)
- [ ] 10.3 Return descriptive error messages for invalid request types (SWHM-T-0123)
- [ ] 10.4 Return error messages for failed order updates (SWHM-T-0123)
- [ ] 10.5 Handle RemoteException from EJB calls (SWHM-T-0123)
- [ ] 10.6 Handle ServiceLocatorException for EJB lookup failures (SWHM-T-0123)
