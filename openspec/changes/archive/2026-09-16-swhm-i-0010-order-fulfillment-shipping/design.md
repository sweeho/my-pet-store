# Order Fulfillment & Shipment Management — Design Document

## Order Processing Flow

The supplier receives purchase orders through an asynchronous message-driven architecture:

1. **PO Reception** — SupplierOrderMDB listens to OPC queue (javax.jms.Queue)
2. **Message Processing** — onMessage() extracts purchase order XML
3. **Inventory Verification** — OrderFulfillmentFacadeEJB checks each line item
4. **Fulfillment** — Items are marked shipped; inventory is reduced
5. **Invoice Generation** — XML invoice created for fulfilled items
6. **Order Completion** — Order status transitions to COMPLETED when all items fulfilled

## Data Model

**Purchase Order (PO)**

- poId: Primary key
- userId: Customer reference
- poDate: Order date
- poStatus: PENDING or COMPLETED
- lineItems: Collection of LineItemLocal

**Line Item**

- itemId: Primary key (foreign key to Item)
- quantity: Ordered quantity
- quantityShipped: Shipped quantity
- categoryId, productId: Item hierarchy
- lineNumber: Sequential number
- unitPrice: Price per unit

**Inventory**

- itemId: Primary key (foreign key to Item)
- quantity: Available quantity
- reduceQuantity(int q): Decrements quantity atomically

## Fulfillment Processing

**OrderFulfillmentFacadeEJB.processPO(SupplierOrder po)**

- Invokes processAnOrder(po) for inventory verification
- Returns invoice XML if items fulfilled, null otherwise

**OrderFulfillmentFacadeEJB.processAnOrder(SupplierOrderLocal po)**

1. Iterate through po.getLineItems()
2. Skip line items where quantityShipped == quantity (already fulfilled)
3. For remaining items:
   - Call checkInventory(LineItemLocal item)
   - If available: call li.setQuantityShipped(li.getQuantity())
   - Track fulfilled items in HashMap
4. If all items available: set po.setPoStatus(COMPLETED)
5. If any items fulfilled: call createInvoice(po, fulfilledItems)
6. Return invoice XML or null

**checkInventory(LineItemLocal item)**

- Query InventoryLocal by item.getItemId()
- Compare inv.getQuantity() >= item.getQuantity()
- If available: call inv.reduceQuantity(item.getQuantity())
- Return success/failure boolean

**InventoryEJB.reduceQuantity(int quantity)**

- Retrieve current quantity: int q = this.getQuantity()
- Set new quantity: setQuantity(q - quantity)
- Transactionally managed with Required transaction attribute
- Container-managed persistence

## Invoice Generation

**createInvoice(SupplierOrderLocal po, HashMap fulfilledItems)**

- Create TPAInvoiceXDE document
- Set order metadata: poId, userId, poDate, shippingDate (current date)
- Iterate fulfilled line items
- For each item, add to invoice: categoryId, productId, itemId, lineNumber, quantity, unitPrice
- Return invoiceXDE.getDocumentAsString()

## Message Processing

**SupplierOrderMDB**

- Message-Driven Bean listening to OPC queue
- onMessage(Message msg) entry point
- Extracts TextMessage content (serialized PO XML)
- Delegates to OrderFulfillmentFacadeEJB via processPO()
- Returns XML invoice for subsequent processing

## Inventory Update Screen Implementation

The displayinventory.jsp renders the inventory update UI with the following JSP structure:

- DisplayInventoryBean retrieves current inventory via getInventory()
- Authorization check: request.isUserInRole("administrator")
- HTML table with dynamic item iteration
- Form posts to RcvrRequestProcessor with action="updateinventory"
- Form field naming: qty*<itemId> for new quantity, item*<itemId> for checkbox

## Supplier Home Page Implementation

The index.jsp provides navigation with:

- Display Inventory form posting to RcvrRequestProcessor
- Logout form posting to RcvrRequestProcessor
- User role-based access control via request.isUserInRole()

## Transaction Management

- ProcessAnOrder: Container-managed transaction with Required attribute
- Inventory reductions: Required transaction attribute ensures atomicity
- Message receipt: Automatic acknowledgment after successful processing

## Exception Handling

