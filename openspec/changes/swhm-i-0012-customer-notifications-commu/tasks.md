# Notifications — Implementation Tasks

## 1. Notification Service

- [ ] 1.1 Implement OrderApprovalNotifier for approval/denial events (SWHM-T-0224)
- [ ] 1.2 Implement OrderCompletionNotifier for fulfillment events (SWHM-T-0224)
- [ ] 1.3 Retrieve customer email from account ContactInfo (SWHM-T-0224)

## 2. Email Generation

- [ ] 2.1 Create email templates for each notification type (SWHM-T-0225)
- [ ] 2.2 Implement email body generation with order details (SWHM-T-0225)
- [ ] 2.3 Include customer name and order ID in message (SWHM-T-0225)

## 3. Message Queue

- [ ] 3.1 Send notifications via AsyncSender EJB (SWHM-T-0226)
- [ ] 3.2 Queue messages for async delivery (SWHM-T-0226)
- [ ] 3.3 Handle delivery failures gracefully (SWHM-T-0226)

## 4. Testing

- [ ] 4.1 Test order approval notification (SWHM-T-0227)
- [ ] 4.2 Test order completion notification (SWHM-T-0227)
- [ ] 4.3 Test missing email handling (SWHM-T-0227)
