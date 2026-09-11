# Shopping Cart — Design Document

## Cart Data Model

**ShoppingCart (Session-Scoped)**
- cartItems: Collection<CartItem>
- count: int (item count)
- subtotal: double (sum of line totals)

**CartItem**
- itemId: String (item identifier)
- quantity: int (ordered quantity)
- unitCost: double (price per unit)
- lineTotal: double (quantity × unitCost)

## Cart Operations

### Add Item
- addItem(itemId, quantity)
- If itemId already in cart: increment quantity
- If quantity not specified: default to 1
- Recalculate subtotal
- Increment count

### Remove Item
- removeItem(itemId)
- Remove CartItem from collection
- If item exists: decrement count
- Recalculate subtotal

### Update Quantities
- updateItem(itemId, newQuantity)
- If newQuantity <= 0: remove item
- If newQuantity > 0: update quantity
- Recalculate line total and subtotal
- Update count as needed

### Clear Cart
- clearCart()
- Remove all CartItems
- Set count = 0
- Set subtotal = 0.00

## Calculation Logic

**Line Total**
- lineTotal = unitCost × quantity
- Applied when item added or quantity updated

**Cart Subtotal**
- subtotal = SUM(all lineTotal values)
- Recalculated on any add/remove/update operation

## Cart Display (cart.jsp)

**Empty Cart Display**
- When cart.count == 0:
  - Show message: "Your Shopping Cart is Empty."
  - No table display
  - Link to continue shopping

**Populated Cart Display**
- Table showing:
  - Item Name
  - Unit Cost
  - Quantity (editable input)
  - Line Total
- Per-item remove link
- "Update Cart" button for batch quantity updates
- Cart Subtotal display

## Session Management

**Cart Storage**
- Stored in HttpSession as session.cart
- Persists across page navigation within session
- Lost on session timeout or logout

**Cart Scope**
- Session-wide: accessible from any page during authenticated session
- Customer-specific: each customer has own cart instance
- Not shared between customers

## Form Actions

**Update Cart**
- POST to cart.do with updated quantities
- Quantity parameters by item ID
- Clears removed items (quantity = 0)
- Redirects back to cart display

**Remove Item**
- POST to cart.do with itemId and remove action
- Removes single item
- Redirects back to cart display

**Checkout**
- POST to order.do (order placement)
- Includes all current cart items as line items
- Clears cart after order creation

## XML Serialization (for integration)

**Cart XML Representation** (XMLDOC-ENTITY-0005)
- Shopping cart can be serialized to XML
- Format includes cartItems collection
- Used for data persistence or transmission
- Schema includes quantity and unitPrice per item

