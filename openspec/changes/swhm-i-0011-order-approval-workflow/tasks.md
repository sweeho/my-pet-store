# Order Approval Workflow — Implementation Tasks

## 1. Auto-Approval Logic

- [x] 1.1 Implement canIApprove(PurchaseOrder po) method (SWHM-T-0204)
- [x] 1.2 Add locale comparison for US orders (threshold: $500 USD) (SWHM-T-0204)
- [x] 1.3 Add locale comparison for Japan orders (threshold: ¥50,000 JPY) (SWHM-T-0204)
- [x] 1.4 Return false for all other orders (requiring manual approval) (SWHM-T-0204)
- [x] 1.5 Integrate canIApprove() into PurchaseOrderMDB message processing (SWHM-T-0204)

## 2. Status Validation & Guard

- [x] 2.1 Implement status guard in OrderApprovalMDB.doWork() (SWHM-T-0205)
- [x] 2.2 Query ProcessManager for current order status (SWHM-T-0205)
- [x] 2.3 Skip processing if status is APPROVED, DENIED, or COMPLETED (SWHM-T-0205)
- [x] 2.4 Prevent duplicate processing of terminal-state orders (SWHM-T-0205)
- [x] 2.5 Log skipped orders for audit trail (SWHM-T-0205)

## 3. Order Approval & Denial Workflow

- [ ] 3.1 Implement approval workflow in OrderApprovalMDB (SWHM-T-0206)
- [ ] 3.2 Create OrderApproval transfer object (SWHM-T-0206)
- [ ] 3.3 Set status to APPROVED for approved orders (SWHM-T-0206)
- [ ] 3.4 Set status to DENIED for denied orders (SWHM-T-0206)
- [ ] 3.5 Implement status update via ProcessManager.updateStatus() (SWHM-T-0206)
- [ ] 3.6 Trigger doTransition() after approval/denial (SWHM-T-0206)

## 4. Supplier PO Generation

- [ ] 4.1 Implement getXmlPO(PurchaseOrder po, TPASupplierOrderXDE xde) (SWHM-T-0207)
- [ ] 4.2 Create TPASupplierOrderXDE document instance (SWHM-T-0207)
- [ ] 4.3 Set order metadata (poId, poDate) (SWHM-T-0207)
- [ ] 4.4 Extract and set shipping address details (SWHM-T-0207)
- [ ] 4.5 Iterate line items and add to XML (SWHM-T-0207)
- [ ] 4.6 Return serialized XML string (SWHM-T-0207)
- [ ] 4.7 Call getXmlPO() only for APPROVED orders (SWHM-T-0207)

## 5. Approval Screen UI (Rich Client)

- [ ] 5.1 Create OrdersApprovePanel component (SWHM-T-0208)
- [ ] 5.2 Implement createUI() method with panel layout (SWHM-T-0208)
- [ ] 5.3 Define combo box with status options (PENDING, APPROVED, DENIED) (SWHM-T-0208)
- [ ] 5.4 Create Orders table with columns (ID, User ID, Date, Amount, Status) (SWHM-T-0208)
- [ ] 5.5 Set Status column to editable via combo box cell editor (SWHM-T-0208)
- [ ] 5.6 Implement three buttons: Approve, Deny, Commit (SWHM-T-0208)
- [ ] 5.7 Wire button action listeners to update selected rows (SWHM-T-0208)
- [ ] 5.8 Implement status cell renderer with color coding (SWHM-T-0208)

## 6. Status Color Coding

- [ ] 6.1 Create statusRenderer with DefaultTableCellRenderer (SWHM-T-0209)
- [ ] 6.2 Add setValue() method for color logic (SWHM-T-0209)
- [ ] 6.3 Set green background for APPROVED status (SWHM-T-0209)
- [ ] 6.4 Set red background for DENIED status (SWHM-T-0209)
- [ ] 6.5 Set yellow background for PENDING status (SWHM-T-0209)
- [ ] 6.6 Apply renderer to Status column (SWHM-T-0209)

## 7. Admin Operations

- [ ] 7.1 Implement Approve button to set selected rows to APPROVED (SWHM-T-0210)
- [ ] 7.2 Implement Deny button to set selected rows to DENIED (SWHM-T-0210)
- [ ] 7.3 Implement Commit button to send changes to server (SWHM-T-0210)
- [ ] 7.4 Support bulk approval of multiple orders (SWHM-T-0210)
- [ ] 7.5 Support bulk denial of multiple orders (SWHM-T-0210)
- [ ] 7.6 Validate changes before sending to server (SWHM-T-0210)

## 8. Message Queue Integration

- [ ] 8.1 Configure OrderApprovalMDB as message-driven bean (SWHM-T-0211)
- [ ] 8.2 Declare Required transaction attribute (SWHM-T-0211)
- [ ] 8.3 Configure message selector for Approval queue (SWHM-T-0211)
- [ ] 8.4 Implement onMessage() entry point (SWHM-T-0211)
- [ ] 8.5 Parse approval decision messages (SWHM-T-0211)

## 9. Process Manager Integration

- [ ] 9.1 Implement getStatus(orderId) method (SWHM-T-0212)
- [ ] 9.2 Implement updateStatus(orderId, newStatus) method (SWHM-T-0212)
- [ ] 9.3 Ensure status queries are transactionally consistent (SWHM-T-0212)
- [ ] 9.4 Support status transitions: PENDING → APPROVED/DENIED (SWHM-T-0212)

## 10. Notifications & Transitions

- [ ] 10.1 Queue approval notification on order APPROVED (SWHM-T-0213)
- [ ] 10.2 Queue denial notification on order DENIED (SWHM-T-0213)
- [ ] 10.3 Trigger doTransition() after status change (SWHM-T-0213)
- [ ] 10.4 Send supplier PO to supplier queue on APPROVED (SWHM-T-0213)
- [ ] 10.5 Handle notification errors gracefully (SWHM-T-0213)
