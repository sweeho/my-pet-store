# Admin Operations Capability — Proposal

## Summary

The Admin Operations capability provides a rich client interface for system administrators to manage orders, approve or deny pending orders, and generate business intelligence reports on sales revenue and order volumes. This capability is built on Java Web Start deployment and XML-based RPC communication.

## Scope

This specification defines:
- **JNLP deployment** — Dynamic Java Network Launch Protocol generation for rich client Java Web Start
- **Order management** — View orders filtered by status (PENDING, APPROVED, DENIED, COMPLETED)
- **Order approval workflow** — Approve or deny pending orders in batch
- **Report generation** — Revenue and order quantity reports by date range and category
- **Session management** — HTTP session validation and timeout enforcement
- **Asynchronous notifications** — Queue-based notification of order approvals/denials

## Key Workflows

| Workflow | Trigger | Output |
|----------|---------|--------|
| View Orders | Admin requests order list by status | XML response with order IDs, users, dates, amounts, status |
| Approve/Deny Orders | Admin selects orders and updates status | Batch update sent asynchronously to message queue |
| Generate Revenue Report | Admin specifies date range and category | Aggregated sales amounts by category with total |
| Generate Order Report | Admin specifies date range and category | Aggregated order quantities by category with total |

## Rich Client Architecture

The admin interface uses a two-tier architecture:
1. **Thin Web Server** — Servlet front-end serving JNLP and XML request handler
2. **Rich Desktop Client** — Java Swing application launched via Web Start

Communication is via HTTP POST with XML payloads. Session ID is embedded in the connection string to maintain authentication across the client/server boundary.

## Key Integration Points

- **Order Management System** — Retrieves order details and status from OPC Admin Facade
- **Workflow Engine** — Uses ProcessManager EJB to query and update order status
- **Async Messaging** — Sends order approvals/denials via JMS AsyncSender for notification
- **Business Intelligence** — Aggregates sales and order data from the order database

## Risk & Constraints

- **Session Management**: 54-minute timeout applies to rich client sessions; inactivity may disconnect clients
- **Date Format**: Report dates must be in mm/dd/yyyy format; misformat may cause parsing errors
- **Batch Operations**: Order status updates are sent asynchronously; UI updates don't guarantee server completion
- **Authorization**: Only users in "administrator" role can access admin operations; form-based authentication required

## Security Boundaries

- **Authentication**: Form-based login enforced at servlet container level
- **Authorization**: Role-based access control via security-constraint in web.xml (administrator role required)
- **Session Validation**: HTTP session checked on every rich client request; expired sessions return error
- **No Transport Security**: Transport guarantee is "NONE"; HTTP not HTTPS (security risk in production)

## Dependencies

- **Upstream**: Account Management (customer/order identification), Order Approval (order status workflow)
- **Downstream**: Notifications (order approval/denial messages), Order Fulfillment (supplier PO generation)
