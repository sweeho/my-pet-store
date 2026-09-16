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

1. **Billing Information** (suffix: \_a)
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

2. **Shipping Information** (suffix: \_b)
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

## Codebase findings

Everything above this line was extracted from the legacy Java EE application. Everything below it was measured against this repository during planning (SWHM-T-0147) and is the record the implementation agents read first.

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                      | Evidence                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **`orders` and `order_line_item` already exist.** The administrative capability defined them because it was the first to need them, and the standing decision is that later capabilities extend that shape rather than introduce a parallel one. `orders` holds `order_id` (autoincrement pk), `user_name`, `order_date`, `order_amount`, `status`; `order_line_item` holds (`order_id`, `line_number`), `itemid`, `quantity`, `unit_price`. | `db/schema.ts:168-206`; ARCHITECTURE.md § Data model and § Key Decisions, authored in change `swhm-i-0006-administrative-operations-ma`.                  |
| F2  | The columns this change needs and those tables lack: billing and shipping address plus contact details on `orders`; `catid`, `productid` and `quantity_shipped` on `order_line_item`. One migration covers both.                                                                                                                                                                                                                             | `db/schema.ts:173-206` against the form field set in § Order Information Form above.                                                                      |
| F3  | **The cart→order seam is already built and tested, and nobody calls it.** `cart/checkout.ts` exports `toOrderLineItems(sessionId)` returning `{ itemid, quantity, unitPrice, lineNumber }[]` with `lineNumber` assigned from 1 upward, and `clearCartAfterOrder(sessionId)` delegating to `clearCart`. This change is the caller that seam was built for.                                                                                    | `cart/checkout.ts:1-34`; archived design.md § Spec discrepancies S8 for `swhm-i-0007`.                                                                    |
| F4  | That seam does **not** carry `catid` or `productid`, and neither does `CartItem` — the cart deliberately stores quantity only and resolves everything else from the catalogue on read. The spec requires a line item to carry both.                                                                                                                                                                                                          | `cart/types.ts`; `cart/cart.ts:18-33`; delta spec, "Line items include category and product identifiers".                                                 |
| F5  | `orders.order_id` is `integer primary key autoincrement`, which SQLite starts at 1. Nothing seeds it to 1001, and no ID-allocation code exists anywhere in the repository.                                                                                                                                                                                                                                                                   | `db/schema.ts:175`; no `UniqueIdGenerator`, sequence or id-allocation module in any grep.                                                                 |
| F6  | `db/client.ts` seeds six demo orders in development and **none** under Vitest, where an in-memory database is used instead. An assertion that the first order is 1001 is therefore reproducible at the unit tier and against a fresh development database, and not against one that already holds orders.                                                                                                                                    | `db/client.ts:74-175`, guarded by `!process.env.VITEST`; ARCHITECTURE.md § Data model.                                                                    |
| F7  | **`/enter-order-information` is already in `PROTECTED_RESOURCES`** as `enter_order_information.screen`, carried over with the other legacy entries. No page file exists for it, so the path is protected today and resolves to the catch-all. `/order-completed` is not listed.                                                                                                                                                              | `auth/protected-resources.ts:17-25`; `src/pages/` has no matching file.                                                                                   |
| F8  | `orders.status` is `notNull` with no default, and `PENDING` already exists as the first of four statuses the administrative capability fixed. Initialising a new order to `PENDING` needs no new vocabulary and no migration.                                                                                                                                                                                                                | `db/schema.ts:182`; `admin/types.ts` § `ORDER_STATUSES`.                                                                                                  |
| F9  | `account/vocabulary.ts` already exports `STATES` (`California`, `New York`, `Texas`) and `COUNTRIES` (`USA`, `Canada`, `Japan`, `China`) — exactly the values this spec asks for. They are form options only and are deliberately **not** enforced server side.                                                                                                                                                                              | `account/vocabulary.ts:8-10`; `account/validation.ts:7-9`.                                                                                                |
| F10 | `src/pages/customer.tsx` is the form precedent: the shared `inputClassName`, a flat `EditFormState`, `emptyToNull`, `buildUpdate`, `Button` and `RequireSignOn` from `@/components`, and a single form-level `role="alert"`. It carries no `maxlength` on any field and no per-field error presentation.                                                                                                                                     | `src/pages/customer.tsx:8-85, 205-455`.                                                                                                                   |
| F11 | Mutating routes are JSON in, JSON out — `useSignOnSession` → 401, a validation error class → 400, otherwise the result. A **write** transaction helper does exist: `db.transaction()` is already used for multi-statement writes, contrary to the idea's risk note that only `catalog/transaction.ts`'s `readConsistent()` is available.                                                                                                     | `routes/api/customer/index.put.ts`; `cart/cart.ts:79-90`; `admin/order-status.ts:30-38`.                                                                  |
| F12 | A new top-level module registers in **three** places or it fails in ways that look unrelated: `vitest.config.ts`'s `server` include, `vitest.config.ts`'s `client` exclude, and `tsconfig.node.json`'s include. Absent from the first two it runs under jsdom, where `bun:sqlite` cannot resolve at all.                                                                                                                                     | `vitest.config.ts:44-52, 58-63`; `tsconfig.node.json:13-27`. Each list names its directories literally.                                                   |
| F13 | **Nothing in the product links to checkout.** `src/pages/cart.tsx` ends at Update Cart and a subtotal; no file under `src/` or `e2e/` mentions checkout or `enter-order`. The entry point into this capability has to be added.                                                                                                                                                                                                              | `src/pages/cart.tsx:186-200`; case-insensitive grep for `checkout`/`enter-order` across `src/` and `e2e/`.                                                |
| F14 | CI already triggers on push and pull request to `vortex/**`, `dev` and `main`, in one job covering every tier.                                                                                                                                                                                                                                                                                                                               | `.github/workflows/ci.yml:15-22`.                                                                                                                         |
| F15 | Implementation containers ship no Chromium, so the browser tier is observed in CI and at integration QA, not locally.                                                                                                                                                                                                                                                                                                                        | `.vortex/agents-generated.md` § "Implementation containers do not ship a Chromium".                                                                       |
| F16 | Both mockups use this repository's own token values unchanged. The order form mockup does introduce one thing the design system does not yet carry: a per-field invalid state — destructive border, `aria-invalid="true"`, and a short destructive message directly beneath the input — alongside a form-level alert. No existing form does this, and nothing documents it.                                                                  | `artifacts/SWHM-S-0014/design/mockup-enter-order-information.html` `:root` and `.field.error`/`.msg` rules against DESIGN.md, which has no forms section. |
| F17 | Prices are `real` throughout, including `orders.order_amount`, and the ticket raised to settle a money representation before order arithmetic depends on one (SWHM-T-0058) is still in BACKLOG and unassigned.                                                                                                                                                                                                                               | `db/schema.ts:140-141, 181, 203`; ARCHITECTURE.md § Data model.                                                                                           |
| F18 | Which figure a shopper is charged — `item.list_price` or `item.unit_cost` — is an open product decision. The catalogue shows `list_price`; the cart totals `unit_cost`. An order total inherits whichever the cart used.                                                                                                                                                                                                                     | PRODUCT.md § Not yet decided; archived design.md § Spec discrepancies S1 for `swhm-i-0007`.                                                               |

