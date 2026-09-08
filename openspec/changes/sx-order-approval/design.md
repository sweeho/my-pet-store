# Order Approval — Design Document

## Approval Logic

Orders are evaluated at intake. Small orders (USD <$500, JPY <¥50,000) are auto-approved. Larger orders are marked PENDING and require administrator review.

## Business Rules

- Auto-approve threshold: USD 500, JPY 50,000 (locale-specific)
- Administrator approval required for threshold-exceeding orders
- Approved orders trigger supplier PO generation
- Denied orders are rejected from fulfillment

## User Interface

No screen records were extracted for this capability; its user interface is unspecified.