- XMLDocumentException: Raised during PO parsing or invoice creation
- ServiceLocator exceptions: Caught and wrapped in domain-specific exceptions
- RemoteException: Caught for EJB invocation failures

## Codebase findings

Everything above this line was extracted from the legacy Java EE application. Everything below it was measured against this repository during planning (SWHM-T-0182) and is the record the implementation agents read first.

| #   | Finding                                                                                                                                                                                                                                                                                                                | Evidence                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| F1  | **`orders` and `order_line_item` already exist**, with `status` on the order and `quantity`, `quantity_shipped` (NOT NULL, default 0), `unit_price`, `catid` and `productid` on the line. The line is keyed on (`order_id`, `line_number`). Nothing in group 1, 6 or 7 has to create a table or a column.              | `db/schema.ts` (`orders`, `orderLineItem`)                                           |
| F2  | **`inventory` is the only new table.** No table, column, module, route or screen in this repository mentions inventory or stock in any form.                                                                                                                                                                           | `grep -ril inventory` over `*.ts`/`*.tsx` — no hit outside `openspec/`               |
| F3  | **The order status vocabulary is already fixed, and has four values**, not two: `PENDING`, `APPROVED`, `COMPLETED`, `DENIED`. It is a `const` tuple plus a derived union, owned by the administrative capability.                                                                                                      | `admin/types.ts` (`ORDER_STATUSES`, `OrderStatus`)                                   |
| F4  | **An order is already created as `PENDING`**, inside one `db.transaction` that also writes the line items and clears the cart. `quantity_shipped` is never set, so every line starts at 0 by column default.                                                                                                           | `order/order.ts` (`placeOrder`, `createLineItems`)                                   |
| F5  | **The administrator role model exists and is enforced in three places**: `auth_users.role`, the `requiresRole` field on a protected-resource entry (which protects a whole subtree by path prefix), the server guard for `/api/admin`, and the client route guard. The idea text saying no role model exists is stale. | `auth/protected-resources.ts`, `admin/request.ts`, `src/components/RequireAdmin.tsx` |
| F6  | **A batch mutation over a list of ids already has a precedent**, including the shape that reports unknown ids rather than dropping them: `{ updated, notFound }`, computed inside one `db.transaction`.                                                                                                                | `admin/order-status.ts` (`updateOrderStatus`)                                        |
| F7  | **A read-only admin table screen already exists** and is the shape the inventory screen departs from: `AdminShell` + `RequireAdmin` + the `Table` primitives, fetching the session and its data in two effects.                                                                                                        | `src/pages/admin/orders.tsx`                                                         |
| F8  | **There is no input or checkbox primitive.** `src/components/ui/` holds exactly `button` and `table`. Every form in the product uses a native `<input>` with a shared class string.                                                                                                                                    | `src/components/ui/`, `src/pages/customer.tsx` (`inputClassName`)                    |
| F9  | **`DESIGN.md § Tabular data` states the read-only half of the table rule only** — "where a table is read-only, it renders no control at all". It says nothing about a table whose rows are editable, which is what this change introduces first.                                                                       | `DESIGN.md § Tabular data`                                                           |
| F10 | **A new server-side directory must be registered in three lists**, all naming directories literally: the Vitest `server` project's `include`, the `client` project's `exclude`, and `tsconfig.node.json`'s `include`. Registering in one and not the others is the documented failure mode.                            | `vitest.config.ts`, `tsconfig.node.json`                                             |
| F11 | **`db.transaction()` is the established atomicity mechanism**, and the reasoning for it against an EJB `trans-attribute: Required` descriptor is already written down: `bun:sqlite` is single-connection, so what a transaction gives is all-or-nothing, not isolation from a concurrent writer.                       | `catalog/transaction.ts`, `admin/order-status.ts`, `order/order.ts`                  |
| F12 | **There is no message broker, no queue and no asynchronous delivery of any kind.** `package.json` carries no broker dependency, and the architecture document records that the application talks to no third-party service at runtime except the payment stub.                                                         | `package.json`, `ARCHITECTURE.md § Integration points`                               |
| F13 | **No XML is produced or parsed anywhere in the product.** There is no XML dependency and no serializer; every response is JSON.                                                                                                                                                                                        | `package.json`, `routes/api/**`                                                      |
| F14 | **Demo data is seeded in `db/client.ts` under an explicit `!process.env.VITEST` guard**, and the catalogue seed is deliberately skipped under Vitest so no assertion is unknowingly checked against seed rows.                                                                                                         | `db/client.ts`                                                                       |
| F15 | **The `legacy:` field on a protected-resource entry is a provenance label, not a route.** No legacy URL is served or redirected anywhere; the one legacy-path spec asserts that inherited scaffold paths fall through to the not-found screen.                                                                         | `auth/protected-resources.ts`, `e2e/legacy-routes.spec.ts`                           |
| F16 | **CI already triggers on push and pull request to `vortex/**`, `dev`and`main`\*\*, and its single job runs lint, typecheck, the unit tier and the browser tier with a real Chromium. No ticket in this sprint edits it.                                                                                                | `.github/workflows/ci.yml`                                                           |
| F17 | **There is no logging facility.** One `console.log` survives in the template's example route; nothing else in `routes/`, `middleware/` or any capability module logs at all.                                                                                                                                           | `grep -rn "console\." routes/ middleware/ auth/ admin/ order/ payment/ cart/`        |

