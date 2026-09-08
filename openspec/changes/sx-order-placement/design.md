# Order Placement — Design Document

## Order Placement Workflow

**Order Creation Flow**
1. Customer views shopping cart
2. Customer clicks "Proceed to Checkout" or similar action
3. System displays order information form (enter_order_information.jsp)
4. Customer enters billing address, shipping address, contact details
5. Customer submits form (POST to order.do)
6. System validates all required fields
7. System creates Order entity with unique ID and current date
8. System creates LineItem entities from cart contents
9. System clears shopping cart
10. System displays order confirmation screen (order_completed.jsp)
11. System sends async confirmation email via AsyncSender

## Order Information Form

**Form Endpoint**
- POST to: order.do
- JSP: enter_order_information.jsp
- Mapped via struts-config.xml mappings

**Form Sections**
1. **Billing Information** (suffix: _a)
   - Given Name (maxlength: 30)
   - Family Name (maxlength: 30)
   - Street Address Line 1 (maxlength: 70)
   - Street Address Line 2 (maxlength: 70)
   - City (maxlength: 30)
   - State/Province (dropdown: CA, NY, TX)
   - Postal Code (maxlength: 20)
   - Country (dropdown: USA, Canada, Japan, China)
   - Telephone (maxlength: 20)
   - Email (maxlength: 50)

2. **Shipping Information** (suffix: _b)
   - Same fields as billing information

**Validation**
- All fields marked with validation="validation" attribute
- maxlength constraints enforced at form level
- State/Country dropdowns limit valid values
- Email format validation via JSP validator

## Order ID Generation

**UniqueIdGenerator**
- Configured with seed value: 1001
- Each new order increments sequence by 1
- Returns next available ID
- Called via EJBAction: po_id = uniqueIdGenerator.getUniqueId()

**Order Date**
- Set to current date/time at order creation
- Stored with order entity
- Used for order tracking and fulfillment

## Cart to Order Line Items

**LineItem Creation**
- For each CartItem in customer's shopping cart:
  - Create LineItem entity with:
    - itemId (from CartItem)
    - quantity (from CartItem)
    - unitPrice (from CartItem)
    - lineNumber (sequential 1, 2, 3...)
    - categoryId, productId (from item metadata)

**Cart Clearing**
- After successful LineItem creation, clear cart
- Remove all CartItem entries
- Set cart.count = 0

## Order Confirmation

**Confirmation Screen** (order_completed.jsp)
- Display: Order ID (orderresponse.orderId)
- Display: Customer Email (orderresponse.email)
- Show: Message "You should receive a confirmation e-mail soon at [email]"

**Order Notification**
- AsyncSender sends confirmation email asynchronously
- Message contains order ID and details
- Email address taken from order contactInfo
- Failure handling: printStackTrace() with no explicit user-facing error

## Error Handling

**ShoppingCartEmptyOrderException**
- Raised when attempting order placement with empty cart
- Prevents order creation
- Should redirect to cart page with error message

**Validation Errors**
- If form validation fails, return to order form with errors highlighted
- maxlength constraints prevent over-length input at JSP level
- Dropdown constraints ensure only valid values submitted

## Entity Structure

**Purchase Order**
- poId: Generated from UniqueIdGenerator
- poDate: Current date
- customerId: From authenticated session
- contactInfo: Customer contact details
- address_a: Billing address
- address_b: Shipping address
- lineItems: Collection of LineItem
- totalPrice: Sum of (quantity × unitPrice) for all items
- locale: From customer profile

**LineItem**
- itemId: Product item reference
- quantity: Ordered quantity
- quantityShipped: Initially 0
- unitPrice: Price at order time
- categoryId, productId: Item hierarchy
- lineNumber: Order in line items list

