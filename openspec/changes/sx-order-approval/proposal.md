# Order Approval Workflow Capability — Proposal

## Summary

Order approval provides a workflow to review, approve, and deny purchase orders. The system supports automatic approval for orders below locale-specific thresholds and manual approval through an administrative interface. Approved orders trigger supplier purchase order generation, while denied orders are rejected.

## Scope

- Automatic order approval based on locale and order amount
- Manual order approval workflow for orders exceeding auto-approval thresholds
- Order denial workflow
- Status validation to prevent duplicate processing
- Administrative approval interface with editable status and bulk actions
- Supplier PO generation on approval
- Approval and denial notifications
- Order status transitions (PENDING → APPROVED/DENIED)

## Key Features

- Auto-approve US orders under $500 USD
- Auto-approve Japan orders under ¥50,000 JPY
- All other orders remain PENDING for manual review
- Only PENDING orders eligible for approval/denial
- Admin UI with Orders Approval screen showing pending orders
- Editable status dropdown (PENDING, APPROVED, DENIED)
- Three admin buttons: Approve, Deny, Commit
- Color-coded status cells (green=APPROVED, red=DENIED, yellow=PENDING)
- Bulk approval/denial of multiple orders
- Supplier PO generation with order details and shipping address
- Notifications sent for approved and denied orders
- Terminal status states prevent re-processing

## Risk

- Auto-approval thresholds are hardcoded without configuration
- Locale comparison uses object equality (Locale.US) which may vary
- Manual approval screen is rich client only (not web-based)
- No audit trail of who approved/denied orders
- Race condition possible if same order approved multiple times

