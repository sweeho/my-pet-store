# Order Approval Workflow — Design Document

## Approval Decision Logic

**Auto-Approval Thresholds** (canIApprove method)

- US locale orders: total price < $500 USD → AUTO APPROVED
- Japan locale orders: total price < ¥50,000 JPY → AUTO APPROVED
- All other orders: remain PENDING (require manual approval)

**Manual Approval Workflow**

- PurchaseOrderMDB receives order via message queue
- Checks canIApprove() to determine auto-approval
- If approved: creates OrderApproval and triggers doTransition
- If denied: order status set to DENIED
- If pending: order waits for manual approval via OrderApprovalMDB

## Order Status Validation

**Status Guard (OrderApprovalMDB.doWork)**

- Only PENDING orders are eligible for approval/denial
- If order status is already APPROVED, DENIED, or COMPLETED: skip processing
- Prevents duplicate processing and race conditions
- Guard is enforced via: `if(!curStatus.equals(OrderStatusNames.PENDING)) continue;`

## Order Approval States

- PENDING: Order awaiting approval/denial
- APPROVED: Order approved and supplier PO generated
- DENIED: Order rejected and not fulfilled
- COMPLETED: Order fully shipped

## Admin Approval Screen Implementation

**OrdersApprovePanel** (Rich Client Component)

- Displays table of pending orders from server
- Columns: Order ID, User ID, Order Date, Order Amount, Status
- Status column is editable via dropdown selector (PENDING, APPROVED, DENIED)
- Three buttons: Approve (set selected to APPROVED), Deny (set selected to DENIED), Commit
- Color-coded status cells:
  - Green: APPROVED
  - Red: DENIED
  - Yellow: PENDING

**OrdersApprovePanel Technical Details**

- Lines 79-89: Panel setup with createUI()
- Lines 82-84: Combo box definition with three status options
- Lines 149-151: Status column cell editor configured
- Lines 92-138: Button definitions and action listeners
- Lines 154-171: Status renderer with color logic

## Supplier PO Generation on Approval

**getXmlPO() Method**

- Called only for APPROVED orders
- Creates TPASupplierOrderXDE XML document
- Includes order metadata: poId, poDate
- Sets shipping address: givenName, familyName, street, city, state, country, zipCode, email, telephone
- Iterates line items and adds: categoryId, productId, itemId, lineNumber, quantity, unitPrice
- Returns serialized XML string

**Approval Transition**

- OrderApprovalMDB.doWork() calls getXmlPO() for each approved order
- XML added to supplierPoList
- doTransition() sends via OrderApprovalTD to supplier queue (Supplier Approval)

## Denial Workflow

- Denied orders set status to DENIED via processManager
- Denial notifications queued for customer
- Order is terminal in DENIED state (no further processing)

## Integration Points

**Message-Driven Beans**

- PurchaseOrderMDB: receives orders, checks auto-approval
- OrderApprovalMDB: receives approval decisions, validates status, generates supplier PO
- Declarative transaction management with Required attribute

**Process Manager**

- getStatus(orderId): retrieves current order status
- updateStatus(orderId, newStatus): transitions status

**Notification System**

- OPC-APPROVAL-NOTIFICATION: sent on approval
- OPC-COMPLETION-NOTIFICATION: sent on denial (or completion)

## Data Model

**Purchase Order Entity**

- poId: Order ID (PK)
- totalPrice: Order amount
- locale: Customer locale (US, Japan, etc.)
- status: Current status (PENDING, APPROVED, DENIED, COMPLETED)
- poDate: Order date
- lineItems: Collection of line items

**Order Approval Transfer Object**

- OrderId, OrderStatus, approval decision
- Transferred via XML message queue

## Codebase findings