## Spec discrepancies

The specification above describes a legacy Java EE application, so each row below is a place where it names something this repository does not contain. **None was resolved by editing the delta spec** — the spec of record keeps its extracted wording and every acceptance criterion is used verbatim. What follows is how each extracted mechanism is realised here.

| #   | The spec asserts                                                                                                                                                                              | This repository                                                                                                                                                                         | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | A `UniqueIdGenerator` EJB configured with seed 1001, with `getUniqueId()` and thread-safe allocation (group 3).                                                                               | No EJB container, no ID service, and `orders.order_id` is already an autoincrement primary key (F5). SQLite has a single writer, so there is no concurrent-allocation problem to solve. | The `orders` sequence **is** the generator: it is pre-seeded so the first id it allocates is 1001. "Thread-safe generation" is satisfied by the database allocating the id inside the insert, which is why no separate allocation module is introduced.                                                                                                                                                                                 |
| S2  | "First order receives ID 1001" as an absolute value.                                                                                                                                          | Only true against an empty `orders` table. Under Vitest the demo seed is skipped and the table is empty (F6); a development database that already holds orders will not produce 1001.   | Implemented as specified and asserted **at the tier where it is reproducible** — the unit tier, against the in-memory database. The browser tier asserts that an order id is shown and that ids increment, never a literal 1001. This is the concern the idea flagged rather than edited, recorded here rather than by weakening the criterion.                                                                                         |
| S3  | `enter_order_information.jsp`, `order_completed.jsp`, an `OrderForm` bound to a JSP template, an `OrderAction` posting to `order.do`, and `struts-config.xml` forwards (1.10, 2.1, 2.7, 2.8). | A React SPA with file-based pages and JSON Nitro routes. `legacy-analysis/rebuild-guidance.md:72` states outright that the legacy paths do not define the rebuild's API.                | `src/pages/enter-order-information.tsx` and `src/pages/order-completed.tsx`; one route at `routes/api/order/index.post.ts`. A Struts forward becomes a client-side navigation and a validation failure becomes a 400 the page renders in place. The observable outcomes the scenarios assert are unchanged.                                                                                                                             |
| S4  | Group 8: an `AsyncSender` sends a confirmation email, catching `ServiceLocatorException` and `XMLDocumentException` (8.1–8.6).                                                                | No message queue, no mail transport, no async sender.                                                                                                                                   | **Not built, deliberately.** The idea places it out of scope and no requirement in the delta spec asserts an email is _sent_ — the only requirement is that the confirmation screen says one is coming. Group 8's boxes are tagged to the ticket that owns that wording. Delivery belongs to change `swhm-i-0012-customer-notifications-commu`, and an improvement ticket records that the copy promises what that change will deliver. |
| S5  | `ShoppingCartEmptyOrderException`, thrown and caught (9.1–9.4).                                                                                                                               | No Java exception types; validation failures are error classes the route maps to a status code (F11).                                                                                   | An error class in `order/`, mapped to 400 with the message the spec fixes, and the form navigates the shopper to `/cart`. The name is preserved in the class so the criterion stays traceable; the mechanism is a response, not a throw across a container.                                                                                                                                                                             |
| S6  | `OrderAddress` entities and the `_a` / `_b` suffixes for billing and shipping (1.2, 4.4, 4.5).                                                                                                | `account/types.ts` already defines `Address` and `ContactInfo`, and their field set is exactly what the spec's two sections ask for.                                                    | Columns on `orders` prefixed `billing_` and `shipping_`, reusing those two types. The suffixes are a legacy form-field naming convention with no observable behaviour attached; the sections are named "Billing Information" and "Shipping Information", which is what the scenarios assert.                                                                                                                                            |
| S7  | The idea's own summary says order placement accepts "credit card information", and the proposal lists payment information in scope.                                                           | No requirement or scenario in the delta spec mentions a card, and PRODUCT.md's standing non-goals forbid the store holding a card number at all.                                        | **No card capture is built.** The nineteen criteria derived from the scenarios are the whole definition of done, and none of them names a card. Payment is change `swhm-i-0009-payment-credit-card-processi`.                                                                                                                                                                                                                           |
| S8  | 5.5, "extract categoryId, productId from item metadata".                                                                                                                                      | A `CartItem` carries neither, by design — the cart stores quantity only (F4).                                                                                                           | The order module resolves both from the catalogue at placement time and **stores** them on the line item, matching the precedent already set for `unit_price`: a line item records what was true when the order was placed, and a later join would restate history.                                                                                                                                                                     |
| S9  | 6.2–6.4, "clear cart.items", "set cart.count = 0", "update cart in session".                                                                                                                  | `count` is derived on read and never stored, and the cart is a table keyed on the session, not an object in session memory.                                                             | Deleting the rows _is_ all three: with no rows, `count` reads 0 and there is nothing to assign or write back. The scenario's assertion (`cart.count = 0`) is observable exactly as written.                                                                                                                                                                                                                                             |
| S10 | 4.7, "initialize order status to PENDING".                                                                                                                                                    | No requirement in the delta spec mentions status at all, but `orders.status` is `notNull` and `PENDING` already exists (F8).                                                            | Set to `PENDING`. This is a column the schema requires rather than a behaviour this change specifies, so it carries no acceptance criterion of its own. The open question the idea raised — whether an order carries a status — is already answered by the existing table.                                                                                                                                                              |
| S11 | Entity fields named `poId`, `poDate`, `customerId`, `totalPrice` (4.1, 5.8).                                                                                                                  | The columns are `order_id`, `order_date`, `user_name`, `order_amount` (F1).                                                                                                             | The existing names are kept. Renaming columns four other modules read, to match a Java field name, would break the administrative capability for nothing observable. The delta spec's one use of `order.poDate` is satisfied by the order date being recorded.                                                                                                                                                                          |
| S12 | Group 10 is eight checkboxes of testing work.                                                                                                                                                 | Tests are written by the ticket that implements the behaviour; a verify-only ticket is forbidden by the team contract.                                                                  | All eight boxes take that group's key because every box in a group must, but seven describe assertions the implementing tickets already own at the unit tier. The group's ticket owns the one artifact no other ticket owns: `e2e/order.spec.ts`, the browser-tier journey from a populated cart to a confirmed order. 10.7 has nothing to assert — see S4.                                                                             |
| S13 | "The screen SHALL show 'Your order Id is 1005'" as one sentence.                                                                                                                              | The mockup renders "Your order Id is" as a label and the number as a separate, larger element beneath it.                                                                               | Built to the mockup, with the two elements composed so the block's accessible text reads as the scenario's sentence. Pinned here because a test matching the exact string against a single element would fail on a correct implementation.                                                                                                                                                                                              |
| S14 | "the order.poDate SHALL be set to September 8, 2026".                                                                                                                                         | A date fixed at extraction time, a week before this sprint.                                                                                                                             | Read as "the date and time at which the order was placed", which is what the requirement itself states. Asserted against a controlled clock rather than a literal date.                                                                                                                                                                                                                                                                 |
| S15 | Field length limits stated as `maxlength="30"` / `maxlength="70"` attributes.                                                                                                                 | —                                                                                                                                                                                       | Implemented as the attributes the scenarios name. No scenario asserts server-side length rejection, and none is added — the server validates required fields and email format, which is what the requirements do cover.                                                                                                                                                                                                                 |

