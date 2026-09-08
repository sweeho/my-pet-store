# Fulfillment Management — Implementation Tasks

## 1. Data Model

- [ ] 1.1 Define PurchaseOrder entity with orderID, customer, contact, address, status, lineItems
- [ ] 1.2 Define LineItem entity with quantity and quantityShipped tracking
- [ ] 1.3 Define SupplierOrder entity with shipping address and line items
- [ ] 1.4 Define order status enum: PENDING, APPROVED, DENIED, SHIPPED_PART, COMPLETED

## 2. Supplier PO Generation

- [ ] 2.1 Implement PO generation from approved orders
- [ ] 2.2 Extract customer contact and shipping address
- [ ] 2.3 Serialize order data to SupplierOrder XML format
- [ ] 2.4 Send to supplier queue for fulfillment

## 3. Invoice Processing

- [ ] 3.1 Implement invoice message handler
- [ ] 3.2 Parse invoice with orderID and line item shipments
- [ ] 3.3 Look up purchase order and line items
- [ ] 3.4 Update quantityShipped for each line item
- [ ] 3.5 Detect order completion (all items fully shipped)

## 4. Order Completion Detection

- [ ] 4.1 Implement completion check: quantity == quantityShipped for ALL line items
- [ ] 4.2 Update order status to COMPLETED when all items shipped
- [ ] 4.3 Update order status to SHIPPED_PART for partial shipments

## 5. Testing

- [ ] 5.1 Test PO generation from approved order
- [ ] 5.2 Test invoice processing with single shipment
- [ ] 5.3 Test partial shipment tracking
- [ ] 5.4 Test multi-invoice fulfillment (accumulation)
- [ ] 5.5 Test order completion detection
- [ ] 5.6 Test concurrent invoice processing
