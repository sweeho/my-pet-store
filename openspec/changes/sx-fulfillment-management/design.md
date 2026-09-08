# Fulfillment Management — Design Document

## Data Model

### PurchaseOrder Entity
- orderID (primary key)
- customerID 
- contact information
- shipping address
- lineItems (relationship)
- status (PENDING → APPROVED → SHIPPED_PART → COMPLETED or DENIED)

### LineItem Entity  
- lineNumber
- productID
- quantity (ordered)
- quantityShipped (tracked via invoices)
- unitPrice

### SupplierOrder
- orderID reference
- shipping address
- line items with order quantities

### Invoice
- orderID reference
- lineItemIds array
- quantities shipped per line item

## Processing Logic

**Invoice Processing:**
1. Receive invoice with line item IDs and shipped quantities
2. Look up purchase order by orderID
3. For each line item in invoice, accumulate quantityShipped
4. Determine order completion: ALL line items have quantity == quantityShipped
5. Update order status to COMPLETED or SHIPPED_PART
6. Send notification of status change

**Order Completion Detection:**
- Order is COMPLETED only if every line item has been fully shipped
- Partial shipments result in SHIPPED_PART status
- Multiple invoices can contribute to fulfillment (partial shipments)

## Transaction Management

All order/invoice operations are container-managed with Required attribute for consistency.

## Message-Driven Processing

Supplier PO and invoice processing use JMS:
- Approved orders trigger PO generation → send to supplier queue
- Supplier invoices received from supplier queue → process asynchronously

## User Interface

No screen records were extracted for this capability; its user interface is unspecified.
