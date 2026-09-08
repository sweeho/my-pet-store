# Order Approval Workflow — Implementation Tasks

## 1. Auto-Approval Logic

- [ ] 1.1 Implement canIApprove(PurchaseOrder po) method
- [ ] 1.2 Add locale comparison for US orders (threshold: $500 USD)
- [ ] 1.3 Add locale comparison for Japan orders (threshold: ¥50,000 JPY)
- [ ] 1.4 Return false for all other orders (requiring manual approval)
- [ ] 1.5 Integrate canIApprove() into PurchaseOrderMDB message processing

## 2. Status Validation & Guard

- [ ] 2.1 Implement status guard in OrderApprovalMDB.doWork()
- [ ] 2.2 Query ProcessManager for current order status
- [ ] 2.3 Skip processing if status is APPROVED, DENIED, or COMPLETED
- [ ] 2.4 Prevent duplicate processing of terminal-state orders
- [ ] 2.5 Log skipped orders for audit trail

## 3. Order Approval & Denial Workflow

- [ ] 3.1 Implement approval workflow in OrderApprovalMDB
- [ ] 3.2 Create OrderApproval transfer object
- [ ] 3.3 Set status to APPROVED for approved orders
- [ ] 3.4 Set status to DENIED for denied orders
- [ ] 3.5 Implement status update via ProcessManager.updateStatus()
- [ ] 3.6 Trigger doTransition() after approval/denial

## 4. Supplier PO Generation

- [ ] 4.1 Implement getXmlPO(PurchaseOrder po, TPASupplierOrderXDE xde)
- [ ] 4.2 Create TPASupplierOrderXDE document instance
- [ ] 4.3 Set order metadata (poId, poDate)
- [ ] 4.4 Extract and set shipping address details
- [ ] 4.5 Iterate line items and add to XML
- [ ] 4.6 Return serialized XML string
- [ ] 4.7 Call getXmlPO() only for APPROVED orders

## 5. Approval Screen UI (Rich Client)

- [ ] 5.1 Create OrdersApprovePanel component
- [ ] 5.2 Implement createUI() method with panel layout
- [ ] 5.3 Define combo box with status options (PENDING, APPROVED, DENIED)
- [ ] 5.4 Create Orders table with columns (ID, User ID, Date, Amount, Status)
- [ ] 5.5 Set Status column to editable via combo box cell editor
- [ ] 5.6 Implement three buttons: Approve, Deny, Commit
- [ ] 5.7 Wire button action listeners to update selected rows
- [ ] 5.8 Implement status cell renderer with color coding

## 6. Status Color Coding

- [ ] 6.1 Create statusRenderer with DefaultTableCellRenderer
- [ ] 6.2 Add setValue() method for color logic
- [ ] 6.3 Set green background for APPROVED status
- [ ] 6.4 Set red background for DENIED status
- [ ] 6.5 Set yellow background for PENDING status
- [ ] 6.6 Apply renderer to Status column

## 7. Admin Operations

- [ ] 7.1 Implement Approve button to set selected rows to APPROVED
- [ ] 7.2 Implement Deny button to set selected rows to DENIED
- [ ] 7.3 Implement Commit button to send changes to server
- [ ] 7.4 Support bulk approval of multiple orders
- [ ] 7.5 Support bulk denial of multiple orders
- [ ] 7.6 Validate changes before sending to server

## 8. Message Queue Integration

- [ ] 8.1 Configure OrderApprovalMDB as message-driven bean
- [ ] 8.2 Declare Required transaction attribute
- [ ] 8.3 Configure message selector for Approval queue
- [ ] 8.4 Implement onMessage() entry point
- [ ] 8.5 Parse approval decision messages

## 9. Process Manager Integration

- [ ] 9.1 Implement getStatus(orderId) method
- [ ] 9.2 Implement updateStatus(orderId, newStatus) method
- [ ] 9.3 Ensure status queries are transactionally consistent
- [ ] 9.4 Support status transitions: PENDING → APPROVED/DENIED

## 10. Notifications & Transitions

- [ ] 10.1 Queue approval notification on order APPROVED
- [ ] 10.2 Queue denial notification on order DENIED
- [ ] 10.3 Trigger doTransition() after status change
- [ ] 10.4 Send supplier PO to supplier queue on APPROVED
- [ ] 10.5 Handle notification errors gracefully