## Spec discrepancies

The specification above was extracted from a legacy Java EE application, so each row below is a place where it names something this repository does not contain or contradicts. **None was resolved by editing the delta spec** — the spec of record keeps its extracted wording, and the deviation is recorded here and as a comment on the affected ticket.

| #   | The spec asserts                                                                                                                                                       | This repository                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | _Receive purchase orders asynchronously via JMS queue_, and group 2 in full: a `SupplierOrderMDB`, a `javax.jms.Queue`, `onMessage(Message)`, a `TextMessage` payload. | There is no broker and none is introduced (F12); the idea's own § Out of Scope excludes one explicitly. The queue becomes a request: `POST /api/fulfillment/process` takes `{ orderId }`, and the handler is what "extracts the message content and processes the order". The scenario observes reception and processing, both of which hold; only the transport differs.                                     |
| S2  | Group 2 and 4.8: `ejb-jar.xml` `message-driven-destination`, `transaction-type Container`, a JMS `resource-ref` in `web.xml`, `trans-attribute: Required`.             | No EJB container, no deployment descriptors. The atomicity the descriptors bought is `db.transaction()` (F11). The "Inventory reduction is atomic" scenario is satisfied by the reduction running inside the fulfilment transaction, which is what makes the change all-or-nothing and durable.                                                                                                               |
| S3  | Group 1 (1.1, 1.2, 1.4, 1.6), group 6 (6.1, 6.2, 6.5) and group 7 (7.1, 7.2): create the order, line-item and status entities and their relationships.                 | All of it already exists (F1, F3, F4). Only `inventory` is new (F2). Those checkboxes are satisfied by confirming the existing shape with a test, never by redefining a table — `ARCHITECTURE.md § Key Decisions` already binds this capability to extend `orders`/`order_line_item` rather than introduce a parallel set.                                                                                    |
| S4  | Order status is an enumeration of two values, `PENDING` and `COMPLETED`.                                                                                               | The vocabulary is four values and is owned by `admin/types.ts` (F3). `fulfillment/` imports `OrderStatus` and never redefines it. `APPROVED`/`DENIED` belong to swhm-i-0011 and are untouched here.                                                                                                                                                                                                           |
| S5  | `getPoStatus()` / `setPoStatus()` accessors, `InventoryEJB.reduceQuantity()`, `HashMap` of fulfilled items, `LineItemLocal`, `InventoryLocal`.                         | Java bean and container types. The behaviour is kept and the shapes are TypeScript: columns read and written through Drizzle, an array of fulfilled lines instead of a `HashMap`. Nothing named `*Local` or `*EJB` is created.                                                                                                                                                                                |
| S6  | _Skip already-shipped line items_ — the second scenario is titled "Partially shipped items are skipped" but its GIVEN is `quantity=50, quantityShipped=50`.            | Both scenarios describe a **fully** shipped line. The extracted rule is `quantityShipped != quantity` → process, and fulfilment sets `quantityShipped = quantity`, so a line ships whole or not at all (D3). "Partial fulfilment" in this capability means some **lines** shipped and others did not — never part of one line. No code branch distinguishes a partially shipped line, because none can arise. |
| S7  | _Generate XML invoices_ — a `TPAInvoiceXDE` document, `getDocumentAsString()`, and `XMLDocumentException` (5.2, 5.7, 10.3).                                            | There is no XML dependency and no XML anywhere in the product (F13). The invoice is built as a string by one module with its own escaping, and the exception becomes a typed error in `fulfillment/errors.ts`. XML is kept rather than swapped for JSON because the document's format is what the requirement names; nothing receives it either way (the idea's § Out of Scope: no trading partner exists).   |
| S8  | 8.7 and its scenario: _the form SHALL POST to `RcvrRequestProcessor` with `action=updateinventory`_; 8.3 `displayinventory.jsp`; 9.1 `index.jsp`.                      | No JSP and no servlet. The screens are React pages at `/supplier` and `/supplier/inventory` (the routes the wireframes name), writing through `POST /api/supplier/inventory`. The scenario is read as "the form submits the selected rows to the endpoint that updates inventory". No legacy URL is served or redirected — the `legacy:` field in the resource list is a provenance label only (F15).         |
| S9  | 8.8 and its scenario: `request.isUserInRole("administrator")` gates the screen. The idea text adds that no role model exists yet.                                      | The role model **does** exist and is enforced in three places (F5); the idea text predates swhm-i-0006. The scenario holds as written in substance: the page is guarded by `RequireAdmin`, its endpoints by the shared server guard, and the `/supplier` subtree is a `requiresRole` entry in the resource list.                                                                                              |
| S10 | 9.5, "implement role-based navigation", and the home page's logout form.                                                                                               | The whole `/supplier` subtree requires the administrator role, so there is no anonymous or non-administrator variant of the page to navigate differently — the navigation is role-based by being unreachable without the role. Logout posts to the existing `POST /api/signon/logout`; no new session mechanism.                                                                                              |
| S11 | 10.1 "configure message selector for OPC queue messages" and 10.2 "implement retry logic for failed PO processing".                                                    | With no queue (S1) a message selector is request validation: a body that is not `{ orderId: number }` is refused. Retry is idempotence: re-running the pass skips lines already shipped (D3), so a repeated request cannot double-deduct stock. That property is asserted, not assumed.                                                                                                                       |
| S12 | 10.5 "implement proper error logging".                                                                                                                                 | The product has no logging facility (F17). `console.error` at the route boundary is the only mechanism present; introducing a logging dependency is a decision nobody has taken and is not taken here.                                                                                                                                                                                                        |
| S13 | `proposal.md § Risk`: "inventory quantity reductions occur without persistence check — race conditions possible".                                                      | `bun:sqlite` is a single-connection embedded database (F11), so the concurrent-writer race the legacy container could suffer has no counterpart. What remains — a reduction and a shipped-quantity write disagreeing after a partial failure — is what the transaction removes.                                                                                                                               |
| S14 | Nothing in the extracted text says where inventory quantities come from for an item that has never been stocked.                                                       | A missing `inventory` row reads as quantity 0, so an unstocked item is never fulfilled and is still listed on the screen (D5). The development database seeds a starting quantity per catalogue item, under the same `!process.env.VITEST` guard as the catalogue itself (F14), so tests never inherit stock they did not create.                                                                             |

