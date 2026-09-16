# Shopping Cart — Implementation Tasks

## 1. Data Model

- [x] 1.1 Implement ShoppingCart class with cartItems collection and count property (SWHM-T-0133)
- [x] 1.2 Implement CartItem class with itemId, quantity, unitCost properties (SWHM-T-0133)
- [x] 1.3 Add lineTotal property to CartItem (quantity × unitCost) (SWHM-T-0133)
- [x] 1.4 Add subtotal property to ShoppingCart (SWHM-T-0133)
- [x] 1.5 Make ShoppingCart session-scoped (HttpSession storage) (SWHM-T-0133)

## 2. Cart Operations - Add

- [x] 2.1 Implement addItem(itemId, quantity) method (SWHM-T-0134)
- [x] 2.2 Handle default quantity (1) if not specified (SWHM-T-0134)
- [x] 2.3 Check if item already exists and increment quantity (SWHM-T-0134)
- [x] 2.4 Recalculate cartItem lineTotal (SWHM-T-0134)
- [x] 2.5 Recalculate cart subtotal (SWHM-T-0134)
- [x] 2.6 Increment cart.count (SWHM-T-0134)

## 3. Cart Operations - Remove

- [ ] 3.1 Implement removeItem(itemId) method (SWHM-T-0135)
- [ ] 3.2 Remove CartItem from collection (SWHM-T-0135)
- [ ] 3.3 Decrement cart.count (SWHM-T-0135)
- [ ] 3.4 Recalculate cart subtotal (SWHM-T-0135)

## 4. Cart Operations - Update

- [ ] 4.1 Implement updateItem(itemId, newQuantity) method (SWHM-T-0136)
- [ ] 4.2 If newQuantity <= 0: call removeItem() (SWHM-T-0136)
- [ ] 4.3 If newQuantity > 0: update CartItem.quantity (SWHM-T-0136)
- [ ] 4.4 Recalculate line total (quantity × unitCost) (SWHM-T-0136)
- [ ] 4.5 Recalculate cart subtotal (SWHM-T-0136)

## 5. Cart Operations - Clear

- [ ] 5.1 Implement clearCart() method (SWHM-T-0137)
- [ ] 5.2 Remove all CartItems from collection (SWHM-T-0137)
- [ ] 5.3 Set cart.count = 0 (SWHM-T-0137)
- [ ] 5.4 Set cart.subtotal = 0.00 (SWHM-T-0137)

## 6. Cart Display UI

- [x] 6.1 Create cart.jsp template (SWHM-T-0138)
- [x] 6.2 Implement conditional display: empty vs populated cart (SWHM-T-0138)
- [x] 6.3 Display "Your Shopping Cart is Empty." when cart.count == 0 (SWHM-T-0138)
- [x] 6.4 Create table for populated cart display (SWHM-T-0138)
- [x] 6.5 Add columns: Item Name, Unit Cost, Quantity, Line Total (SWHM-T-0138)
- [x] 6.6 Add remove link for each item (SWHM-T-0138)
- [x] 6.7 Display cart Subtotal (SWHM-T-0138)
- [x] 6.8 Add "Update Cart" button (SWHM-T-0138)

## 7. Cart Form Handling

- [ ] 7.1 Create CartAction to handle cart.do requests (SWHM-T-0139)
- [ ] 7.2 Implement quantity update handling (SWHM-T-0139)
- [ ] 7.3 Implement item remove handling (SWHM-T-0139)
- [ ] 7.4 Validate quantity values (reject negative/non-numeric) (SWHM-T-0139)
- [ ] 7.5 Recalculate totals after updates (SWHM-T-0139)
- [ ] 7.6 Redirect back to cart display (SWHM-T-0139)

## 8. Integration with Checkout

- [ ] 8.1 Retrieve cart from session before order placement (SWHM-T-0140)
- [ ] 8.2 Create LineItem for each CartItem (SWHM-T-0140)
- [ ] 8.3 Set LineItem quantity and unitPrice from CartItem (SWHM-T-0140)
- [ ] 8.4 Clear cart after successful order creation (SWHM-T-0140)

## 9. Session Management

- [ ] 9.1 Initialize empty ShoppingCart on session creation (SWHM-T-0141)
- [ ] 9.2 Store cart in HttpSession.cart attribute (SWHM-T-0141)
- [ ] 9.3 Retrieve cart from session for all cart operations (SWHM-T-0141)
- [ ] 9.4 Ensure cart persists across page navigation (SWHM-T-0141)
- [ ] 9.5 Clear cart on logout or session timeout (SWHM-T-0141)

## 10. Testing

- [ ] 10.1 Test adding item to empty cart (SWHM-T-0142)
- [ ] 10.2 Test adding duplicate item (increment quantity) (SWHM-T-0142)
- [ ] 10.3 Test removing item from cart (SWHM-T-0142)
- [ ] 10.4 Test updating quantities (SWHM-T-0142)
- [ ] 10.5 Test cart subtotal calculation (SWHM-T-0142)
- [ ] 10.6 Test line total calculation (quantity × unitCost) (SWHM-T-0142)
- [ ] 10.7 Test empty cart display (SWHM-T-0142)
- [ ] 10.8 Test populated cart display (SWHM-T-0142)
