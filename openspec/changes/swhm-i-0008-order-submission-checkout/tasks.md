# Order Placement — Implementation Tasks

## 1. Order Information Form

- [ ] 1.1 Create OrderForm with billing and shipping information fields
- [ ] 1.2 Implement form with suffix _a for billing, _b for shipping
- [ ] 1.3 Add given_name, family_name fields with maxlength="30"
- [ ] 1.4 Add address fields (street1, street2) with maxlength="70"
- [ ] 1.5 Add city, postal_code fields with maxlength constraints
- [ ] 1.6 Add state/province dropdown (CA, NY, TX)
- [ ] 1.7 Add country dropdown (USA, Canada, Japan, China)
- [ ] 1.8 Add telephone field with maxlength="20"
- [ ] 1.9 Add email field with maxlength="50" and email validation
- [ ] 1.10 Bind form to enter_order_information.jsp JSP template

## 2. Form Routing & Validation

- [ ] 2.1 Create OrderAction to handle form submission (POST to order.do)
- [ ] 2.2 Implement form validation in OrderForm.validate()
- [ ] 2.3 Validate required fields (all address and contact fields)
- [ ] 2.4 Validate email format
- [ ] 2.5 Validate state/country selections against allowed values
- [ ] 2.6 Return validation errors to form if validation fails
- [ ] 2.7 Configure struts-config.xml mappings for order.do route
- [ ] 2.8 Define forwards: success → order processing, failure → re-render form

## 3. Order ID Generation

- [ ] 3.1 Implement UniqueIdGenerator EJB
- [ ] 3.2 Initialize sequence with seed value: 1001
- [ ] 3.3 Implement getUniqueId() to return next sequential ID
- [ ] 3.4 Ensure thread-safe ID generation
- [ ] 3.5 Store generated ID in persistent storage

## 4. Order Creation

- [ ] 4.1 Implement Order entity with poId, poDate, customerId, contactInfo
- [ ] 4.2 Create Order with current date (poDate)
- [ ] 4.3 Set Order with unique ID from UniqueIdGenerator (seed: 1001)
- [ ] 4.4 Store billing address (address_a) as OrderAddress
- [ ] 4.5 Store shipping address (address_b) as OrderAddress
- [ ] 4.6 Link Order to authenticated customer
- [ ] 4.7 Initialize order status to PENDING

## 5. Line Item Creation

- [ ] 5.1 Iterate through cart.items
- [ ] 5.2 For each CartItem, create LineItem entity
- [ ] 5.3 Set LineItem.itemId, quantity, unitPrice from CartItem
- [ ] 5.4 Set LineItem.quantityShipped to 0 initially
- [ ] 5.5 Extract categoryId, productId from item metadata
- [ ] 5.6 Set LineItem.lineNumber sequentially (1, 2, 3...)
- [ ] 5.7 Associate all LineItems with Order
- [ ] 5.8 Calculate Order.totalPrice as sum of (quantity × unitPrice)

## 6. Cart Clearing

- [ ] 6.1 After successful LineItem creation, retrieve customer's shopping cart
- [ ] 6.2 Clear cart.items collection
- [ ] 6.3 Set cart.count = 0
- [ ] 6.4 Update cart in session

## 7. Order Confirmation Display

- [ ] 7.1 Create OrderResponse transfer object with orderId, email
- [ ] 7.2 Create order_completed.jsp confirmation page
- [ ] 7.3 Display order ID: <c:out value="${orderresponse.orderId}"/>
- [ ] 7.4 Display customer email: <c:out value="${orderresponse.email}"/>
- [ ] 7.5 Show message "You should receive a confirmation e-mail soon at [email]"
- [ ] 7.6 Provide link to continue shopping or view order status

## 8. Confirmation Notification

- [ ] 8.1 Implement async notification via AsyncSender
- [ ] 8.2 Create confirmation email with order ID and details
- [ ] 8.3 Send email to customer emailaddress from Order
- [ ] 8.4 Handle AsyncSender.sendAMessage() call after order creation
- [ ] 8.5 Catch ServiceLocatorException and XMLDocumentException
- [ ] 8.6 Log errors appropriately

## 9. Error Handling

- [ ] 9.1 Implement ShoppingCartEmptyOrderException
- [ ] 9.2 Check cart.count > 0 before order processing
- [ ] 9.3 Throw ShoppingCartEmptyOrderException if cart is empty
- [ ] 9.4 Catch exception and redirect to cart page with error message
- [ ] 9.5 Display error: "Your shopping cart is empty. Please add items before ordering."

## 10. Integration Testing

- [ ] 10.1 Test order creation with valid billing/shipping info
- [ ] 10.2 Test form validation rejects missing required fields
- [ ] 10.3 Test state/country dropdowns enforce constraints
- [ ] 10.4 Test line items created correctly from cart
- [ ] 10.5 Test cart cleared after successful order
- [ ] 10.6 Test unique order IDs generated sequentially
- [ ] 10.7 Test confirmation email sent asynchronously
- [ ] 10.8 Test empty cart triggers ShoppingCartEmptyOrderException