## Decisions

- **D1 — The queue is a request.** `POST /api/fulfillment/process` replaces `SupplierOrderMDB`; no broker, no bean, no descriptor. The capability keeps the shape the legacy system had — a caller hands over an order id and gets an invoice or nothing back — and loses only the transport. See S1, S2.
- **D2 — One fulfilment pass is one `db.transaction`.** Inventory reduction, shipped-quantity writes and the status transition commit together or not at all, which is what the atomicity scenario asserts and what makes a failed pass safe to retry. See S2, S13, F11.
- **D3 — A line ships whole or not at all; stock is reduced at fulfilment, never reserved at placement.** `checkInventory` compares the held quantity against the line's **full** quantity, and a successful check sets `quantityShipped = quantity`. An order therefore reaches `COMPLETED` only when every line has shipped, and re-running the pass ships whatever has since become available. This is what makes the pass idempotent (S11) and what "multiple partial shipments" means here (S6).
- **D4 — `fulfillment/` is a new top-level capability directory**, registered in all three lists (F10). It is not `utils` and not under a directory Nitro scans, per the standing rule in `ARCHITECTURE.md § Key Decisions`.
- **D5 — A missing inventory row means zero, not an error.** The screen lists every catalogue item whether or not it has been stocked, and an unstocked item simply never passes a check. The alternative — requiring a row per item — makes adding a catalogue item a two-table operation that a capability outside this one would have to remember. See S14.
- **D6 — `fulfillment/types.ts` and `fulfillment/errors.ts` are written whole by the first ticket and never extended by a later ticket in this sprint**, the rule adopted after three tickets appended to one shared type file with no dependency edge between them.
- **D7 — The invoice is produced and returned, never sent.** It is a string returned by the pass and echoed by the route; nothing stores it and nothing transmits it, because no trading partner exists (idea § Out of Scope). Persisting it would be a second source of truth for what shipped, which the line items already record.
- **D8 — The inventory screen is the product's first editable table, and the pattern is documented once**, in `DESIGN.md § Tabular data`, alongside the read-only rule it complements (F9). A pattern decided per screen is a pattern three screens disagree about.
- **D9 — Only ticked rows are written.** The submission carries the rows the administrator selected and nothing else, so an untouched row cannot be overwritten by a stale value the screen was rendered with. Unknown item ids are reported, not dropped, following the established batch shape (F6).

