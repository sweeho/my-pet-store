# Order Approval Workflow — Design Document

## Approval Decision Logic

**Auto-Approval Thresholds** (canIApprove method)
- US locale orders: total price < $500 USD → AUTO APPROVED
- Japan locale orders: total price < ¥50,000 JPY → AUTO APPROVED
- All other orders: remain PENDING (require manual approval)

**Manual Approval Workflow**
- PurchaseOrderMDB receives order via message queue
- Checks canIApprove() to determine auto-approval
- If approved: creates OrderApproval and triggers doTransition
- If denied: order status set to DENIED
- If pending: order waits for manual approval via OrderApprovalMDB

## Order Status Validation

**Status Guard (OrderApprovalMDB.doWork)**
- Only PENDING orders are eligible for approval/denial
- If order status is already APPROVED, DENIED, or COMPLETED: skip processing
- Prevents duplicate processing and race conditions
- Guard is enforced via: `if(!curStatus.equals(OrderStatusNames.PENDING)) continue;`

## Order Approval States

- PENDING: Order awaiting approval/denial
- APPROVED: Order approved and supplier PO generated
- DENIED: Order rejected and not fulfilled
- COMPLETED: Order fully shipped

## Admin Approval Screen Implementation

**OrdersApprovePanel** (Rich Client Component)
- Displays table of pending orders from server
- Columns: Order ID, User ID, Order Date, Order Amount, Status
- Status column is editable via dropdown selector (PENDING, APPROVED, DENIED)
- Three buttons: Approve (set selected to APPROVED), Deny (set selected to DENIED), Commit
- Color-coded status cells:
  - Green: APPROVED
  - Red: DENIED
  - Yellow: PENDING

**OrdersApprovePanel Technical Details**
- Lines 79-89: Panel setup with createUI()
- Lines 82-84: Combo box definition with three status options
- Lines 149-151: Status column cell editor configured
- Lines 92-138: Button definitions and action listeners
- Lines 154-171: Status renderer with color logic

## Supplier PO Generation on Approval

**getXmlPO() Method**
- Called only for APPROVED orders
- Creates TPASupplierOrderXDE XML document
- Includes order metadata: poId, poDate
- Sets shipping address: givenName, familyName, street, city, state, country, zipCode, email, telephone
- Iterates line items and adds: categoryId, productId, itemId, lineNumber, quantity, unitPrice
- Returns serialized XML string

**Approval Transition**
- OrderApprovalMDB.doWork() calls getXmlPO() for each approved order
- XML added to supplierPoList
- doTransition() sends via OrderApprovalTD to supplier queue (Supplier Approval)

## Denial Workflow

- Denied orders set status to DENIED via processManager
- Denial notifications queued for customer
- Order is terminal in DENIED state (no further processing)

## Integration Points

**Message-Driven Beans**
- PurchaseOrderMDB: receives orders, checks auto-approval
- OrderApprovalMDB: receives approval decisions, validates status, generates supplier PO
- Declarative transaction management with Required attribute

**Process Manager**
- getStatus(orderId): retrieves current order status
- updateStatus(orderId, newStatus): transitions status

**Notification System**
- OPC-APPROVAL-NOTIFICATION: sent on approval
- OPC-COMPLETION-NOTIFICATION: sent on denial (or completion)

## Data Model

**Purchase Order Entity**
- poId: Order ID (PK)
- totalPrice: Order amount
- locale: Customer locale (US, Japan, etc.)
- status: Current status (PENDING, APPROVED, DENIED, COMPLETED)
- poDate: Order date
- lineItems: Collection of line items

**Order Approval Transfer Object**
- OrderId, OrderStatus, approval decision
- Transferred via XML message queue

