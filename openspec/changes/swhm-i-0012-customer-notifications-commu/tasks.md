# Notifications — Implementation Tasks

## 1. Notification Service

- [ ] 1.1 Implement OrderApprovalNotifier for approval/denial events
- [ ] 1.2 Implement OrderCompletionNotifier for fulfillment events
- [ ] 1.3 Retrieve customer email from account ContactInfo

## 2. Email Generation

- [ ] 2.1 Create email templates for each notification type
- [ ] 2.2 Implement email body generation with order details
- [ ] 2.3 Include customer name and order ID in message

## 3. Message Queue

- [ ] 3.1 Send notifications via AsyncSender EJB
- [ ] 3.2 Queue messages for async delivery
- [ ] 3.3 Handle delivery failures gracefully

## 4. Testing

- [ ] 4.1 Test order approval notification
- [ ] 4.2 Test order completion notification
- [ ] 4.3 Test missing email handling