Everything above this line was extracted from the legacy Java EE application. Everything below it was measured against this repository during planning (SWHM-T-0199) and is the record the implementation agents read first.

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                             | Evidence                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| F1  | **The `orders` table, its four-value status vocabulary and its status index already exist.** `orders` carries `order_id`, `user_name`, `order_date`, `order_amount`, `status` and the two copied address blocks; `orders_status_idx` exists precisely because the queue query filters on status. The idea text saying `db/schema.ts` "stops at the catalogue — there is no order row, no status" predates swhm-i-0008 and is stale. | `db/schema.ts` (`orders`, `orderLineItem`), `admin/types.ts` (`ORDER_STATUSES`)         |
| F2  | **An order is already created as `PENDING`**, inside one `db.transaction` that also writes the line items and clears the cart. Nothing decides anything about the order after that — there is no approval step of any kind.                                                                                                                                                                                                         | `order/order.ts` (`placeOrder`)                                                         |
| F3  | **The pending-orders list endpoint already exists and already serves `PENDING`.** `GET /api/admin/orders?status=PENDING` pages with `limit count + 1` and returns `{ items, hasNext }`. No new read endpoint is needed.                                                                                                                                                                                                             | `routes/api/admin/orders/index.get.ts`, `admin/orders.ts` (`getOrdersByStatus`)         |
| F4  | **A batch status-write endpoint already exists**, at `POST /api/admin/orders/status`, taking `{ orderIds, status }` and returning `{ updated, notFound }` from inside one `db.transaction`. The idea text proposing `routes/api/admin/orders/index.post.ts` names a file that would collide with this one's purpose.                                                                                                                | `routes/api/admin/orders/status.post.ts`, `admin/order-status.ts`                       |
| F5  | **That batch write applies no status guard.** `updateOrderStatus` writes the requested status onto every id it matches, whatever the current status is — a `COMPLETED` order can be set back to `PENDING` today. This is the concrete gap the "only pending orders" requirement closes, and it is a live one.                                                                                                                       | `admin/order-status.ts:26-48`                                                           |
| F6  | **An admin orders screen already exists and is read-only by construction**, and it deliberately excludes `PENDING` with a comment naming this change as the owner of what happens to pending orders. It is not the screen this change builds; it is the screen this change's page sits beside.                                                                                                                                      | `src/pages/admin/orders.tsx:17-20`                                                      |
| F7  | **There is no `locale` anywhere on an order.** The product's locale vocabulary is `LANGUAGES = ["en_US", "ja_JP", "zh_CN"]`, and the only per-person locale the database holds is `profiles.preferred_language`. There is no `java.util.Locale`, no country field on an order, and no currency column.                                                                                                                              | `db/schema.ts` (`orders`, `profiles`), `account/vocabulary.ts:4`                        |
| F8  | **`order_amount` is a single `real` with no currency**, and no conversion exists anywhere in the product. Money representation is explicitly provisional.                                                                                                                                                                                                                                                                           | `db/schema.ts`, `ARCHITECTURE.md § Data model`, `PRODUCT.md § Not yet decided`          |
| F9  | **No supplier purchase order exists in any form** — no table, no module, no route, no screen. `grep -ri supplier` over the schema and `fulfillment/` returns nothing. The fulfilment capability reads `orders`/`order_line_item` directly.                                                                                                                                                                                          | `db/schema.ts`, `fulfillment/`                                                          |
| F10 | **No notification infrastructure exists at all** — zero matches for "notification" in application code. `swhm-i-0012` is an unstarted change directory, not shipped code.                                                                                                                                                                                                                                                           | `grep -ril notification` over `*.ts`/`*.tsx` outside `openspec/` and `legacy-analysis/` |
| F11 | **There is no message broker, no queue and no XML.** No broker dependency, no XML dependency, no serializer; every response is JSON. `ARCHITECTURE.md § Key Decisions` already binds every ported async capability to arrive as a request instead.                                                                                                                                                                                  | `package.json`, `ARCHITECTURE.md § Integration points`, § Key Decisions                 |
| F12 | **`order/` (singular) already exists and is already registered in all three lists** — the Vitest `server` project `include`, the `client` project `exclude`, and `tsconfig.node.json`'s `include`. Putting this capability's modules there means no configuration change at all; creating a second `orders/` directory would mean three registrations and a directory pair a reader has to disambiguate.                            | `vitest.config.ts:48,68`, `tsconfig.node.json:27`                                       |
| F13 | **`db.transaction()` is the established atomicity mechanism, and the reasoning against an EJB `trans-attribute` descriptor is already written down** in this repository: `bun:sqlite` is single-connection, so what a transaction buys is all-or-nothing, not isolation from a concurrent writer.                                                                                                                                   | `admin/order-status.ts:4-10`, `catalog/transaction.ts`, `order/order.ts`                |
| F14 | **The `/admin` and `/api/admin` protected-resource entries guard by path prefix**, so a new page under `/admin/` and a new endpoint under `/api/admin/` are protected by existing configuration. No resource-list change is owed by this change.                                                                                                                                                                                    | `auth/protected-resources.ts` (`matchesResource`)                                       |
| F15 | **`src/components/ui/` holds `button` and `table`**, not `button` alone as the idea text says. The table primitives are real semantic elements with no variants file — the documented exception to the CVA pattern. There is no select, dropdown or checkbox primitive.                                                                                                                                                             | `src/components/ui/`, `DESIGN.md § Components`                                          |
| F16 | **`DESIGN.md § Tabular data` already specifies the editable-table pattern in full** — per-row controls carrying a row-naming accessible name, selection separate from editing, one submit control outside the table. It was written for the inventory screen and this screen inherits it unchanged.                                                                                                                                 | `DESIGN.md § Tabular data`                                                              |
| F17 | **The status tints the mockup uses are not tokens yet.** The mockup's own stylesheet marks them `/* status tints — proposed, not yet in the token file */`; `src/index.css` has no `--status-*` custom property in either theme.                                                                                                                                                                                                    | `artifacts/SWHM-S-0018/design/mockup-orders-approval.html`, `src/index.css`             |
| F18 | **Token contrast has an automated check to extend**, covering distinctness in both themes and the AA ratio in light, currently for the destructive pair only.                                                                                                                                                                                                                                                                       | `src/theme-tokens.test.ts`, `DESIGN.md § Contrast`                                      |
| F19 | **Demo orders are seeded spanning every `OrderStatus`, including `PENDING`**, under a `!process.env.VITEST` guard, so the development database and the browser tier have pending orders to act on and no unit assertion inherits seed rows.                                                                                                                                                                                         | `db/client.ts`                                                                          |
| F20 | **`fulfillment/status.ts` moves any order that is not already `COMPLETED` to `COMPLETED`** — it does not require `APPROVED`. A `PENDING` or `DENIED` order can be completed through `POST /api/fulfillment/process` today.                                                                                                                                                                                                          | `fulfillment/status.ts:24-33`                                                           |
| F21 | **CI already triggers on push and pull request to `vortex/**`, `dev`and`main`\*\*, and its single job runs lint, typecheck, the unit tier and the browser tier with a real Chromium. No ticket in this sprint edits it.                                                                                                                                                                                                             | `.github/workflows/ci.yml`                                                              |
| F22 | **There is no logging facility.** One `console.log` survives in the template's example route; nothing else in `routes/`, `middleware/` or any capability module logs.                                                                                                                                                                                                                                                               | `grep -rn "console\." routes/ middleware/ order/ admin/`                                |

