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

## Codebase findings

Everything above this line was extracted from the legacy Java EE application. Everything below it was measured against this repository during planning (SWHM-T-0128) and is the record the implementation agents read first.

| #   | Finding                                                                                                                                                                                                                                                                                                                                  | Evidence                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | No cart code exists anywhere — no module, no table, no route, no page, no type. The only `cart` tokens in the repository are the legacy `/cart` `text/html` entry in the OpenAPI contract and a line in the build manifest.                                                                                                              | Case-insensitive `cart` grep across `*.ts`/`*.tsx` returns zero files; `api/openapi.yaml` and `build/manifest.yaml` only.                                |
| F2  | Per-visitor state is a `sessions` row behind the opaque httpOnly `bp_session` cookie, and `useSignOnSession(event)` creates that row on first touch — for an anonymous visitor as much as a signed-on one. A module-level map is forbidden outright.                                                                                     | `auth/session.ts:41-48`; `ARCHITECTURE.md` § Cross-cutting constraints ("Per-visitor state lives in the database, not in the process").                  |
| F3  | `item` carries **both** `list_price` and `unit_cost`, and the two differ substantially in the seeded catalogue — Parrots is `599.99` / `350.00`. The catalogue item screen renders `listPrice` as the price the shopper sees.                                                                                                            | `db/schema.ts:133-144`; `catalog/seed.ts:60-61`; `src/pages/catalog/item/[itemId].tsx` renders `item.listPrice.toFixed(2)`.                              |
| F4  | **`PRAGMA foreign_keys` is never set, so SQLite's default (OFF) applies and every `ON DELETE CASCADE` in `db/schema.ts` is declarative only.** Nothing in the repository relies on a cascade firing today, so this has never been observable. A cart cleared "by cascade" when its session row is deleted would silently not be cleared. | `db/client.ts:37-43` constructs the `Database` and migrates; no `pragma` call anywhere in the repository.                                                |
| F5  | A new top-level module must be registered in three places or it fails in ways that look unrelated: `vitest.config.ts`'s `server` include, `vitest.config.ts`'s `client` exclude, and `tsconfig.node.json`'s include. Absent from the first two it runs under jsdom, where `bun:sqlite` cannot resolve at all.                            | `vitest.config.ts:44-52` and `:58-63`; `tsconfig.node.json:13-27`. Both lists name directories literally.                                                |
| F6  | `getItem(itemId, locale)` already returns everything a cart line needs — `unitCost`, `listPrice`, `productName`, `description` — in one query. Its inner joins mean an unsupported locale yields `null` rather than a partial row.                                                                                                       | `catalog/item.ts:81-85`; `catalog/types.ts` § `Item`.                                                                                                    |
| F7  | Mutating routes are JSON in, JSON out: `defineHandler`, `readBody`, `setResponseStatus`, session resolved via `useSignOnSession`. No XML serializer exists and no route dispatches on a request-type discriminator.                                                                                                                      | `routes/api/customer/index.put.ts` is the closest precedent; `routes/api/admin/orders/status.post.ts` is the batch-mutation precedent.                   |
| F8  | `/cart` is not in `PROTECTED_RESOURCES`, and the catalogue is public by standing decision — each capability decides its own public/signed-on boundary explicitly rather than inheriting one.                                                                                                                                             | `auth/protected-resources.ts:17-25`; `ARCHITECTURE.md` § Key Decisions ("The catalogue is readable without a session").                                  |
| F9  | A shared `ui/table.tsx` primitive landed last sprint, with the semantic-elements and read-only rules already documented. The cart table reuses it; no new primitive is needed.                                                                                                                                                           | `src/components/ui/table.tsx`; `DESIGN.md` § Tabular data.                                                                                               |
| F10 | `order_line_item` already exists with `quantity` and `unit_price`, defined by the administrative capability, and the standing decision is that later capabilities extend it rather than introduce a parallel set. Order creation itself does not exist.                                                                                  | `db/schema.ts:192-206`; `ARCHITECTURE.md` § Key Decisions (D1 and the price-paid decision, both authored in `swhm-i-0006-administrative-operations-ma`). |
| F11 | CI already triggers on push and pull request to `vortex/**`, `dev` and `main`, in one job covering every tier.                                                                                                                                                                                                                           | `.github/workflows/ci.yml:15-22`.                                                                                                                        |
| F12 | Implementation containers ship no Chromium, so the browser tier is observed in CI and at integration QA, not locally.                                                                                                                                                                                                                    | `.vortex/agents-generated.md` § "Implementation containers do not ship a Chromium"; six consecutive tickets in SWHM-S-0012.                              |
| F13 | Both mockups reuse this repository's own token values and spacing. No new token, type scale, grid, interaction pattern or accessibility standard.                                                                                                                                                                                        | `artifacts/SWHM-S-0013/design/mockup-*.html` `:root` blocks against `DESIGN.md` § Tokens.                                                                |

