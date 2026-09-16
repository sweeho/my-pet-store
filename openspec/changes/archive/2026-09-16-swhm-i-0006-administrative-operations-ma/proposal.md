# Administrative Operations Capability — Proposal

## Summary

Administrative operations provide tools for administrators to manage orders, update order status, and generate sales and inventory reports. Administrators access a protected rich client interface via Java Web Start to perform operational tasks.

## Scope

- Administrator authentication via form-based login with session management
- Protected admin interface with role-based access control
- Rich client deployment via Java Web Start
- Order retrieval and display by status (pending, approved, completed, denied)
- Order status updates with asynchronous batch processing
- Revenue and order count reporting by category with date range filtering
- Admin home page with launch and logout options

## Key Features

- Secure administrator login with session timeout (54 minutes)
- Admin home page providing options to launch rich client or logout
- Orders View showing all approved, completed, and denied orders
- Order data retrieval including Order ID, User ID, Order Date, Order Amount, Order Status
- Order status updates supporting multiple orders in single operation
- Revenue reports by category with date filtering
- Order count reports by category with date filtering
- Rich client application deployment via Java Web Start with session ID propagation
- Login form with pre-populated default credentials for development/testing

## Risk

- Hardcoded default credentials (jps_admin/admin) in login form may be development-only
- Session ID included in JNLP file for rich client authentication — unclear if additional credential exchange occurs
- Request type validation missing — unknown types return error without listing valid types
- Date parsing in MM/dd/yyyy format uses deprecated Date constructor without timezone handling