## Spec discrepancies

The specification above was extracted from a legacy Java EE application, so each row below is a place where it names something this repository does not contain or contradicts what it does contain. **None was resolved by editing the delta spec** — the spec of record keeps its extracted wording, and the deviation is recorded here and as a comment on the affected ticket.

| #   | The spec asserts                                                                                                                                                                                                                   | This repository                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Group 8 in full, and the `## Integration Points` section: `OrderApprovalMDB` and `PurchaseOrderMDB` as message-driven beans, a JMS `Approval` queue, a message selector, `onMessage()`, and a `Required` transaction attribute.    | There is no broker and none is introduced (F11). `ARCHITECTURE.md § Key Decisions` already settled this for every ported async capability: the queue becomes a request. The batch of decisions arrives at `POST /api/admin/orders/decisions`; `onMessage()` is the handler, the "message selector" is body validation, and the transaction attribute is `db.transaction()` (F13, D6). The scenarios observe that decisions are received and applied, and both hold.                                                                                                        |
| S2  | Group 4 in full, and the "Supplier PO is sent to supplier queue" scenario: a `TPASupplierOrderXDE` XML document, `getDocumentAsString()`, and delivery on a supplier queue.                                                        | No XML dependency and no queue exist (F11). The PO is persisted as `supplier_po` + `supplier_po_line_item` rows carrying exactly the fields the requirement enumerates (F9, D4). "Sent to the supplier queue for fulfillment processing" is satisfied by the record existing where the fulfilment capability reads it — the same substitution `swhm-i-0010` made for its own queue, one sprint earlier.                                                                                                                                                                    |
| S3  | Group 5, group 6 and the `## Admin Approval Screen Implementation` section: `OrdersApprovePanel`, `createUI()`, a Swing combo-box cell editor, `DefaultTableCellRenderer`, `setValue()`, and line numbers into a Java source file. | No rich client exists and `PRODUCT.md § Non-goals` forbids one outright — the replacement is a page in the application already being served. The panel becomes `src/pages/admin/orders-approval.tsx`, the combo-box cell editor a per-row status control, and the cell renderer a token-driven status cell (D8, D9). The line numbers describe the file being replaced, not anything to build.                                                                                                                                                                             |
| S4  | `## Data Model`: a Purchase Order entity carrying `locale`, and "Locale comparison uses object equality (`Locale.US`)".                                                                                                            | Nothing on an order records a locale (F7) and `java.util.Locale` has no counterpart. The product's locale vocabulary is `en_US`/`ja_JP`/`zh_CN`, and the two thresholds key off those strings. A `locale` column is added to `orders` and written at placement (D2) — reading `profiles.preferred_language` at decision time instead would let a customer move their own order across the threshold by changing their language after checkout, which the standing "an order records what was agreed" decision forbids.                                                     |
| S5  | Two thresholds in two currencies — `$500 USD` and `¥50,000 JPY` — compared against one `totalPrice` field.                                                                                                                         | `order_amount` is a single `real` with no currency and no conversion exists anywhere (F8). The decision selects the threshold by the order's locale and compares it against that one figure, which is exactly what the extracted code did. This is not a currency conversion and must not be implemented as one; which figure an order's amount actually is remains open (`PRODUCT.md § Not yet decided`).                                                                                                                                                                 |
| S6  | Group 9: a `ProcessManager` with `getStatus(orderId)` and `updateStatus(orderId, newStatus)`, "transactionally consistent".                                                                                                        | There is no process-manager component and no repository layer — routes and capability modules read Drizzle directly (`ARCHITECTURE.md § Data model`). The two methods become `order/status.ts` (the read plus the guard) and the batch applier in `admin/order-status.ts` that wraps the whole decision set in one `db.transaction` (D3, D6).                                                                                                                                                                                                                              |
| S7  | Group 3.2 and `## Data Model`: an `OrderApproval` transfer object "transferred via XML message queue".                                                                                                                             | With no queue there is nothing to serialize across (S1). The decision is a plain typed value — `{ orderId, status }` — carried in the request body and through `order/approval-types.ts`. No transfer-object class, no XML.                                                                                                                                                                                                                                                                                                                                                |
| S8  | Group 2.5, "log skipped orders for audit trail".                                                                                                                                                                                   | The product has no logging facility (F22) and `PRODUCT.md § Non-goals` excludes an audit trail of administrative actions. The skip is made **observable in the response** instead — a skipped order is reported back in the batch result rather than silently dropped, which is what the four "SHALL be skipped and not re-processed" scenarios can actually be checked against. No logging dependency is introduced.                                                                                                                                                      |
| S9  | Group 10.5, "handle notification errors gracefully", and `## Notification System`: `OPC-APPROVAL-NOTIFICATION` and `OPC-COMPLETION-NOTIFICATION` sent to a mail MDB.                                                               | Nothing sends email and no notification infrastructure exists (F10). A notification is a row recording that one is owed; `swhm-i-0012` owns delivery. Writing a row inside the decision transaction has no failure mode to handle gracefully other than the transaction's own rollback, so 10.5 is satisfied by the notification sharing the decision's atomicity rather than by a retry path. Note the extracted text sends the **completion** notification on denial, which the delta spec's own scenario corrects to a denial notification; the delta spec is followed. |
| S10 | The "Completed orders are skipped" scenario, and the state diagram's `APPROVED --> COMPLETED`.                                                                                                                                     | `fulfillment/status.ts` moves any non-`COMPLETED` order to `COMPLETED` without requiring `APPROVED` (F20), so a `PENDING` or `DENIED` order can be completed through the fulfilment endpoint. That is outside this change's delta — no requirement here governs the fulfilment transition — so it is **not** fixed under this change; it is raised as a defect against `fulfillment-management`.                                                                                                                                                                           |
| S11 | The requirement "Only purchase orders in PENDING status SHALL be eligible for administrator approval or denial ... SHALL be rejected and not re-processed".                                                                        | Two endpoints write `orders.status`. The new decisions endpoint applies the guard. The **existing** `POST /api/admin/orders/status` does not (F5), and it is specified by `admin-operations`, whose own requirement says nothing about terminal states — so bringing it under the guard would change another capability's behaviour with no delta authorising it. It is left as specified and raised as an improvement proposing a `MODIFIED` delta on `admin-operations`. The approval path this change owns is guarded end to end.                                       |
| S12 | `proposal.md § Risk`: "Race condition possible if same order approved multiple times", and "Manual approval screen is rich client only (not web-based)".                                                                           | `bun:sqlite` is a single-connection embedded database (F13), so the concurrent-writer race has no counterpart. What remains — a second decision arriving later for an order already decided — is exactly what the guard refuses (D7). The rich-client risk is resolved by `PRODUCT.md § Non-goals`, not carried.                                                                                                                                                                                                                                                           |
| S13 | `proposal.md § Risk`: "Auto-approval thresholds are hardcoded without configuration" and "No audit trail of who approved/denied orders".                                                                                           | Both are kept as they are. The thresholds stay literals — no configuration mechanism exists and inventing one for two numbers no screen shows is scope nobody asked for. The audit trail is an explicit `PRODUCT.md § Non-goals` entry; this change records what an order's state is, never who moved it.                                                                                                                                                                                                                                                                  |
| S14 | The idea text: `db/schema.ts` has no order row or status; `src/pages/` has no admin screen; `src/components/ui/` contains only `button.tsx`; the capability needs a new `orders/` directory registered in `vitest.config.ts`.      | All four are stale (F1, F3, F4, F6, F12, F15). The orders tables, the pending-list endpoint, a batch write endpoint and a read-only admin orders screen all shipped in earlier sprints, `table.tsx` exists, and `order/` is already registered in all three lists — this change adds **no** configuration entry.                                                                                                                                                                                                                                                           |