## Spec discrepancies

The specification above describes a legacy Java EE application, so each row below is a place where it names something this repository does not contain. **None was resolved by editing the delta spec** — the spec of record keeps its extracted wording and every acceptance criterion is used verbatim. What follows is how each extracted mechanism is realised here.

| #   | The spec asserts                                                                                                                                           | This repository                                                                                                                                                                             | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | The cart line's price is `unitCost`, and the subtotal is `unitCost × quantity`. The populated mockup prices Parrots at `$350.00`.                          | `item.unit_cost` is `350.00` and `item.list_price` is `599.99` for that item, and every catalogue screen shows `listPrice` (F3).                                                            | **Implemented as specified: the cart's unit cost is `item.unit_cost`.** The spec and the mockup agree with each other, and the acceptance criteria are used verbatim. This is recorded as a **product contradiction, not an implementation choice**: the store will advertise `$599.99` on the item page and price the same item at `$350.00` in the cart. No code change can resolve it — which of the two columns a shopper is charged is a product decision nobody has taken. Raised as an improvement ticket for a human to settle before checkout exists, and named on SWHM-T-0134 so it is not read as a bug. |
| S2  | The cart is session-scoped and held in `HttpSession` as `session.cart`; the proposal calls it "in-memory session-based cart (no database persistence)".    | Per-visitor state is a database row, never process memory — a standing cross-cutting constraint, and `legacy-analysis/rebuild-guidance.md:75` says the same for the cart specifically (F2). | A `cart_items` table keyed on (`session_id`, `itemid`), foreign-keyed to `sessions.id`. "Session-scoped" is preserved exactly — the cart is reachable only through the `bp_session` cookie and dies with the session — but the storage is a row. The proposal's "no database persistence" describes the legacy implementation, not the observable behaviour any scenario asserts.                                                                                                                                                                                                                                   |
| S3  | `cart.jsp` renders the cart; `cart.do` handles form posts and redirects back to the cart display (groups 6, 7).                                            | A React SPA with file-based pages and JSON routes; nothing redirects after a mutation (F7).                                                                                                 | `src/pages/cart.tsx` at `/cart`, with JSON routes under `routes/api/cart/`. The POST-redirect-GET cycle becomes a mutation followed by a state refresh in the page. The observable outcome the scenario asserts — the cart is updated and redisplayed — is unchanged.                                                                                                                                                                                                                                                                                                                                               |
| S4  | `ShoppingCart` and `CartItem` classes with `count`, `subtotal` and `lineTotal` properties (group 1).                                                       | TypeScript modules and types; there are no classes in the server capability modules.                                                                                                        | `cart/types.ts` exports `CartItem` and `Cart` as types with exactly those fields, and `cart/cart.ts` exports functions. `count`, `subtotal` and `lineTotal` are derived on read rather than stored, so they cannot drift from the rows — see D6.                                                                                                                                                                                                                                                                                                                                                                    |
| S5  | The cart can be serialized to XML (XMLDOC-ENTITY-0005).                                                                                                    | Nothing in the repository serializes XML.                                                                                                                                                   | Dropped. No scenario in the delta spec asserts it, and no requirement depends on it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S6  | "Clear cart on logout or session timeout" (9.5).                                                                                                           | Sessions never expire, for anyone. And a cascade from `sessions` would **not** fire, because foreign-key enforcement is off (F4).                                                           | Logout clears the cart with an **explicit delete**, not a cascade. The session-timeout half is not built: sessions do not expire, which `PRODUCT.md` § Not yet decided already records as an open decision for the authentication capability rather than this one. Turning the pragma on is out of scope here — it would change delete semantics for six account tables and the whole catalogue at once — and is raised as an improvement ticket.                                                                                                                                                                   |
| S7  | `cart.count` is incremented on add and decremented on remove; "a cart containing 3 items of different types" leaves "2 remaining items" after one removal. | —                                                                                                                                                                                           | `count` is the number of **distinct line items**, not the sum of quantities. The remove scenario fixes this: three items of different types minus one leaves two. The add scenarios never contradict it, because adding a duplicate raises a quantity rather than adding a line. Pinned here because the two readings differ on every populated cart and no scenario states it outright.                                                                                                                                                                                                                            |
| S8  | Group 8 retrieves the cart before order placement, creates a line item per cart item, and clears the cart after successful order creation.                 | Order **creation** does not exist. `order_line_item` exists and is the shape to map onto (F10); `swhm-i-0008-order-submission-checkout` owns creating orders.                               | This change builds the **seam, not the caller**: `cart/checkout.ts` exports the cart→line-item mapping and the clear, both covered by tests, with no order-creation path to invoke them. The idea's own Solution says the same ("Clear-on-order is exported from `cart/` for `swhm-i-0008` to call. This capability has no caller for it yet."). The "cart is cleared after order creation" criterion is therefore carried by the ticket that implements the clear (SWHM-T-0137), where it is directly observable.                                                                                                  |
| S9  | "Cart Scope — session-wide: accessible from any page during authenticated session. Customer-specific: each customer has own cart instance."                | The catalogue is public and `/cart` is in no protected-resource list (F8).                                                                                                                  | The cart is **not** sign-on protected. It is keyed on the session, which an anonymous visitor also has, so "each customer has their own cart" holds by construction and is strictly wider than the legacy reading. Adding `/cart` to `PROTECTED_RESOURCES` would put a sign-on wall between browsing and adding an item, which no scenario asks for and which the catalogue's public standing decision argues against. Whether a cart should survive signing on is a question for `swhm-i-0008`, and is not answered here.                                                                                          |
| S10 | Group 10 is a body of testing work with eight checkboxes.                                                                                                  | Tests are written by the ticket that implements the behaviour; a verify-only ticket is forbidden by the team contract.                                                                      | The eight boxes are tagged to SWHM-T-0142 because every box in a group takes that group's key, but seven of the eight describe assertions the implementing tickets already own at the unit tier. SWHM-T-0142 owns the one artifact no other ticket owns: `e2e/cart.spec.ts`, the browser-tier journey across add, update, remove and persistence. It does not re-open another ticket's files.                                                                                                                                                                                                                       |
| S11 | `api/openapi.yaml` publishes `/cart` returning `text/html`.                                                                                                | The rebuild's API is defined by its Nitro routes, and `legacy-analysis/rebuild-guidance.md:72` states outright that legacy paths do not define it.                                          | The legacy entry is left as the historical contract it is. The cart's API is JSON under `routes/api/cart/`. No ticket edits `api/openapi.yaml`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| S12 | Scenarios name "item ID 1001".                                                                                                                             | Item ids in this catalogue are strings such as `BIRDS-PARROTS-1`.                                                                                                                           | The id is an opaque string throughout. `1001` in a scenario means "a particular item", and a test using a real seeded id satisfies it exactly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| S13 | Quantity validation rejects "negative/non-numeric" (7.4), while the update requirement says a negative quantity **removes** the item.                      | —                                                                                                                                                                                           | Both hold and they are not in conflict: a non-numeric quantity is rejected as a malformed request (400), and a numeric quantity ≤ 0 is a valid instruction to remove. The delta spec's three update scenarios are explicit that `0` and `-1` remove rather than fail, so rejection applies only to values that are not numbers.                                                                                                                                                                                                                                                                                     |

