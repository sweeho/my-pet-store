# Notifications — Design Document

## Architecture

Notifications are triggered by order status changes and sent asynchronously via JMS message queue to a mail server component.

## Notification Types

- Order confirmation (placed)
- Order approved/denied notification
- Order shipped/completed notification

## Email Content

Customer email retrieved from account ContactInfo.email. Message body contains order ID, customer name, and status details.

## Message Queue

AsyncSender EJB sends OrderApproval/OrderNotification messages to mail queue for asynchronous delivery.

## Error Handling

Message delivery failures log errors but don't block order processing.

## User Interface

No screen records were extracted for this capability; its user interface is unspecified.