## Decisions

- **D1 — The approval decision is a pure function of locale and amount, and nothing else.** `order/approval.ts` takes a locale string and a total and returns `APPROVED` or `PENDING`; it reads no database, resolves no session and converts no currency. The thresholds are literals keyed by the product's own language vocabulary, never `java.util.Locale` (S4, S5). A locale that matches no threshold — including a null one — returns `PENDING`, which is the requirement's own default branch rather than a special case.
- **D2 — An order records the locale it was placed under.** `orders.locale` is nullable and written at placement from `profiles.preferred_language`. This follows the standing decision in `ARCHITECTURE.md § Key Decisions` that an order records what was agreed: resolving the locale at decision time instead would let a customer move their own order across the threshold by changing their language after checkout. Nullable because every order already in the database has none, and a null reads as "no threshold applies" without a migration backfill that would be inventing history.
- **D3 — The guard is a predicate over the current status, and a skip is reported rather than raised.** `APPROVED`, `DENIED` and `COMPLETED` are terminal; only `PENDING` is decidable. A decision for a terminal order returns a skip in the batch result — not an error, not a silent drop — which is how the four "SHALL be skipped and not re-processed" scenarios become observable without a logging facility (S8).
- **D4 — The supplier purchase order is two rows, not a document.** `supplier_po` holds the order id, the PO date and the shipping address snapshot; `supplier_po_line_item` holds one row per line with `catid`, `productid`, `itemid`, line number, quantity and unit price. Both copy from the order rather than joining back to it at read time, for the same reason the order copies from the account (§ Key Decisions). The PO exists where the fulfilment capability can read it, which is what "sent to the supplier queue" means here (S2).
- **D5 — A notification is a row that records what is owed, and nothing sends it.** `notifications` holds the order id, the kind (`APPROVAL` or `DENIAL`), the recipient email copied from the order, and when it was queued. `swhm-i-0012` owns delivery. "Queued" is the verb both scenarios use and a row is exactly that; a delivery mechanism built here would be a boundary with nothing on the other side of it (S9).
- **D6 — One committed batch is one `db.transaction`.** Every decision in the batch — guard read, status write, supplier PO, notification — commits together or not at all. This is the established shape (F13) and it is what the legacy container's `Required` transaction attribute bought (S1). A batch that is refused leaves no order moved, no PO written and no notification queued.
- **D7 — Re-deciding is safe because of the guard, not because of a retry mechanism.** Committing the same decision twice moves nothing the second time, writes no second supplier PO and queues no second notification. `ARCHITECTURE.md § Key Decisions` transfers this obligation to every capability that lost a queue: because nothing retries, the operation itself must be safe to repeat (S12).
- **D8 — The Orders Approval screen is a new page, not a mode on the existing one.** `/admin/orders` is read-only by construction and excludes `PENDING` deliberately (F6), and `DESIGN.md § Tabular data` makes read-only and editable tables different components under one rule — a read-only table renders no control at all, an editable one carries per-row controls and a submit outside the table. The new page is `src/pages/admin/orders-approval.tsx` at `/admin/orders-approval`, protected by the existing `/admin` prefix entry (F14).
- **D9 — Status colour is three token triples, and colour is never the only cue.** `--status-{pending,approved,denied}-{bg,fg,border}` go into `src/index.css` in both themes and the `@theme inline` block, exactly as the mockup names them (F17), and into `DESIGN.md` as a standing part of the system. The status **text** stays in the cell: WCAG 1.4.1 forbids colour as the sole carrier of information, so "identify status without reading the text" is a claim about speed, not about the text being removable.
- **D10 — `order/approval-types.ts` is written whole by the first ticket and never appended to by a later ticket in this sprint.** The rule adopted after three tickets appended to one shared type file with no dependency edge between them (`swhm-i-0010` D6). `OrderStatus` is **not** moved: it stays in `admin/types.ts`, which `order/`, `fulfillment/` and the screens all already import from (F1).
- **D11 — This capability's modules live in the existing `order/` directory.** It is already registered in the Vitest `server` include, the `client` exclude and `tsconfig.node.json` (F12), so this change owes no configuration entry. A second top-level `orders/` would cost three registrations and leave a near-homonym directory pair for every later reader to disambiguate.