## Decisions

- **D1 — `orders` and `order_line_item` are extended, never duplicated.** Both tables already exist (F1) and four other modules read them. This change adds columns and a migration; it does not introduce an order table of its own.
- **D2 — An order carries its own billing and shipping address, copied at placement.** Not a reference to the account's single address, and not a write-back to it. This answers the question PRODUCT.md deferred to order placement — an account still keeps one address, and an _order_ keeps two. Copying is what makes an order a record of what was agreed rather than a view of whatever the account says today, which is the same argument that already fixes `unit_price` as the price paid. Promoted to ARCHITECTURE.md § Key Decisions: every later capability reading an order inherits it.
- **D3 — Order ids come from the `orders` autoincrement sequence, pre-seeded so the first allocated id is 1001.** No allocation module, no `max(order_id) + 1` read-then-write, no UUID — the last is a hard constraint from `legacy-analysis/rebuild-guidance.md:90`. The seeding runs beside the other startup seeding in `db/client.ts` so the migrations stay generated-only. See S1, S2.
- **D4 — Placement is one `db.transaction`: insert the order, insert its line items, clear the cart.** `db.transaction()` is already the repository's write-transaction mechanism (F11), contrary to the idea's risk note. Ordering matters and is fixed by `legacy-analysis/rebuild-guidance.md:98`: the cart is cleared only after order creation succeeds, so a failed placement leaves the cart intact for a retry.
- **D5 — `catid` and `productid` are stored on the line item, resolved at placement.** See S8.
- **D6 — The form does not prefill from the customer's saved address.** The spec describes empty fields and no scenario asserts a prefilled one. Whether checkout should offer the account's address, and whether editing it should write back, are product decisions nobody has taken; an improvement ticket records both rather than either being settled by an implementation choice here.
- **D7 — The per-field invalid state the mockup introduces is documented once, in DESIGN.md.** Twenty fields on one screen is the first place the product needs it (F16), and a pattern decided per screen is a pattern three screens disagree about. The form-level alert stays too — it is what a screen reader hears on submit, before focus reaches any field.
- **D8 — `order/types.ts` is written whole by the first ticket and never extended by a later one in this sprint.** The same rule `swhm-i-0007` adopted after three tickets appended to one shared type file with no dependency edge between them.
- **D9 — Money stays `real`, and this change does not settle a representation.** Summing line totals here is the same arithmetic reporting already does (F17). SWHM-T-0058 remains the place that decision gets taken; nothing in this change is written so as to make taking it harder.

