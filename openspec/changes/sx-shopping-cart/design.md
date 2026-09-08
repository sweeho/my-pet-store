# Shopping Cart — Design Document

## Cart Operations

The shopping cart is implemented as an in-memory map stored in the ShoppingCartLocal EJB session bean. Operations include:

- `addItem(itemID)` — adds item with default quantity 1
- `addItem(itemID, qty)` — adds item with specified quantity
- `updateItemQuantity(itemID, newQty)` — updates quantity, removes item if qty <= 0
- `deleteItem(itemID)` — removes item from cart
- `getSubTotal()` — returns sum of (unitCost × quantity) for all items
- `empty()` — clears all items from cart

## Data Model

**CartItem** — represents an item in the shopping cart with:
- itemID (String, key)
- categoryId (String)
- productId (String)
- itemId (String)
- quantity (int, > 0)
- unitCost (float)

**LineItem** — persistent entity for line items in orders/documents:
- categoryId (String)
- productId (String)
- itemId (String)
- lineNumber (String, >= 0)
- quantity (int, > 0)
- unitPrice (float)
- quantityShipped (int, >= 0) — fulfillment tracking

## Line Item XML Format

LineItem elements serialize to XML conforming to LineItem.dtd:
```xml
<LineItem>
  <CategoryId>...</CategoryId>
  <ProductId>...</ProductId>
  <ItemId>...</ItemId>
  <LineNum>...</LineNum>
  <Quantity>...</Quantity>
  <UnitPrice>...</UnitPrice>
</LineItem>
```

XSD constraints enforce:
- lineNo: xsd:nonNegativeInteger (>= 0)
- quantity: xsd:positiveInteger (> 0)
- unitPrice: positiveDecimal (>= 0.0)

## Transactions

All shopping cart EJB methods execute with container-managed transaction attribute "Required".

## User Interface

Cart display shows:
- Item name and attribute
- Quantity field (user input)
- Unit cost (formatted as currency)
- Remove link per item
- Update Cart button to commit quantity changes
- Cart subtotal displayed at bottom

No screen records were extracted for this capability; its detailed user interface design is unspecified.
