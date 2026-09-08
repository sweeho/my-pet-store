# Shopping Cart — Implementation Tasks

## 1. Core Cart Operations

- [ ] 1.1 Implement cart storage as in-memory HashMap with itemID as key
- [ ] 1.2 Implement addItem(itemID) to add with default quantity 1
- [ ] 1.3 Implement addItem(itemID, qty) to add with specified quantity
- [ ] 1.4 Implement updateItemQuantity(itemID, newQty) with qty > 0 validation
- [ ] 1.5 Implement deleteItem(itemID) to remove from cart
- [ ] 1.6 Implement getSubTotal() to sum (unitCost × quantity) for all items
- [ ] 1.7 Implement empty() to clear cart after order placement

## 2. Line Item Entity

- [ ] 2.1 Define LineItem persistent entity with 7 CMP fields
- [ ] 2.2 Implement categoryId, productId, itemId, lineNumber getters/setters
- [ ] 2.3 Implement quantity getter/setter (int type)
- [ ] 2.4 Implement unitPrice getter/setter (float type)
- [ ] 2.5 Implement quantityShipped getter/setter for fulfillment tracking
- [ ] 2.6 Declare ejbCreate(String, String, String, String, int, float, int) method
- [ ] 2.7 Declare ejbCreate(LineItem, int) alternative factory method

## 3. Line Item XML Serialization

- [ ] 3.1 Implement toDOM() method to serialize all 6 core fields
- [ ] 3.2 Implement fromDOM() method to deserialize from XML
- [ ] 3.3 Create LineItem.dtd schema defining element order
- [ ] 3.4 Create TPALineItem.xsd with type constraints

## 4. XML Validation

- [ ] 4.1 Add xsd:nonNegativeInteger constraint to lineNo (>= 0)
- [ ] 4.2 Add xsd:positiveInteger constraint to quantity (> 0)
- [ ] 4.3 Add positiveDecimal constraint to unitPrice (>= 0.0)
- [ ] 4.4 Validate LineItem+ cardinality in purchase orders (1+)
- [ ] 4.5 Test XSD validation on malformed documents

## 5. Integration Testing

- [ ] 5.1 Test adding single item to empty cart
- [ ] 5.2 Test adding multiple items to cart
- [ ] 5.3 Test updating quantities in cart
- [ ] 5.4 Test removing items from cart
- [ ] 5.5 Test cart subtotal calculation with multiple items
- [ ] 5.6 Test line item XML serialization
- [ ] 5.7 Test line item XML deserialization

## 6. Acceptance Testing

- [ ] 6.1 Test cart display shows item details and quantities
- [ ] 6.2 Test cart allows quantity updates
- [ ] 6.3 Test cart allows item removal
- [ ] 6.4 Test cart subtotal updates after modifications
- [ ] 6.5 Verify quantity constraint: min 1 item per line
- [ ] 6.6 Verify line number constraint: >= 0
- [ ] 6.7 Verify unit price constraint: >= 0.0
