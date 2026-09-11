# Order Fulfillment & Shipment Management Capability — Proposal

## Summary

Fulfillment management enables the supplier system to receive purchase orders, verify inventory availability, process fulfillment, track shipments, and generate invoices. The system manages line item quantities, tracks ordered versus shipped amounts, and detects order completion when all items are fulfilled.

## Scope

- Purchase order reception via JMS message queue
- Line item inventory availability verification
- Inventory quantity tracking and reduction
- Shipment quantity tracking per line item
- Invoice generation for fulfilled items
- Order status tracking (PENDING → COMPLETED)
- Inventory management UI with update forms
- Supplier home page with navigation

## Key Features

- Receive purchase orders asynchronously via message queue from Order Processing Center
- Check inventory availability for each line item before fulfillment
- Deduct ordered quantities from inventory upon successful fulfillment
- Track line item quantities (ordered vs. shipped)
- Skip already-shipped line items during re-processing
- Mark orders COMPLETED when all items are fulfilled
- Generate XML invoices with fulfilled item details
- Display inventory update screen showing items, quantities, and checkboxes
- Support batch inventory quantity updates
- Track partial and complete shipments

## Risk

- Inventory quantity reductions occur without persistence check — race conditions possible
- PO processing is asynchronous with no explicit retry mechanism if partial fulfillment occurs
- Invoice generation occurs only when items are available — no invoice for partial shipments visible in the system
- Line item state transitions depend on implicit business logic in OrderFulfillmentFacadeEJB

