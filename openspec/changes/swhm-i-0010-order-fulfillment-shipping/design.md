# Order Fulfillment & Shipment Management — Design Document

## Order Processing Flow

The supplier receives purchase orders through an asynchronous message-driven architecture:

1. **PO Reception** — SupplierOrderMDB listens to OPC queue (javax.jms.Queue)
2. **Message Processing** — onMessage() extracts purchase order XML
3. **Inventory Verification** — OrderFulfillmentFacadeEJB checks each line item
4. **Fulfillment** — Items are marked shipped; inventory is reduced
5. **Invoice Generation** — XML invoice created for fulfilled items
6. **Order Completion** — Order status transitions to COMPLETED when all items fulfilled

## Data Model

**Purchase Order (PO)**
- poId: Primary key
- userId: Customer reference
- poDate: Order date
- poStatus: PENDING or COMPLETED
- lineItems: Collection of LineItemLocal

**Line Item**
- itemId: Primary key (foreign key to Item)
- quantity: Ordered quantity
- quantityShipped: Shipped quantity
- categoryId, productId: Item hierarchy
- lineNumber: Sequential number
- unitPrice: Price per unit

**Inventory**
- itemId: Primary key (foreign key to Item)
- quantity: Available quantity
- reduceQuantity(int q): Decrements quantity atomically

## Fulfillment Processing

**OrderFulfillmentFacadeEJB.processPO(SupplierOrder po)**
- Invokes processAnOrder(po) for inventory verification
- Returns invoice XML if items fulfilled, null otherwise

**OrderFulfillmentFacadeEJB.processAnOrder(SupplierOrderLocal po)**
1. Iterate through po.getLineItems()
2. Skip line items where quantityShipped == quantity (already fulfilled)
3. For remaining items:
   - Call checkInventory(LineItemLocal item)
   - If available: call li.setQuantityShipped(li.getQuantity())
   - Track fulfilled items in HashMap
4. If all items available: set po.setPoStatus(COMPLETED)
5. If any items fulfilled: call createInvoice(po, fulfilledItems)
6. Return invoice XML or null

**checkInventory(LineItemLocal item)**
- Query InventoryLocal by item.getItemId()
- Compare inv.getQuantity() >= item.getQuantity()
- If available: call inv.reduceQuantity(item.getQuantity())
- Return success/failure boolean

**InventoryEJB.reduceQuantity(int quantity)**
- Retrieve current quantity: int q = this.getQuantity()
- Set new quantity: setQuantity(q - quantity)
- Transactionally managed with Required transaction attribute
- Container-managed persistence

## Invoice Generation

**createInvoice(SupplierOrderLocal po, HashMap fulfilledItems)**
- Create TPAInvoiceXDE document
- Set order metadata: poId, userId, poDate, shippingDate (current date)
- Iterate fulfilled line items
- For each item, add to invoice: categoryId, productId, itemId, lineNumber, quantity, unitPrice
- Return invoiceXDE.getDocumentAsString()

## Message Processing

**SupplierOrderMDB**
- Message-Driven Bean listening to OPC queue
- onMessage(Message msg) entry point
- Extracts TextMessage content (serialized PO XML)
- Delegates to OrderFulfillmentFacadeEJB via processPO()
- Returns XML invoice for subsequent processing

## Inventory Update Screen Implementation

The displayinventory.jsp renders the inventory update UI with the following JSP structure:
- DisplayInventoryBean retrieves current inventory via getInventory()
- Authorization check: request.isUserInRole("administrator")
- HTML table with dynamic item iteration
- Form posts to RcvrRequestProcessor with action="updateinventory"
- Form field naming: qty_<itemId> for new quantity, item_<itemId> for checkbox

## Supplier Home Page Implementation

The index.jsp provides navigation with:
- Display Inventory form posting to RcvrRequestProcessor
- Logout form posting to RcvrRequestProcessor
- User role-based access control via request.isUserInRole()

## Transaction Management

- ProcessAnOrder: Container-managed transaction with Required attribute
- Inventory reductions: Required transaction attribute ensures atomicity
- Message receipt: Automatic acknowledgment after successful processing

## Exception Handling

- XMLDocumentException: Raised during PO parsing or invoice creation
- ServiceLocator exceptions: Caught and wrapped in domain-specific exceptions
- RemoteException: Caught for EJB invocation failures