## Phases

1. **Data model, capability module and its registrations** — the `inventory` table and its migration, `fulfillment/types.ts` and `fulfillment/errors.ts` written whole, the three registrations, the development seed, and a test confirming the existing order/line-item shape rather than redefining it (D4, D5, D6; S3). (Group 1)
2. **Per-concern fulfilment modules, built in parallel** — inventory check and reduction, invoice generation, the status transition, and line-item shipment tracking. Four modules, four owners, no shared file (D2, D3, D7). (Groups 4, 5, 6, 7)
3. **The fulfilment pass** — the orchestrator that iterates the lines, skips what has shipped, calls the four modules and returns the invoice or null (D2, D3). (Group 3)
4. **The entry point and its access rules** — `POST /api/fulfillment/process` and the three protected-resource entries the whole capability needs (D1, S9). (Group 2)
5. **The supplier screens** — the home page and the editable inventory table with its two endpoints, built from the exported mockups (D8, D9; S8, S9, S10). (Groups 9, 8)
6. **Integration, failure behaviour and the browser journey** — request validation, error mapping and logging at the route boundary, the idempotence assertion, and the Playwright spec for the administrator's path through both screens (S11, S12). (Group 10)
7. **Test harness** — no new harness is required. Vitest's two projects and Playwright already cover every tier; the only registration this change owes is `fulfillment/**` in the `server` include, the `client` exclude and `tsconfig.node.json`, which is phase 1's work (F10, D4). Module tests sit beside the modules they cover; the two screens' tests are `client` tests because they live under `src/`, and both route directories are already matched by the `server` project's `routes/**/*.test.ts` entry.
8. **CI** — unchanged and verified, not assumed: the workflow already triggers on push and pull request to `vortex/**`, `dev` and `main`, and its single job runs lint, typecheck, the unit tier and the browser tier with a real Chromium (F16). No ticket in this sprint edits it.

## Design references

Exported from idea SWHM-I-0010 (doc version 8, frozen) to `artifacts/SWHM-S-0017/design/`: `wireframe-supplier-home.html`, `wireframe-inventory-update.html`, `mockup-supplier-home.html`, `mockup-inventory-update.html`, with `MANIFEST.md` alongside them.

Build from the mockups. They fix the inventory table's four columns in order — Item ID · Existing quantity · New quantity · Update — the per-row text input and checkbox, the **Update Inventory** control outside the table, and the hint that only ticked rows are written. The wireframes carry the same layout unfinished and are the only place two facts appear: the routes the screens sit at (`/supplier`, `/supplier/inventory`), and the loading state — heading kept, list replaced by a `role="status"` region reading "Loading inventory…".

These designs are the authority for both screens; the extracted `## Inventory Update Screen Implementation` and `## Supplier Home Page Implementation` sections above describe the JSPs being replaced, not what to build (S8).