## Phases

1. **The decision and the locale it needs** — `order/approval-types.ts` written whole, the pure decision function, the `orders.locale` column and its migration, the locale written at placement, and auto-approval applied when an order is created (D1, D2, D10). (Group 1)
2. **The guard** — terminal-status vocabulary, the decidability predicate, and the status read the decision path uses (D3). (Group 2)
3. **The decision applier** — guard, then the status transition, for one order; the seam the supplier PO and the notification hang off (D3, D7). (Group 3)
4. **The records an approval produces** — the supplier PO tables and writer, then the notification table and writer, each wired into the applier in turn (D4, D5). (Groups 4, 10)
5. **The batch layer and its entry point** — the transactional batch applier, then `POST /api/admin/orders/decisions` (D6, D7; S1, S6). (Groups 9, 8)
6. **The screen** — the pending-orders table with a per-row status control, then the status tokens and the colour-coded cell, then selection with Approve / Deny / Commit and the browser journey (D8, D9; F16). (Groups 5, 6, 7)
7. **Test harness** — no new harness and no new registration. `order/**`, `admin/**` and `routes/**` are already in Vitest's `server` project; the two screen files are `client` tests by living under `src/`; Playwright already runs the browser tier on its own port. The token work extends the existing contrast test rather than adding a mechanism (F12, F18, F21). Module tests sit beside the modules they cover; a new Playwright spec covers the administrator's path through the screen (group 7).
8. **CI** — unchanged and verified, not assumed: the workflow already triggers on push and pull request to `vortex/**`, `dev` and `main`, and its single job runs lint, typecheck, the unit tier and the browser tier with a real Chromium (F21). No ticket in this sprint edits it.

## Design references

Exported from idea SWHM-I-0011 (doc version 8, frozen) to `artifacts/SWHM-S-0018/design/`: `wireframe-orders-approval.html` and `mockup-orders-approval.html`, with `MANIFEST.md` alongside them.

Build from the mockup. It fixes the screen's title ("Orders Approval"), the subheading naming the auto-approval threshold as the reason an order is on the list, the six columns in order — selection · Order ID · User ID · Order Date · Order Amount · Status — the per-row status control with its three options and their dots, the three token triples the status cells use (F17, D9), the selection summary reading "3 selected · 3 uncommitted changes", the **Approve** / **Deny** / **Commit** controls outside the table in that order, and the footnote stating that approvals generate a supplier purchase order and that both outcomes notify the customer. The wireframe carries the same layout unfinished.

These designs are the authority for the screen; the extracted `## Admin Approval Screen Implementation` section above describes the Swing panel being replaced, not what to build (S3).
