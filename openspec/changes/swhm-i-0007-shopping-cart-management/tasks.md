# Shopping Cart — Implementation Tasks

## 1. Data Model

- [ ] 1.1 Implement ShoppingCart class with cartItems collection and count property
- [ ] 1.2 Implement CartItem class with itemId, quantity, unitCost properties
- [ ] 1.3 Add lineTotal property to CartItem (quantity × unitCost)
- [ ] 1.4 Add subtotal property to ShoppingCart
- [ ] 1.5 Make ShoppingCart session-scoped (HttpSession storage)

## 2. Cart Operations - Add

- [ ] 2.1 Implement addItem(itemId, quantity) method
- [ ] 2.2 Handle default quantity (1) if not specified
- [ ] 2.3 Check if item already exists and increment quantity
- [ ] 2.4 Recalculate cartItem lineTotal
- [ ] 2.5 Recalculate cart subtotal
- [ ] 2.6 Increment cart.count

## 3. Cart Operations - Remove

- [ ] 3.1 Implement removeItem(itemId) method
- [ ] 3.2 Remove CartItem from collection
- [ ] 3.3 Decrement cart.count
- [ ] 3.4 Recalculate cart subtotal

## 4. Cart Operations - Update

- [ ] 4.1 Implement updateItem(itemId, newQuantity) method
- [ ] 4.2 If newQuantity <= 0: call removeItem()
- [ ] 4.3 If newQuantity > 0: update CartItem.quantity
- [ ] 4.4 Recalculate line total (quantity × unitCost)
- [ ] 4.5 Recalculate cart subtotal

## 5. Cart Operations - Clear

- [ ] 5.1 Implement clearCart() method
- [ ] 5.2 Remove all CartItems from collection
- [ ] 5.3 Set cart.count = 0
- [ ] 5.4 Set cart.subtotal = 0.00

## 6. Cart Display UI

- [ ] 6.1 Create cart.jsp template
- [ ] 6.2 Implement conditional display: empty vs populated cart
- [ ] 6.3 Display "Your Shopping Cart is Empty." when cart.count == 0
- [ ] 6.4 Create table for populated cart display
- [ ] 6.5 Add columns: Item Name, Unit Cost, Quantity, Line Total
- [ ] 6.6 Add remove link for each item
- [ ] 6.7 Display cart Subtotal
- [ ] 6.8 Add "Update Cart" button

## 7. Cart Form Handling

- [ ] 7.1 Create CartAction to handle cart.do requests
- [ ] 7.2 Implement quantity update handling
- [ ] 7.3 Implement item remove handling
- [ ] 7.4 Validate quantity values (reject negative/non-numeric)
- [ ] 7.5 Recalculate totals after updates
- [ ] 7.6 Redirect back to cart display

## 8. Integration with Checkout

- [ ] 8.1 Retrieve cart from session before order placement
- [ ] 8.2 Create LineItem for each CartItem
- [ ] 8.3 Set LineItem quantity and unitPrice from CartItem
- [ ] 8.4 Clear cart after successful order creation

## 9. Session Management

- [ ] 9.1 Initialize empty ShoppingCart on session creation
- [ ] 9.2 Store cart in HttpSession.cart attribute
- [ ] 9.3 Retrieve cart from session for all cart operations
- [ ] 9.4 Ensure cart persists across page navigation
- [ ] 9.5 Clear cart on logout or session timeout

## 10. Testing

- [ ] 10.1 Test adding item to empty cart
- [ ] 10.2 Test adding duplicate item (increment quantity)
- [ ] 10.3 Test removing item from cart
- [ ] 10.4 Test updating quantities
- [ ] 10.5 Test cart subtotal calculation
- [ ] 10.6 Test line total calculation (quantity × unitCost)
- [ ] 10.7 Test empty cart display
- [ ] 10.8 Test populated cart display

