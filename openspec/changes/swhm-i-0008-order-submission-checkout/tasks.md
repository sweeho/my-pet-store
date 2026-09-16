# Order Placement — Implementation Tasks

## 1. Order Information Form

- [x] 1.1 Create OrderForm with billing and shipping information fields (SWHM-T-0153)
- [x] 1.2 Implement form with suffix \_a for billing, \_b for shipping (SWHM-T-0153)
- [x] 1.3 Add given_name, family_name fields with maxlength="30" (SWHM-T-0153)
- [x] 1.4 Add address fields (street1, street2) with maxlength="70" (SWHM-T-0153)
- [x] 1.5 Add city, postal_code fields with maxlength constraints (SWHM-T-0153)
- [x] 1.6 Add state/province dropdown (CA, NY, TX) (SWHM-T-0153)
- [x] 1.7 Add country dropdown (USA, Canada, Japan, China) (SWHM-T-0153)
- [x] 1.8 Add telephone field with maxlength="20" (SWHM-T-0153)
- [x] 1.9 Add email field with maxlength="50" and email validation (SWHM-T-0153)
- [x] 1.10 Bind form to enter_order_information.jsp JSP template (SWHM-T-0153)

## 2. Form Routing & Validation

- [x] 2.1 Create OrderAction to handle form submission (POST to order.do) (SWHM-T-0154)
- [x] 2.2 Implement form validation in OrderForm.validate() (SWHM-T-0154)
- [x] 2.3 Validate required fields (all address and contact fields) (SWHM-T-0154)
- [x] 2.4 Validate email format (SWHM-T-0154)
- [x] 2.5 Validate state/country selections against allowed values (SWHM-T-0154)
- [x] 2.6 Return validation errors to form if validation fails (SWHM-T-0154)
- [x] 2.7 Configure struts-config.xml mappings for order.do route (SWHM-T-0154)
- [x] 2.8 Define forwards: success → order processing, failure → re-render form (SWHM-T-0154)

## 3. Order ID Generation

- [x] 3.1 Implement UniqueIdGenerator EJB (SWHM-T-0155)
- [x] 3.2 Initialize sequence with seed value: 1001 (SWHM-T-0155)
- [x] 3.3 Implement getUniqueId() to return next sequential ID (SWHM-T-0155)
- [x] 3.4 Ensure thread-safe ID generation (SWHM-T-0155)
- [x] 3.5 Store generated ID in persistent storage (SWHM-T-0155)

## 4. Order Creation

- [ ] 4.1 Implement Order entity with poId, poDate, customerId, contactInfo (SWHM-T-0156)
- [ ] 4.2 Create Order with current date (poDate) (SWHM-T-0156)
- [ ] 4.3 Set Order with unique ID from UniqueIdGenerator (seed: 1001) (SWHM-T-0156)
- [ ] 4.4 Store billing address (address_a) as OrderAddress (SWHM-T-0156)
- [ ] 4.5 Store shipping address (address_b) as OrderAddress (SWHM-T-0156)
- [ ] 4.6 Link Order to authenticated customer (SWHM-T-0156)
- [ ] 4.7 Initialize order status to PENDING (SWHM-T-0156)

## 5. Line Item Creation

- [ ] 5.1 Iterate through cart.items (SWHM-T-0157)
- [ ] 5.2 For each CartItem, create LineItem entity (SWHM-T-0157)
- [ ] 5.3 Set LineItem.itemId, quantity, unitPrice from CartItem (SWHM-T-0157)
- [ ] 5.4 Set LineItem.quantityShipped to 0 initially (SWHM-T-0157)
- [ ] 5.5 Extract categoryId, productId from item metadata (SWHM-T-0157)
- [ ] 5.6 Set LineItem.lineNumber sequentially (1, 2, 3...) (SWHM-T-0157)
- [ ] 5.7 Associate all LineItems with Order (SWHM-T-0157)
- [ ] 5.8 Calculate Order.totalPrice as sum of (quantity × unitPrice) (SWHM-T-0157)

## 6. Cart Clearing

- [ ] 6.1 After successful LineItem creation, retrieve customer's shopping cart (SWHM-T-0158)
- [ ] 6.2 Clear cart.items collection (SWHM-T-0158)
- [ ] 6.3 Set cart.count = 0 (SWHM-T-0158)
- [ ] 6.4 Update cart in session (SWHM-T-0158)

## 7. Order Confirmation Display

- [ ] 7.1 Create OrderResponse transfer object with orderId, email (SWHM-T-0159)
- [ ] 7.2 Create order_completed.jsp confirmation page (SWHM-T-0159)
- [ ] 7.3 Display order ID: <c:out value="${orderresponse.orderId}"/> (SWHM-T-0159)
- [ ] 7.4 Display customer email: <c:out value="${orderresponse.email}"/> (SWHM-T-0159)
- [ ] 7.5 Show message "You should receive a confirmation e-mail soon at [email]" (SWHM-T-0159)
- [ ] 7.6 Provide link to continue shopping or view order status (SWHM-T-0159)

## 8. Confirmation Notification

- [ ] 8.1 Implement async notification via AsyncSender (SWHM-T-0160)
- [ ] 8.2 Create confirmation email with order ID and details (SWHM-T-0160)
- [ ] 8.3 Send email to customer emailaddress from Order (SWHM-T-0160)
- [ ] 8.4 Handle AsyncSender.sendAMessage() call after order creation (SWHM-T-0160)
- [ ] 8.5 Catch ServiceLocatorException and XMLDocumentException (SWHM-T-0160)
- [ ] 8.6 Log errors appropriately (SWHM-T-0160)

## 9. Error Handling

- [ ] 9.1 Implement ShoppingCartEmptyOrderException (SWHM-T-0161)
- [ ] 9.2 Check cart.count > 0 before order processing (SWHM-T-0161)
- [ ] 9.3 Throw ShoppingCartEmptyOrderException if cart is empty (SWHM-T-0161)
- [ ] 9.4 Catch exception and redirect to cart page with error message (SWHM-T-0161)
- [ ] 9.5 Display error: "Your shopping cart is empty. Please add items before ordering." (SWHM-T-0161)

## 10. Integration Testing

- [ ] 10.1 Test order creation with valid billing/shipping info (SWHM-T-0162)
- [ ] 10.2 Test form validation rejects missing required fields (SWHM-T-0162)
- [ ] 10.3 Test state/country dropdowns enforce constraints (SWHM-T-0162)
- [ ] 10.4 Test line items created correctly from cart (SWHM-T-0162)
- [ ] 10.5 Test cart cleared after successful order (SWHM-T-0162)
- [ ] 10.6 Test unique order IDs generated sequentially (SWHM-T-0162)
- [ ] 10.7 Test confirmation email sent asynchronously (SWHM-T-0162)
- [ ] 10.8 Test empty cart triggers ShoppingCartEmptyOrderException (SWHM-T-0162)