## Decisions

- **D1 — The cart is a table keyed on (session id, item id), storing quantity only.** `cart_items` foreign-keys to `sessions.id` and `item.itemid`. Price is resolved on read through `catalog/item.ts` (F6), so no price column is duplicated and a cart never disagrees with the catalogue about what an item costs. The composite key is what makes "adding a duplicate raises the quantity" a single upsert rather than a read-modify-write.
- **D2 — The cart's unit cost is `item.unit_cost`, as the spec and the mockup both require.** See S1. This is implemented as specified and flagged as a product contradiction, not silently reconciled.
- **D3 — The cart is public.** No entry is added to `auth/protected-resources.ts`, so an anonymous visitor has a cart. See S9.
- **D4 — Clearing the cart at logout is an explicit call, never a cascade.** Foreign-key enforcement is off (F4), so the `ON DELETE CASCADE` on `cart_items.session_id` documents intent and enforces nothing. Any later capability that assumes a cascade fires in this repository is making the same mistake. Promoted to `ARCHITECTURE.md` § Key Decisions — it binds every later table that declares one.
- **D5 — `count` is the number of distinct line items.** See S7.
- **D6 — `subtotal`, `lineTotal` and `count` are derived on read, never stored.** The spec describes recalculating and reassigning them after every operation, which is how a mutable Java object works; here they are computed from the rows each time the cart is read. A stored total is a second source of truth that drifts the first time an operation forgets to update it, and every "recalculate subtotal" checkbox is satisfied by there being nothing to recalculate.
- **D7 — A quantity of zero or less removes the line, decided in one place.** `updateItem` applies the rule; the batch update is one `db.transaction`, following `admin/order-status.ts`. Callers never pre-filter zeroes, so the rule cannot be applied inconsistently by a new caller.
- **D8 — `cart/types.ts` is written whole by the first ticket and never extended.** SWHM-T-0133 defines every type the capability needs — including the ones only the checkout seam and the UI consume — because the previous sprint had three tickets appending to one shared type file with no dependency edge between them, and the collision was averted only by merges happening to run sequentially (`artifacts/SWHM-S-0012/sprint-summary.md` § Retrospective).

