# Notifications Capability — Proposal

## Summary

Notifications delivers email communications to customers regarding order status, approvals, denials, and completions.

## Scope

- Email notification generation for order events
- Async message queue delivery
- Customer email address from account contact info
- Notification content for order status changes

## Key Events

- Order placed
- Order approved/denied
- Order completed/shipped

## Risk

- Missing customer email prevents notifications
- Email delivery failures are not retried
