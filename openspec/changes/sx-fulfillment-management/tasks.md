# Order Fulfillment & Shipment Management — Implementation Tasks

## 1. Data Model & Entities

- [ ] 1.1 Implement SupplierOrder entity with poId, userId, poDate, poStatus fields
- [ ] 1.2 Implement LineItem entity with itemId, quantity, quantityShipped, categoryId, productId, unitPrice
- [ ] 1.3 Implement Inventory entity with itemId, quantity fields
- [ ] 1.4 Establish relationships: SupplierOrder → LineItem (one-to-many)
- [ ] 1.5 Establish relationships: SupplierOrder → Inventory (via LineItem → Item)
- [ ] 1.6 Define order status enumeration: PENDING, COMPLETED

## 2. Message-Driven Bean Setup

- [ ] 2.1 Implement SupplierOrderMDB with MessageDrivenBean interface
- [ ] 2.2 Implement MessageListener interface with onMessage(Message msg)
- [ ] 2.3 Configure message-driven-destination in ejb-jar.xml with destination-type javax.jms.Queue
- [ ] 2.4 Configure transaction-type Container in ejb-jar.xml
- [ ] 2.5 Wire JMS resource-ref in web.xml for OPC queue
- [ ] 2.6 Extract TextMessage content in onMessage()
- [ ] 2.7 Parse serialized purchase order XML from message

## 3. Order Fulfillment Processing

- [ ] 3.1 Implement OrderFulfillmentFacadeEJB with processPO(SupplierOrderLocal po) method
- [ ] 3.2 Implement processAnOrder(SupplierOrderLocal po) for line item iteration
- [ ] 3.3 Initialize allItemsAvailable flag to true before processing
- [ ] 3.4 Implement line item filtering: skip items where quantityShipped == quantity
- [ ] 3.5 Call checkInventory() for each unshipped line item
- [ ] 3.6 Set quantityShipped equal to quantity for available items
- [ ] 3.7 Update order status to COMPLETED when allItemsAvailable is true
- [ ] 3.8 Collect fulfilled items in HashMap for invoice generation

## 4. Inventory Verification & Reduction

- [ ] 4.1 Implement checkInventory(LineItemLocal item) method
- [ ] 4.2 Query InventoryLocal by item.getItemId()
- [ ] 4.3 Compare inventory quantity against ordered quantity
- [ ] 4.4 Call inv.reduceQuantity() for available items
- [ ] 4.5 Return boolean success/failure
- [ ] 4.6 Implement InventoryEJB.reduceQuantity(int quantity)
- [ ] 4.7 Retrieve current quantity and decrement atomically
- [ ] 4.8 Declare reduceQuantity with Required transaction attribute in ejb-jar.xml

## 5. Invoice Generation

- [ ] 5.1 Implement createInvoice(SupplierOrderLocal po, HashMap fulfilledItems)
- [ ] 5.2 Create TPAInvoiceXDE document instance
- [ ] 5.3 Set invoice metadata: poId, userId, poDate, shippingDate
- [ ] 5.4 Iterate fulfilled items from HashMap
- [ ] 5.5 Add each line item to invoice with: categoryId, productId, itemId, lineNumber, quantity, unitPrice
- [ ] 5.6 Generate and return serialized XML invoice string
- [ ] 5.7 Implement XMLDocumentException handling

## 6. Order Status Tracking

- [ ] 6.1 Implement order status field with valid values PENDING, COMPLETED
- [ ] 6.2 Set order status to PENDING when order is created
- [ ] 6.3 Transition order status to COMPLETED after fulfillment
- [ ] 6.4 Prevent status changes for already-completed orders
- [ ] 6.5 Implement getPoStatus() and setPoStatus() accessor methods

## 7. Line Item Shipment Tracking

- [ ] 7.1 Implement quantityShipped field on LineItem entity
- [ ] 7.2 Initialize quantityShipped to 0 on line item creation
- [ ] 7.3 Track partial shipments by updating quantityShipped
- [ ] 7.4 Implement logic to skip re-processing already-shipped items
- [ ] 7.5 Support multiple shipment updates for partial fulfillment

## 8. Inventory Management UI

- [ ] 8.1 Build DisplayInventoryBean to retrieve inventory items
- [ ] 8.2 Implement getInventory() to return InventoryLocal collection
- [ ] 8.3 Create displayinventory.jsp with inventory table display
- [ ] 8.4 Render item ID, existing quantity columns
- [ ] 8.5 Add text input fields for new quantities (name: qty_<itemId>)
- [ ] 8.6 Add checkboxes for item selection (name: item_<itemId>)
- [ ] 8.7 Wire form submission to RcvrRequestProcessor with action=updateinventory
- [ ] 8.8 Implement request.isUserInRole("administrator") authorization check

## 9. Supplier Home Page

- [ ] 9.1 Create index.jsp with supplier home page content
- [ ] 9.2 Display module description and features
- [ ] 9.3 Add form to display inventory (posts to RcvrRequestProcessor)
- [ ] 9.4 Add logout form (posts to RcvrRequestProcessor)
- [ ] 9.5 Implement role-based navigation

## 10. Integration & Exception Handling

- [ ] 10.1 Configure message selector for OPC queue messages
- [ ] 10.2 Implement retry logic for failed PO processing
- [ ] 10.3 Handle XMLDocumentException during parsing/generation
- [ ] 10.4 Handle ServiceLocator exceptions for EJB lookup
- [ ] 10.5 Implement proper error logging
- [ ] 10.6 Test message consumption and processing