## Phases

1. **Data model and module registration** — `cart_items`, its migration, the complete `cart/types.ts`, and the three registration edits F5 names. (SWHM-T-0133)
2. **Add** — `addItem`, the subtotal computation, `GET /api/cart`, `POST /api/cart`, and the Add to Cart control on the item page. (SWHM-T-0134)
3. **Remove** — `removeItem` and `DELETE /api/cart/items/{itemId}`. (SWHM-T-0135)
4. **Update** — `updateItem`, the zero-or-less removal rule, and the batch `PUT /api/cart`. (SWHM-T-0136)
5. **Clear** — `clearCart`, with no HTTP surface. (SWHM-T-0137)
6. **Cart screen** — `/cart`, both states, built to the mockups. (SWHM-T-0138)
7. **Cart form handling** — Update Cart, per-row remove, and quantity validation wired to the routes. (SWHM-T-0139)
8. **Checkout seam** — the cart→line-item mapping and the clear, exported for `swhm-i-0008`. (SWHM-T-0140)
9. **Session lifecycle** — cart retrieval per request and the explicit clear at logout (S6). (SWHM-T-0141)
10. **Test harness** — no new harness is required. Vitest's two projects already cover both tiers; the one registration this change owes is adding `cart/**` to both project lists, which is phase 1's work (F5). Module tests sit beside the module as `*.test.ts`, page tests as `*.test.tsx`, and the browser tier gains one `e2e/cart.spec.ts` owned by SWHM-T-0142. Implementation containers ship no Chromium (F12), so those assertions are observed in CI and at integration QA rather than locally.
11. **CI** — unchanged and verified, not assumed: `.github/workflows/ci.yml` already triggers on push and pull request to `vortex/**`, `dev` and `main`, and its single job runs lint, typecheck, unit and browser tiers (F11). No ticket in this sprint edits it.

## Design references

Exported from idea SWHM-I-0007 (doc version 8, frozen) to `artifacts/SWHM-S-0013/design/`: `wireframe-shopping-cart-populated.html`, `wireframe-shopping-cart-empty.html`, `mockup-shopping-cart-populated.html`, `mockup-shopping-cart-empty.html`, with `MANIFEST.md` beside them recording what each one fixes. The mockups are authoritative for the cart screen and use this repository's own tokens unchanged (F13).