## Phases

1. **Order information form, data model and module registration** — the new columns and their migration, `order/types.ts` written whole, the three registration edits F12 names, the form screen with both sections and every field, and the entry point into checkout from the cart (F13). (SWHM-T-0153)
2. **Form routing and validation** — `order/validation.ts`, `POST /api/order` answering 401 and 400, and the form's submit wiring with per-field error presentation. (SWHM-T-0154)
3. **Order id allocation** — seeding the `orders` sequence so the first id allocated is 1001. (SWHM-T-0155)
4. **Order creation** — `order/order.ts`: the order row, its date, its status, both addresses, the contact details, wired into the route. (SWHM-T-0156)
5. **Line item creation** — the cart mapping through `cart/checkout.ts` (F3), extended to carry `catid` and `productid` (S8), and the order total. (SWHM-T-0157)
6. **Cart clearing** — the clear, inside the same transaction and after creation succeeds (D4). (SWHM-T-0158)
7. **Order confirmation screen** — `/order-completed`, its protected-resource entry, the order id and the email. (SWHM-T-0159)
8. **Confirmation notification** — the promise the screen makes, and the record that nothing sends it yet (S4). (SWHM-T-0160)
9. **Error handling** — the empty-cart error, its message and the navigation back to the cart. (SWHM-T-0161)
10. **Test harness** — no new harness is required. Vitest's two projects already cover both tiers; the one registration this change owes is adding `order/**` to both project lists and to `tsconfig.node.json`, which is phase 1's work (F12). Module tests sit beside the module as `*.test.ts`, page tests as `*.test.tsx`, and the browser tier gains one `e2e/order.spec.ts` owned by SWHM-T-0162. Implementation containers ship no Chromium (F15), so those assertions are observed in CI and at integration QA rather than locally.
11. **CI** — unchanged and verified, not assumed: `.github/workflows/ci.yml` already triggers on push and pull request to `vortex/**`, `dev` and `main`, and its single job runs lint, typecheck, unit and browser tiers (F14). No ticket in this sprint edits it.

## Design references

Exported from idea SWHM-I-0008 (doc version 8, frozen) to `artifacts/SWHM-S-0014/design/`: `wireframe-enter-order-information.html`, `wireframe-order-confirmation.html`, `mockup-enter-order-information.html`, `mockup-order-confirmation.html`, with `MANIFEST.md` beside them recording what each one fixes. The mockups are authoritative for both screens and use this repository's own tokens unchanged (F16).
