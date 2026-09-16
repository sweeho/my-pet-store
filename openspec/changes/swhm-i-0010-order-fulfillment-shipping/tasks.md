# Order Fulfillment & Shipment Management — Implementation Tasks

## 1. Data Model & Entities

- [x] 1.1 Implement SupplierOrder entity with poId, userId, poDate, poStatus fields (SWHM-T-0187)
- [x] 1.2 Implement LineItem entity with itemId, quantity, quantityShipped, categoryId, productId, unitPrice (SWHM-T-0187)
- [x] 1.3 Implement Inventory entity with itemId, quantity fields (SWHM-T-0187)
- [x] 1.4 Establish relationships: SupplierOrder → LineItem (one-to-many) (SWHM-T-0187)
- [x] 1.5 Establish relationships: SupplierOrder → Inventory (via LineItem → Item) (SWHM-T-0187)
- [x] 1.6 Define order status enumeration: PENDING, COMPLETED (SWHM-T-0187)

## 2. Message-Driven Bean Setup

- [ ] 2.1 Implement SupplierOrderMDB with MessageDrivenBean interface (SWHM-T-0193)
- [ ] 2.2 Implement MessageListener interface with onMessage(Message msg) (SWHM-T-0193)
- [ ] 2.3 Configure message-driven-destination in ejb-jar.xml with destination-type javax.jms.Queue (SWHM-T-0193)
- [ ] 2.4 Configure transaction-type Container in ejb-jar.xml (SWHM-T-0193)
- [ ] 2.5 Wire JMS resource-ref in web.xml for OPC queue (SWHM-T-0193)
- [ ] 2.6 Extract TextMessage content in onMessage() (SWHM-T-0193)
- [ ] 2.7 Parse serialized purchase order XML from message (SWHM-T-0193)

## 3. Order Fulfillment Processing

- [ ] 3.1 Implement OrderFulfillmentFacadeEJB with processPO(SupplierOrderLocal po) method (SWHM-T-0192)
- [ ] 3.2 Implement processAnOrder(SupplierOrderLocal po) for line item iteration (SWHM-T-0192)
- [ ] 3.3 Initialize allItemsAvailable flag to true before processing (SWHM-T-0192)
- [ ] 3.4 Implement line item filtering: skip items where quantityShipped == quantity (SWHM-T-0192)
- [ ] 3.5 Call checkInventory() for each unshipped line item (SWHM-T-0192)
- [ ] 3.6 Set quantityShipped equal to quantity for available items (SWHM-T-0192)
- [ ] 3.7 Update order status to COMPLETED when allItemsAvailable is true (SWHM-T-0192)
- [ ] 3.8 Collect fulfilled items in HashMap for invoice generation (SWHM-T-0192)

## 4. Inventory Verification & Reduction

- [x] 4.1 Implement checkInventory(LineItemLocal item) method (SWHM-T-0188)
- [x] 4.2 Query InventoryLocal by item.getItemId() (SWHM-T-0188)
- [x] 4.3 Compare inventory quantity against ordered quantity (SWHM-T-0188)
- [x] 4.4 Call inv.reduceQuantity() for available items (SWHM-T-0188)
- [x] 4.5 Return boolean success/failure (SWHM-T-0188)
- [x] 4.6 Implement InventoryEJB.reduceQuantity(int quantity) (SWHM-T-0188)
- [x] 4.7 Retrieve current quantity and decrement atomically (SWHM-T-0188)
- [x] 4.8 Declare reduceQuantity with Required transaction attribute in ejb-jar.xml (SWHM-T-0188)

## 5. Invoice Generation

- [x] 5.1 Implement createInvoice(SupplierOrderLocal po, HashMap fulfilledItems) (SWHM-T-0189)
- [x] 5.2 Create TPAInvoiceXDE document instance (SWHM-T-0189)
- [x] 5.3 Set invoice metadata: poId, userId, poDate, shippingDate (SWHM-T-0189)
- [x] 5.4 Iterate fulfilled items from HashMap (SWHM-T-0189)
- [x] 5.5 Add each line item to invoice with: categoryId, productId, itemId, lineNumber, quantity, unitPrice (SWHM-T-0189)
- [x] 5.6 Generate and return serialized XML invoice string (SWHM-T-0189)
- [x] 5.7 Implement XMLDocumentException handling (SWHM-T-0189)

## 6. Order Status Tracking

- [x] 6.1 Implement order status field with valid values PENDING, COMPLETED (SWHM-T-0190)
- [x] 6.2 Set order status to PENDING when order is created (SWHM-T-0190)
- [x] 6.3 Transition order status to COMPLETED after fulfillment (SWHM-T-0190)
- [x] 6.4 Prevent status changes for already-completed orders (SWHM-T-0190)
- [x] 6.5 Implement getPoStatus() and setPoStatus() accessor methods (SWHM-T-0190)

## 7. Line Item Shipment Tracking

- [x] 7.1 Implement quantityShipped field on LineItem entity (SWHM-T-0191)
- [x] 7.2 Initialize quantityShipped to 0 on line item creation (SWHM-T-0191)
- [x] 7.3 Track partial shipments by updating quantityShipped (SWHM-T-0191)
- [x] 7.4 Implement logic to skip re-processing already-shipped items (SWHM-T-0191)
- [x] 7.5 Support multiple shipment updates for partial fulfillment (SWHM-T-0191)

## 8. Inventory Management UI

- [ ] 8.1 Build DisplayInventoryBean to retrieve inventory items (SWHM-T-0195)
- [ ] 8.2 Implement getInventory() to return InventoryLocal collection (SWHM-T-0195)
- [ ] 8.3 Create displayinventory.jsp with inventory table display (SWHM-T-0195)
- [ ] 8.4 Render item ID, existing quantity columns (SWHM-T-0195)
- [ ] 8.5 Add text input fields for new quantities (name: qty\_<itemId>) (SWHM-T-0195)
- [ ] 8.6 Add checkboxes for item selection (name: item\_<itemId>) (SWHM-T-0195)
- [ ] 8.7 Wire form submission to RcvrRequestProcessor with action=updateinventory (SWHM-T-0195)
- [ ] 8.8 Implement request.isUserInRole("administrator") authorization check (SWHM-T-0195)

## 9. Supplier Home Page

- [ ] 9.1 Create index.jsp with supplier home page content (SWHM-T-0194)
- [ ] 9.2 Display module description and features (SWHM-T-0194)
- [ ] 9.3 Add form to display inventory (posts to RcvrRequestProcessor) (SWHM-T-0194)
- [ ] 9.4 Add logout form (posts to RcvrRequestProcessor) (SWHM-T-0194)
- [ ] 9.5 Implement role-based navigation (SWHM-T-0194)

## 10. Integration & Exception Handling

- [ ] 10.1 Configure message selector for OPC queue messages (SWHM-T-0196)
- [ ] 10.2 Implement retry logic for failed PO processing (SWHM-T-0196)
- [ ] 10.3 Handle XMLDocumentException during parsing/generation (SWHM-T-0196)
- [ ] 10.4 Handle ServiceLocator exceptions for EJB lookup (SWHM-T-0196)
- [ ] 10.5 Implement proper error logging (SWHM-T-0196)
- [ ] 10.6 Test message consumption and processing (SWHM-T-0196)
