# Fulfillment Management Capability — Proposal

## Summary

Fulfillment Management handles supplier order creation, shipment tracking, and invoice processing to complete customer orders. It bridges order approval and supplier fulfillment.

## Scope

- Purchase orders with line items and shipping information
- Supplier PO generation from approved orders
- Invoice reception and shipment tracking
- Order completion detection when fully shipped
- Line item quantity tracking (ordered vs shipped)

## Key Entities

- **PurchaseOrder**: Root order entity with orderID, customer contact/address, line items, status
- **LineItem**: Ordered product quantity with tracking of shipped quantity
- **SupplierOrder**: Supplier PO containing shipping address and line items
- **Invoice**: Shipment notification with line item quantities shipped

## Workflow

1. Approved order → Generate supplier PO
2. Send supplier PO to supplier queue
3. Receive invoice with shipment quantities
4. Track quantityShipped per line item
5. Mark order COMPLETED when all items fully shipped

## Risk

- **Data Risk**: Partial shipments must be tracked accurately
- **Operational**: Order completion detection must be reliable
- **Financial**: Quantity mismatches could affect billing
